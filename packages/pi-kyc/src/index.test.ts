import { describe, it, expect } from 'vitest';
import { generateKycEnvelope, verifyEnvelopeIdentity, PiUidSchema, hashPiUid } from './index.js';

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

    it('should throw error for invalid Pi UID', async () => {
      await expect(generateKycEnvelope("short", mockOptions)).rejects.toThrow();
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
