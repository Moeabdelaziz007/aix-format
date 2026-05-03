import { groth16 } from 'snarkjs';
import { NullifierRegistry } from './NullifierRegistry';

/**
 * ZK Proof structure for groth16 verification
 */
export interface ZKProof {
  proof: any;  // groth16 proof object
  publicSignals: string[];  // public inputs
  nullifier: string;  // unique proof identifier
  timestamp: number;  // proof generation time
}

/**
 * Verification result with detailed error codes
 */
export interface VerificationResult {
  valid: boolean;
  error?: string;
  errorCode?: 'INVALID_PROOF' | 'REPLAY_ATTACK' | 'EXPIRED' | 'INVALID_NULLIFIER';
  nullifier?: string;
}

/**
 * ProofVerifier handles cryptographic verification of ZK proofs using groth16
 * and integrates with NullifierRegistry for replay attack prevention.
 */
export class ProofVerifier {
  private registry: NullifierRegistry;
  private verificationKey: any;
  private maxProofAge: number; // in milliseconds

  /**
   * @param registry - NullifierRegistry instance for replay prevention
   * @param verificationKey - groth16 verification key (JSON object)
   * @param maxProofAge - Maximum age of proof in milliseconds (default: 5 minutes)
   */
  constructor(
    registry: NullifierRegistry,
    verificationKey: any,
    maxProofAge: number = 5 * 60 * 1000 // 5 minutes default
  ) {
    this.registry = registry;
    this.verificationKey = verificationKey;
    this.maxProofAge = maxProofAge;
  }

  /**
   * Verify a ZK proof with comprehensive validation
   * 
   * @param proof - The ZK proof to verify
   * @returns VerificationResult with validation status and error details
   */
  async verify(proof: ZKProof): Promise<VerificationResult> {
    try {
      // Step 1: Validate nullifier format (must be 64-character hex string)
      if (!this.isValidNullifier(proof.nullifier)) {
        return {
          valid: false,
          error: 'Nullifier must be a 64-character hexadecimal string',
          errorCode: 'INVALID_NULLIFIER'
        };
      }

      // Step 2: Check timestamp recency (reject proofs older than maxProofAge)
      const now = Date.now();
      const proofAge = now - proof.timestamp;
      
      if (proofAge > this.maxProofAge) {
        return {
          valid: false,
          error: `Proof expired. Age: ${Math.floor(proofAge / 1000)}s, Max: ${Math.floor(this.maxProofAge / 1000)}s`,
          errorCode: 'EXPIRED'
        };
      }

      // Step 3: Check for replay attacks using NullifierRegistry
      const isReplayed = await this.registry.isNullified(proof.nullifier);
      if (isReplayed) {
        return {
          valid: false,
          error: 'Proof has already been used (replay attack detected)',
          errorCode: 'REPLAY_ATTACK'
        };
      }

      // Step 4: Perform cryptographic verification using groth16
      const isValid = await groth16.verify(
        this.verificationKey,
        proof.publicSignals,
        proof.proof
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Cryptographic proof verification failed',
          errorCode: 'INVALID_PROOF'
        };
      }

      // Step 5: Register nullifier to prevent replay attacks
      await this.registry.registerNullifier(
        proof.nullifier,
        'zkkyc-agent', // agentId - could be extracted from publicSignals if needed
        proof.timestamp
      );

      // Success!
      return {
        valid: true,
        nullifier: proof.nullifier
      };

    } catch (error: any) {
      // Handle unexpected errors during verification
      console.error('[ProofVerifier] Verification error:', error);
      return {
        valid: false,
        error: error.message || 'Unknown verification error',
        errorCode: 'INVALID_PROOF'
      };
    }
  }

  /**
   * Validate nullifier format (64-character hex string)
   * 
   * @param nullifier - The nullifier to validate
   * @returns true if valid, false otherwise
   */
  private isValidNullifier(nullifier: string): boolean {
    // Must be exactly 64 characters and contain only hex digits
    const hexPattern = /^[0-9a-fA-F]{64}$/;
    return hexPattern.test(nullifier);
  }

  /**
   * Validate public signals format
   * 
   * @param publicSignals - Array of public signals to validate
   * @returns true if valid, false otherwise
   */
  private isValidPublicSignals(publicSignals: string[]): boolean {
    if (!Array.isArray(publicSignals) || publicSignals.length === 0) {
      return false;
    }
    
    // All signals should be numeric strings
    return publicSignals.every(signal => /^\d+$/.test(signal));
  }
}

// Made with Moe Abdelaziz
