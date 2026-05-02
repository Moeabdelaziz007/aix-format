import { describe, it, expect } from 'vitest';
import { generateKycEnvelope, verifyEnvelopeIdentity, PiUidSchema, hashPiUid } from './index';
import { EnvelopeSecurity } from '@aix/core';

describe('Pi Network KYC Integration', () => {
  const mockPiUid = "pi_user_9988776655";
  const mockSalt = "test-salt";
  const mockOptions = {
    agentName: "AxiomGuardian",
    author: "Mohamed Abdelaziz",
    salt: mockSalt
  };

  describe('PiUidSchema', () => {
    it('should validate a correct Pi UID', () => {
      expect(PiUidSchema.safeParse(mockPiUid).success).toBe(true);
    });

    it('should reject a short Pi UID', () => {
      expect(PiUidSchema.safeParse("too_short").success).toBe(false);
    });

    it('should reject a UID with special characters', () => {
      expect(PiUidSchema.safeParse("pi_user!@#").success).toBe(false);
    });

    it('should reject an empty UID', () => {
      expect(PiUidSchema.safeParse("").success).toBe(false);
    });
  });

  describe('generateKycEnvelope', () => {
    it('should generate a valid AIX envelope with hashed UID', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      const expectedHash = hashPiUid(mockPiUid, mockSalt);
      
      expect(envelope.meta.id).toBe(`did:axiom:pi:${expectedHash}`);
      expect(envelope.meta.name).toBe(mockOptions.agentName);
      expect(envelope.identity_layer.id).toBe(`did:axiom:pi:${expectedHash}`);
    });

    it('should have valid integrity hash', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      // We expect the security.checksum.value to match the calculated hash of the content
      expect(EnvelopeSecurity.verifyIntegrity(envelope)).toBe(true);
    });

    it('should throw error for invalid Pi UID', async () => {
      await expect(generateKycEnvelope("short", mockOptions)).rejects.toThrow();
    });

    it('should use default salt if none provided', async () => {
      // Mock environment variable
      const originalSalt = process.env.AIX_UID_HASH_SALT;
      process.env.AIX_UID_HASH_SALT = "env-salt";
      
      const envelope = await generateKycEnvelope(mockPiUid, { agentName: "test", author: "test" });
      const expectedHash = hashPiUid(mockPiUid, "env-salt");
      
      expect(envelope.identity_layer.id).toBe(`did:axiom:pi:${expectedHash}`);
      
      // Cleanup
      process.env.AIX_UID_HASH_SALT = originalSalt;
    });

    it('should use hardcoded fallback if no salt and no env var', async () => {
      const originalSalt = process.env.AIX_UID_HASH_SALT;
      delete process.env.AIX_UID_HASH_SALT;
      
      const envelope = await generateKycEnvelope(mockPiUid, { agentName: "test", author: "test" });
      const expectedHash = hashPiUid(mockPiUid, 'default-secure-salt');
      
      expect(envelope.identity_layer.id).toBe(`did:axiom:pi:${expectedHash}`);
      
      process.env.AIX_UID_HASH_SALT = originalSalt;
    });
  });

  describe('verifyEnvelopeIdentity', () => {
    it('should return true for matching identity and salt', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      expect(verifyEnvelopeIdentity(envelope, mockPiUid, mockSalt)).toBe(true);
    });

    it('should return false for non-matching identity', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      expect(verifyEnvelopeIdentity(envelope, "different_uid_123", mockSalt)).toBe(false);
    });
  });
});
