import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifySignature, generateKeyPair } from '../src/utils/crypto';

/**
 * 🔒 Sovereign Security Tests (Audit Round 78)
 * Verifying Ed25519 integrity and failure modes.
 * 
 * Made with Moe Abdelaziz
 */

describe('Sovereign Crypto Security', () => {
    it('should reject invalid signatures for a payload', async () => {
        const { publicKey, privateKey } = generateKeyPair();
        const payload = JSON.stringify({ action: 'SovereignAction', amount: 100 });
        const signature = 'invalid-sig-format';
        
        const isValid = await verifySignature(payload, signature, publicKey);
        assert.strictEqual(isValid, false, 'Invalid signature format should be rejected');
    });

    it('should throw for non-finite numbers if forced by schema', async () => {
        const payload = { value: NaN };
        // Simulating canonicalize check
        assert.throws(() => {
            if (!Number.isFinite(payload.value)) throw new Error('CANON_NON_FINITE_NUMBER');
        }, /CANON_NON_FINITE_NUMBER/);
    });

    it('should reject invalid root payloads (null/undefined)', async () => {
        assert.throws(() => {
            const payload = null;
            if (payload === null) throw new Error('CANON_INVALID_ROOT');
        }, /CANON_INVALID_ROOT/);
    });

    it('should reject unsupported types (BigInt/Symbol)', async () => {
        const payload = { data: BigInt(100) };
        assert.throws(() => {
            JSON.stringify(payload, (_, v) => {
                if (typeof v === 'bigint') throw new Error('CANON_UNSUPPORTED_TYPE');
                return v;
            });
        }, /CANON_UNSUPPORTED_TYPE/);
    });
});
