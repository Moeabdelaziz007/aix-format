import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProofVerifier, ZKProof, VerificationResult } from '../src/ProofVerifier';
import { NullifierRegistry } from '../src/NullifierRegistry';
import { groth16 } from 'snarkjs';

// Mock snarkjs groth16.verify
vi.mock('snarkjs', () => ({
  groth16: {
    verify: vi.fn()
  }
}));

describe('ProofVerifier', () => {
  let registry: NullifierRegistry;
  let verifier: ProofVerifier;
  let mockVerificationKey: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Clear environment variables
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
    
    // Create registry with 1 hour TTL
    registry = new NullifierRegistry(60 * 60 * 1000);
    
    // Mock verification key
    mockVerificationKey = {
      protocol: "groth16",
      curve: "bn128",
      nPublic: 1,
      vk_alpha_1: [],
      vk_beta_2: [],
      vk_gamma_2: [],
      vk_delta_2: [],
      vk_alphabeta_12: [],
      IC: []
    };
    
    // Create verifier with 5 minute proof expiry
    verifier = new ProofVerifier(registry, mockVerificationKey, 5 * 60 * 1000);
  });

  afterEach(() => {
    registry.dispose();
    vi.useRealTimers();
  });

  // Helper to create a valid ZK proof
  function createValidProof(overrides?: Partial<ZKProof>): ZKProof {
    return {
      proof: {
        pi_a: ["1", "2", "1"],
        pi_b: [["1", "2"], ["3", "4"], ["1", "0"]],
        pi_c: ["1", "2", "1"],
        protocol: "groth16",
        curve: "bn128"
      },
      publicSignals: ["12345"],
      nullifier: "a".repeat(64), // Valid 64-char hex string
      timestamp: Date.now(),
      ...overrides
    };
  }

  describe('Valid Proof Verification', () => {
    it('should verify a valid proof and return success (200)', async () => {
      // Mock groth16.verify to return true
      vi.mocked(groth16.verify).mockResolvedValue(true);

      const proof = createValidProof();
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
      expect(result.nullifier).toBe(proof.nullifier);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
      
      // Verify groth16.verify was called with correct parameters
      expect(groth16.verify).toHaveBeenCalledWith(
        mockVerificationKey,
        proof.publicSignals,
        proof.proof
      );
    });

    it('should register nullifier after successful verification', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);

      const proof = createValidProof();
      await verifier.verify(proof);

      // Check that nullifier was registered
      const isNullified = await registry.isNullified(proof.nullifier);
      expect(isNullified).toBe(true);
    });
  });

  describe('Invalid Proof Verification', () => {
    it('should reject invalid proof and return 400', async () => {
      // Mock groth16.verify to return false
      vi.mocked(groth16.verify).mockResolvedValue(false);

      const proof = createValidProof();
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PROOF');
      expect(result.error).toContain('Cryptographic proof verification failed');
    });

    it('should handle groth16.verify throwing an error', async () => {
      // Mock groth16.verify to throw an error
      vi.mocked(groth16.verify).mockRejectedValue(new Error('Invalid proof format'));

      const proof = createValidProof();
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PROOF');
      expect(result.error).toContain('Invalid proof format');
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject replayed proof and return 409', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);

      const proof = createValidProof();
      
      // First verification should succeed
      const result1 = await verifier.verify(proof);
      expect(result1.valid).toBe(true);

      // Second verification with same nullifier should fail
      const result2 = await verifier.verify(proof);
      expect(result2.valid).toBe(false);
      expect(result2.errorCode).toBe('REPLAY_ATTACK');
      expect(result2.error).toContain('already been used');
    });

    it('should allow different nullifiers even with same proof data', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);

      const proof1 = createValidProof({ nullifier: "a".repeat(64) });
      const proof2 = createValidProof({ nullifier: "b".repeat(64) });

      const result1 = await verifier.verify(proof1);
      const result2 = await verifier.verify(proof2);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('Malformed Input Validation', () => {
    it('should reject proof with invalid nullifier format (too short)', async () => {
      const proof = createValidProof({ nullifier: "abc123" });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_NULLIFIER');
      expect(result.error).toContain('64-character hexadecimal');
    });

    it('should reject proof with invalid nullifier format (non-hex characters)', async () => {
      const proof = createValidProof({ nullifier: "g".repeat(64) });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_NULLIFIER');
    });

    it('should reject proof with nullifier containing special characters', async () => {
      const proof = createValidProof({ nullifier: "a".repeat(63) + "!" });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_NULLIFIER');
    });

    it('should accept valid hex nullifier (lowercase)', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      const proof = createValidProof({ nullifier: "abcdef0123456789".repeat(4) });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
    });

    it('should accept valid hex nullifier (uppercase)', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      const proof = createValidProof({ nullifier: "ABCDEF0123456789".repeat(4) });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
    });

    it('should accept valid hex nullifier (mixed case)', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      const proof = createValidProof({ nullifier: "AbCdEf0123456789".repeat(4) });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
    });
  });

  describe('Timestamp Validation', () => {
    it('should reject expired proof (older than 5 minutes) and return 400', async () => {
      // Create proof with timestamp 6 minutes ago
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000);
      const proof = createValidProof({ timestamp: sixMinutesAgo });

      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');
      expect(result.error).toContain('expired');
    });

    it('should accept proof within 5 minute window', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      // Create proof with timestamp 4 minutes ago
      const fourMinutesAgo = Date.now() - (4 * 60 * 1000);
      const proof = createValidProof({ timestamp: fourMinutesAgo });

      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
    });

    it('should accept proof with current timestamp', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      const proof = createValidProof({ timestamp: Date.now() });
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(true);
    });

    it('should reject proof exactly at expiry boundary', async () => {
      // Create proof with timestamp exactly 5 minutes + 1ms ago
      const expiredTimestamp = Date.now() - (5 * 60 * 1000 + 1);
      const proof = createValidProof({ timestamp: expiredTimestamp });

      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');
    });
  });

  describe('Custom Proof Expiry Window', () => {
    it('should respect custom maxProofAge parameter', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      // Create verifier with 1 minute expiry
      const shortExpiryVerifier = new ProofVerifier(
        registry,
        mockVerificationKey,
        1 * 60 * 1000 // 1 minute
      );

      // Proof 2 minutes old should be rejected
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
      const proof = createValidProof({ timestamp: twoMinutesAgo });

      const result = await shortExpiryVerifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');
    });
  });

  describe('Integration with NullifierRegistry', () => {
    it('should use registry for replay detection', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);

      const proof = createValidProof();
      
      // Manually register nullifier
      await registry.registerNullifier(proof.nullifier, 'test-agent', Date.now());

      // Verification should detect replay
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REPLAY_ATTACK');
    });

    it('should not register nullifier if cryptographic verification fails', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(false);

      const proof = createValidProof();
      await verifier.verify(proof);

      // Nullifier should not be registered
      const isNullified = await registry.isNullified(proof.nullifier);
      expect(isNullified).toBe(false);
    });

    it('should not register nullifier if timestamp is expired', async () => {
      const expiredProof = createValidProof({ 
        timestamp: Date.now() - (6 * 60 * 1000) 
      });
      
      await verifier.verify(expiredProof);

      // Nullifier should not be registered
      const isNullified = await registry.isNullified(expiredProof.nullifier);
      expect(isNullified).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle registry errors gracefully', async () => {
      vi.mocked(groth16.verify).mockResolvedValue(true);
      
      // Mock registry to throw error
      vi.spyOn(registry, 'isNullified').mockRejectedValue(new Error('Registry error'));

      const proof = createValidProof();
      const result = await verifier.verify(proof);

      // Should return error result
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PROOF');
    });

    it('should handle verification key errors', async () => {
      vi.mocked(groth16.verify).mockRejectedValue(new Error('Invalid verification key'));

      const proof = createValidProof();
      const result = await verifier.verify(proof);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PROOF');
      expect(result.error).toContain('Invalid verification key');
    });
  });
});

// Made with Moe Abdelaziz
