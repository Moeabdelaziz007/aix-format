/**
 * Pi Network E2E Integration Tests
 * Comprehensive test suite covering authentication, KYC signing, and verification flows
 * 
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PiKycAdapter } from '../../../core/pi_kyc_adapter';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

describe('Pi Network E2E Integration', () => {
  // Test fixtures
  let mockKeyPair: nacl.SignKeyPair;
  let mockAccessToken: string;
  let mockSignature: string;
  let mockPublicKey: string;
  let mockPiUid: string;

  beforeEach(() => {
    // Generate a fresh Ed25519 keypair for each test
    mockKeyPair = nacl.sign.keyPair();
    mockPiUid = 'pi_test_user_12345678';
    mockAccessToken = 'mock_access_token_' + Date.now();
    
    // Sign the access token
    const messageUint8 = naclUtil.decodeUTF8(mockAccessToken);
    const signatureUint8 = nacl.sign.detached(messageUint8, mockKeyPair.secretKey);
    
    mockSignature = naclUtil.encodeBase64(signatureUint8);
    mockPublicKey = naclUtil.encodeBase64(mockKeyPair.publicKey);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should successfully authenticate with valid Pi credentials', () => {
      const piAuthResult = {
        user: { uid: mockPiUid, username: 'testuser' },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result).toBeDefined();
      expect(result.identity_layer).toBeDefined();
      expect(result.kyc_proof).toBeDefined();
      expect(result.identity_layer.id).toMatch(/^did:axiom:axiomid\.app:/);
    });

    it('should reject authentication with missing user.uid', () => {
      const invalidAuth = {
        user: { uid: '' },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(invalidAuth))
        .toThrow('Invalid Pi Auth Result: Missing user.uid');
    });

    it('should reject authentication with missing accessToken', () => {
      const invalidAuth = {
        user: { uid: mockPiUid },
        accessToken: '',
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(invalidAuth))
        .toThrow('Invalid Pi Auth Result: accessToken length is out of allowed bounds');
    });

    it('should reject authentication with missing signature', () => {
      const invalidAuth = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: '',
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(invalidAuth))
        .toThrow('Invalid Pi Auth Result: signature/publicKey must be valid base64');
    });

    it('should reject authentication with missing publicKey', () => {
      const invalidAuth = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: ''
      };

      expect(() => PiKycAdapter.generateIdentity(invalidAuth))
        .toThrow('Invalid Pi Auth Result: signature/publicKey must be valid base64');
    });

    it('should reject authentication with invalid signature', () => {
      const invalidAuth = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: 'aW52YWxpZF9zaWduYXR1cmU=', // Invalid signature
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(invalidAuth))
        .toThrow();
    });

    it('should reject authentication with tampered accessToken', () => {
      const tamperedAuth = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken + '_tampered',
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(tamperedAuth))
        .toThrow('Invalid signature');
    });
  });

  describe('KYC Identity Generation', () => {
    it('should generate valid identity layer with DID', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result.identity_layer.id).toMatch(/^did:axiom:axiomid\.app:[a-f0-9]{32}$/);
      expect(result.identity_layer.authority).toBe('axiomid.app');
      expect(result.identity_layer.issuedAt).toBeDefined();
      expect(new Date(result.identity_layer.issuedAt).getTime()).toBeGreaterThan(0);
    });

    it('should generate valid public key fingerprint', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result.identity_layer.publicKey).toBeDefined();
      expect(result.identity_layer.publicKey.algorithm).toBe('Ed25519');
      expect(result.identity_layer.publicKey.value).toBe(mockPublicKey);
      expect(result.identity_layer.publicKey.encoding).toBe('base64');
      expect(result.identity_layer.publicKey.fingerprint).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should support custom DID methods', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const options = {
        didMethod: 'did:web',
        didAuthority: 'example.com'
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult, options);

      expect(result.identity_layer.id).toMatch(/^did:web:example\.com:/);
      expect(result.identity_layer.authority).toBe('example.com');
    });

    it('should generate unique DIDs for different users', () => {
      const user1 = {
        user: { uid: 'user_1' },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const user2 = {
        user: { uid: 'user_2' },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result1 = PiKycAdapter.generateIdentity(user1);
      const result2 = PiKycAdapter.generateIdentity(user2);

      expect(result1.identity_layer.id).not.toBe(result2.identity_layer.id);
    });
  });

  describe('KYC Proof Generation', () => {
    it('should generate valid KYC proof with all required fields', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result.kyc_proof.version).toBe('2.0');
      expect(result.kyc_proof.provider).toBe('pi_network');
      expect(result.kyc_proof.assurance_level).toBe('substantial');
      expect(result.kyc_proof.uid_hash).toMatch(/^[a-f0-9]{32}$/);
      expect(result.kyc_proof.uid_hash_algorithm).toBe('sha256');
      expect(result.kyc_proof.verified_at).toBeDefined();
      expect(result.kyc_proof.access_token_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should support different assurance levels', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const levels = ['low', 'substantial', 'high'];

      levels.forEach(level => {
        const result = PiKycAdapter.generateIdentity(piAuthResult, { assuranceLevel: level });
        expect(result.kyc_proof.assurance_level).toBe(level);
      });
    });

    it('should enforce minimum assurance level policy', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const options = {
        assuranceLevel: 'low',
        minAssuranceLevel: 'high'
      };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult, options))
        .toThrow('Insufficient assurance level');
    });

    it('should include challenge binding when provided', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const options = {
        challengeNonce: 'test_nonce_12345'
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult, options);

      expect(result.kyc_proof.challenge_binding_hash).toBeDefined();
      expect(result.kyc_proof.challenge_binding_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should mark UID hash as salted when salt is provided', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const withSalt = PiKycAdapter.generateIdentity(piAuthResult, { uidSalt: 'test_salt' });
      const withoutSalt = PiKycAdapter.generateIdentity(piAuthResult);

      expect(withSalt.kyc_proof.uid_hash_salted).toBe(true);
      expect(withoutSalt.kyc_proof.uid_hash_salted).toBe(false);
    });
  });

  describe('Blockchain Anchoring', () => {
    it('should include blockchain anchor when provided', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const options = {
        blockchainAnchor: {
          chain: 'pi-mainnet',
          txid: '0x1234567890abcdef',
          blockHeight: 12345
        }
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult, options);

      expect(result.kyc_proof.blockchain_anchor).toBeDefined();
      expect(result.kyc_proof.blockchain_anchor.chain).toBe('pi-mainnet');
      expect(result.kyc_proof.blockchain_anchor.txid).toBe('0x1234567890abcdef');
      expect(result.kyc_proof.blockchain_anchor.block_height).toBe(12345);
      expect(result.kyc_proof.blockchain_anchor.anchor_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should reject invalid blockchain anchor', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const invalidAnchor = {
        blockchainAnchor: {
          chain: 'pi-mainnet'
          // Missing txid
        }
      };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult, invalidAnchor))
        .toThrow('Invalid blockchainAnchor');
    });
  });

  describe('VLA Device Registry', () => {
    it('should include VLA device info when provided', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey,
        vlaDevice: {
          adapter: 'pi-browser',
          id: 'device_12345'
        }
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result.kyc_proof.vla_device_registry).toBeDefined();
      expect(result.kyc_proof.vla_device_registry.adapter).toBe('pi-browser');
      expect(result.kyc_proof.vla_device_registry.hardware_id).toBe('device_12345');
    });

    it('should handle missing VLA device gracefully', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      expect(result.kyc_proof.vla_device_registry).toBeUndefined();
    });
  });

  describe('JWT Validation', () => {
    it('should validate JWT expiry when enforced', () => {
      // Create an expired JWT
      const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        uid: mockPiUid,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      })).toString('base64url');
      const expiredToken = `${header}.${payload}.signature`;

      // Sign the expired token
      const messageUint8 = naclUtil.decodeUTF8(expiredToken);
      const signatureUint8 = nacl.sign.detached(messageUint8, mockKeyPair.secretKey);
      const signature = naclUtil.encodeBase64(signatureUint8);

      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: expiredToken,
        signature,
        publicKey: mockPublicKey
      };

      const options = { enforceJwtExpiry: true };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult, options))
        .toThrow('JWT has expired');
    });

    it('should validate JWT not-before when enforced', () => {
      // Create a JWT that's not active yet
      const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        uid: mockPiUid,
        nbf: Math.floor(Date.now() / 1000) + 3600 // Active in 1 hour
      })).toString('base64url');
      const futureToken = `${header}.${payload}.signature`;

      // Sign the future token
      const messageUint8 = naclUtil.decodeUTF8(futureToken);
      const signatureUint8 = nacl.sign.detached(messageUint8, mockKeyPair.secretKey);
      const signature = naclUtil.encodeBase64(signatureUint8);

      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: futureToken,
        signature,
        publicKey: mockPublicKey
      };

      const options = { enforceJwtExpiry: true };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult, options))
        .toThrow('JWT not active yet');
    });

    it('should validate JWT algorithm when enforced', () => {
      // Create a JWT with wrong algorithm
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ uid: mockPiUid })).toString('base64url');
      const wrongAlgToken = `${header}.${payload}.signature`;

      // Sign the token
      const messageUint8 = naclUtil.decodeUTF8(wrongAlgToken);
      const signatureUint8 = nacl.sign.detached(messageUint8, mockKeyPair.secretKey);
      const signature = naclUtil.encodeBase64(signatureUint8);

      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: wrongAlgToken,
        signature,
        publicKey: mockPublicKey
      };

      const options = { enforceJwtAlg: true, allowedJwtAlgs: ['EdDSA'] };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult, options))
        .toThrow('not allowed');
    });
  });

  describe('Privacy and Security', () => {
    it('should hash UID for privacy', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      // UID hash should not contain the original UID
      expect(result.kyc_proof.uid_hash).not.toContain(mockPiUid);
      expect(result.identity_layer.id).not.toContain(mockPiUid);
    });

    it('should produce different hashes with different salts', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result1 = PiKycAdapter.generateIdentity(piAuthResult, { uidSalt: 'salt1' });
      const result2 = PiKycAdapter.generateIdentity(piAuthResult, { uidSalt: 'salt2' });

      expect(result1.kyc_proof.uid_hash).not.toBe(result2.kyc_proof.uid_hash);
      expect(result1.identity_layer.id).not.toBe(result2.identity_layer.id);
    });

    it('should hash access token for security', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);

      // Access token hash should not contain the original token
      expect(result.kyc_proof.access_token_hash).not.toContain(mockAccessToken);
      expect(result.kyc_proof.access_token_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should validate base64 encoding strictly', () => {
      const invalidBase64Cases = [
        '', // Empty
        'not-base64!', // Invalid characters
        'a'.repeat(5000), // Too long
        'abc' // Invalid padding
      ];

      invalidBase64Cases.forEach(invalidValue => {
        expect(PiKycAdapter.isValidBase64(invalidValue)).toBe(false);
      });
    });

    it('should accept valid base64 encoding', () => {
      const validBase64Cases = [
        mockPublicKey,
        mockSignature,
        'SGVsbG8gV29ybGQ=',
        'YWJjZGVmZ2hpams='
      ];

      validBase64Cases.forEach(validValue => {
        expect(PiKycAdapter.isValidBase64(validValue)).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long UIDs', () => {
      const longUid = 'a'.repeat(256);
      const piAuthResult = {
        user: { uid: longUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);
      expect(result.kyc_proof.uid_hash).toBeDefined();
    });

    it('should reject excessively long UIDs', () => {
      const tooLongUid = 'a'.repeat(257);
      const piAuthResult = {
        user: { uid: tooLongUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult))
        .toThrow('user.uid must be a non-empty string');
    });

    it('should handle whitespace in UID', () => {
      const uidWithSpaces = '  ' + mockPiUid + '  ';
      const piAuthResult = {
        user: { uid: uidWithSpaces },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);
      expect(result).toBeDefined();
    });

    it('should handle whitespace in access token', () => {
      const tokenWithSpaces = '  ' + mockAccessToken + '  ';
      
      // Sign the token with spaces
      const messageUint8 = naclUtil.decodeUTF8(tokenWithSpaces);
      const signatureUint8 = nacl.sign.detached(messageUint8, mockKeyPair.secretKey);
      const signature = naclUtil.encodeBase64(signatureUint8);

      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: tokenWithSpaces,
        signature,
        publicKey: mockPublicKey
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult);
      expect(result).toBeDefined();
    });

    it('should reject malformed signature payload', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: 'not_valid_base64!!!',
        publicKey: mockPublicKey
      };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult))
        .toThrow();
    });

    it('should reject wrong public key size', () => {
      // Create a public key with wrong size
      const wrongSizeKey = naclUtil.encodeBase64(new Uint8Array(16)); // Should be 32 bytes

      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: wrongSizeKey
      };

      expect(() => PiKycAdapter.generateIdentity(piAuthResult))
        .toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full E2E flow with all features', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey,
        vlaDevice: {
          adapter: 'pi-browser',
          id: 'device_xyz'
        }
      };

      const options = {
        uidSalt: 'production_salt',
        challengeNonce: 'challenge_123',
        assuranceLevel: 'high',
        minAssuranceLevel: 'substantial',
        blockchainAnchor: {
          chain: 'pi-mainnet',
          txid: '0xabcdef123456',
          blockHeight: 54321
        }
      };

      const result = PiKycAdapter.generateIdentity(piAuthResult, options);

      // Verify all components are present
      expect(result.identity_layer).toBeDefined();
      expect(result.kyc_proof).toBeDefined();
      expect(result.kyc_proof.challenge_binding_hash).toBeDefined();
      expect(result.kyc_proof.blockchain_anchor).toBeDefined();
      expect(result.kyc_proof.vla_device_registry).toBeDefined();
      expect(result.kyc_proof.assurance_level).toBe('high');
    });

    it('should maintain consistency across multiple calls', () => {
      const piAuthResult = {
        user: { uid: mockPiUid },
        accessToken: mockAccessToken,
        signature: mockSignature,
        publicKey: mockPublicKey
      };

      const options = { uidSalt: 'consistent_salt' };

      const result1 = PiKycAdapter.generateIdentity(piAuthResult, options);
      const result2 = PiKycAdapter.generateIdentity(piAuthResult, options);

      // Same input should produce same UID hash
      expect(result1.kyc_proof.uid_hash).toBe(result2.kyc_proof.uid_hash);
      expect(result1.identity_layer.id).toBe(result2.identity_layer.id);
    });
  });
});

// Made with Moe Abdelaziz
