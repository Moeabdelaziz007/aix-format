import { describe, it, expect } from 'vitest';
import { generateKycEnvelope, verifyEnvelopeIdentity, PiUidSchema } from './index';

describe('Pi Network KYC Integration', () => {
  const mockPiUid = "pi_user_9988776655";
  const mockOptions = {
    agentName: "AxiomGuardian",
    author: "Mohamed Abdelaziz"
  };

  describe('PiUidSchema', () => {
    it('should validate a correct Pi UID', () => {
      expect(PiUidSchema.safeParse(mockPiUid).success).toBe(true);
    });

    it('should reject a short Pi UID', () => {
      expect(PiUidSchema.safeParse("too_short").success).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(PiUidSchema.safeParse("user@name!").success).toBe(false);
    });
  });

  describe('generateKycEnvelope', () => {
    it('should generate a valid AIX envelope from Pi UID', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      
      expect(envelope.meta.id).toBe(`did:axiom:pi:${mockPiUid}`);
      expect(envelope.meta.name).toBe(mockOptions.agentName);
      expect(envelope.identity_layer.authority).toBe('axiomid.app');
      expect(envelope.pi_network?.kyc_required).toBe(true);
    });

    it('should throw error for invalid Pi UID', async () => {
      await expect(generateKycEnvelope("short", mockOptions)).rejects.toThrow();
    });
  });

  describe('verifyEnvelopeIdentity', () => {
    it('should return true for matching identity', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      expect(verifyEnvelopeIdentity(envelope, mockPiUid)).toBe(true);
    });

    it('should return false for non-matching identity', async () => {
      const envelope = await generateKycEnvelope(mockPiUid, mockOptions);
      expect(verifyEnvelopeIdentity(envelope, "different_uid_123")).toBe(false);
    });
  });
});
