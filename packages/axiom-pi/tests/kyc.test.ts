import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyKyc } from '../src/kyc.js';

describe('kyc', () => {
  beforeEach(() => {
    process.env.PI_API_KEY = 'test-key';
  });

  it('should verify KYC for valid UID', async () => {
    const input = {
      user: { uid: 'valid-user-123' },
      accessToken: 'token123'
    };
    const result = await verifyKyc(input);
    expect(result.identity_layer.id).toBe('did:axiom:pi:valid-user-123');
    expect(result.kyc_proof.provider).toBe('pi_network');
  });

  it('should handle JWT expiry (simulated via UID)', async () => {
    const input = {
      user: { uid: 'expired_user' },
      accessToken: 'expired_token'
    };
    await expect(verifyKyc(input)).rejects.toThrow('JWT expiry');
  });

  it('should fail for short UID', async () => {
    const input = {
      user: { uid: 'short' },
      accessToken: 'token'
    };
    await expect(verifyKyc(input)).rejects.toThrow('Invalid UID');
  });

  it('should include blockchain anchor when signature is provided', async () => {
    const input = {
      user: { uid: 'valid-user-123' },
      accessToken: 'token123',
      signature: 'some-signature'
    };
    const result = await verifyKyc(input);
    expect(result.kyc_proof.blockchain_anchor).toBeDefined();
    expect(result.kyc_proof.blockchain_anchor).toMatch(/^0x/);
  });

  it('should include VLA device ID when publicKey is provided', async () => {
    const input = {
      user: { uid: 'valid-user-123' },
      accessToken: 'token123',
      publicKey: 'some-public-key'
    };
    const result = await verifyKyc(input);
    expect(result.kyc_proof.vla_device_id).toBe('vla:some-pub');
  });
});
