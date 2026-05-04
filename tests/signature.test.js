import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  signBuildProvenance,
  verifyBuildProvenance,
  signManifest,
  verifyManifest
} from '../core/src/security/signature.js';
import { canonicalizeForSigning } from '../core/canonicalize.js';

test('Build Provenance Signing and Verification', async (t) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

  const provenanceData = {
    builder: 'GitHub Actions',
    source_commit: 'a1b2c3d4e5f6',
    source_repo: 'https://github.com/axiom/agent',
    build_timestamp: '2026-01-12T10:30:00Z',
    extra_field: 'should be ignored'
  };

  await t.test('signBuildProvenance should return a valid base64 signature', () => {
    const signature = signBuildProvenance(provenanceData, privateKeyPem);
    assert.strictEqual(typeof signature, 'string');
    // Basic check if it's base64 string
    assert.match(signature, /^[A-Za-z0-9+/]+={0,2}$/);
    // Ensure the output can be buffered successfully
    assert.doesNotThrow(() => Buffer.from(signature, 'base64'));
  });

  await t.test('signBuildProvenance should be deterministic regardless of object key order', () => {
    const sig1 = signBuildProvenance(provenanceData, privateKeyPem);

    // Create an object with the same keys but in a different order
    const reorderedData = {
        build_timestamp: provenanceData.build_timestamp,
        source_repo: provenanceData.source_repo,
        builder: provenanceData.builder,
        source_commit: provenanceData.source_commit,
    };

    const sig2 = signBuildProvenance(reorderedData, privateKeyPem);
    assert.strictEqual(sig1, sig2, 'Signatures must be identical');
  });

  await t.test('signBuildProvenance should throw if given an invalid private key', () => {
    const { privateKey: rsaKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const rsaPem = rsaKey.export({ type: 'pkcs8', format: 'pem' });

    assert.throws(() => {
      signBuildProvenance(provenanceData, rsaPem);
    }, /Expected ed25519/);

    assert.throws(() => {
      signBuildProvenance(provenanceData, 'not-a-key');
    });
  });

  await t.test('Successfully verify a valid signature', () => {
    const signature = signBuildProvenance(provenanceData, privateKeyPem);
    const isValid = verifyBuildProvenance(provenanceData, signature, publicKeyPem);
    assert.strictEqual(isValid, true, 'Valid signature should verify successfully');
  });

  await t.test('Fail verification if data is tampered', () => {
    const signature = signBuildProvenance(provenanceData, privateKeyPem);

    const tamperedData = { ...provenanceData, source_commit: 'deadbeef' };
    const isValid = verifyBuildProvenance(tamperedData, signature, publicKeyPem);
    assert.strictEqual(isValid, false, 'Tampered data should fail verification');
  });

  await t.test('Fail verification if signed with a different key', () => {
    const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('ed25519');
    const otherPrivateKeyPem = otherPrivateKey.export({ type: 'pkcs8', format: 'pem' });

    const signature = signBuildProvenance(provenanceData, otherPrivateKeyPem);
    const isValid = verifyBuildProvenance(provenanceData, signature, publicKeyPem);
    assert.strictEqual(isValid, false, 'Signature from different key should fail verification');
  });

  await t.test('Fail verification with invalid signature format', () => {
    // Buffer.from doesn't usually throw on invalid base64, it just stops at the first invalid char
    // or produces a best-effort buffer. crypto.verify will then return false.
    const isValid = verifyBuildProvenance(provenanceData, 'not-a-valid-base64-signature!', publicKeyPem);
    assert.strictEqual(isValid, false, 'Invalid signature should return false');
  });
});

test('Manifest Verification with Build Provenance', async (t) => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

    const provenanceData = {
        builder: 'Axiom CI',
        source_commit: 'f00d',
        source_repo: 'axiom-org/agent',
        build_timestamp: '2026-05-01T12:00:00Z',
        slsa_level: 2
    };

    const signature = signBuildProvenance(provenanceData, privateKeyPem);
    provenanceData.builder_signature = signature;

    const manifest = {
        meta: { id: 'did:axiom:test', version: '1.0.0', name: 'Test Agent' },
        build_provenance: provenanceData,
        security: {}
    };

    // We need to sign the manifest itself to use verifyManifest
    const signed = signManifest(manifest, privateKeyPem);
    manifest.security = {
        checksum: { algorithm: 'sha256', value: signed.checksum },
        signature: signed.signature
    };

    await t.test('Successfully verify manifest with valid build provenance', () => {
        const result = verifyManifest(manifest, publicKeyPem);
        assert.strictEqual(result.ok, true, 'Manifest with valid provenance should verify');
    });

    await t.test('Fail manifest verification if build provenance signature is invalid', () => {
        const tamperedManifest = JSON.parse(JSON.stringify(manifest));
        tamperedManifest.build_provenance.builder_signature = 'invalid-sig';

        // Re-calculate checksum and re-sign manifest so ONLY provenance check fails
        const { bytes } = canonicalizeForSigning(tamperedManifest);
        const newChecksum = crypto.createHash('sha256').update(bytes).digest('hex');
        tamperedManifest.security.checksum.value = newChecksum;

        const resign = signManifest(tamperedManifest, privateKeyPem);
        tamperedManifest.security.signature.value = resign.signature.value;

        const result = verifyManifest(tamperedManifest, publicKeyPem);
        assert.strictEqual(result.ok, false, 'Manifest with invalid builder signature should fail');
        assert.strictEqual(result.reason, 'Invalid builder_signature in build_provenance');
    });

    await t.test('Fail manifest verification if SLSA level 2+ is missing builder_signature', () => {
        const noSigManifest = JSON.parse(JSON.stringify(manifest));
        delete noSigManifest.build_provenance.builder_signature;
        noSigManifest.build_provenance.slsa_level = 2;

        const { bytes } = canonicalizeForSigning(noSigManifest);
        const newChecksum = crypto.createHash('sha256').update(bytes).digest('hex');
        noSigManifest.security.checksum.value = newChecksum;

        const resign = signManifest(noSigManifest, privateKeyPem);
        noSigManifest.security.signature.value = resign.signature.value;

        const result = verifyManifest(noSigManifest, publicKeyPem);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.reason, 'Missing builder_signature in build_provenance');
    });
});

test('Manifest Verification General Cases', async (t) => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

    await t.test('Manifest without build provenance', () => {
        const manifest = {
            meta: { id: 'did:axiom:test-no-prov', version: '1.0.0', name: 'No Prov Agent' },
            security: {}
        };
        const signed = signManifest(manifest, privateKeyPem);
        manifest.security = {
            checksum: { algorithm: 'sha256', value: signed.checksum },
            signature: signed.signature
        };

        const result = verifyManifest(manifest, publicKeyPem);
        assert.strictEqual(result.ok, true);
    });

    await t.test('Manifest with SLSA level 1 and no builder_signature', () => {
        const manifest = {
            meta: { id: 'did:axiom:test-slsa1', version: '1.0.0', name: 'SLSA 1 Agent' },
            build_provenance: {
                builder: 'Manual',
                slsa_level: 1
            },
            security: {}
        };
        const signed = signManifest(manifest, privateKeyPem);
        manifest.security = {
            checksum: { algorithm: 'sha256', value: signed.checksum },
            signature: signed.signature
        };

        const result = verifyManifest(manifest, publicKeyPem);
        assert.strictEqual(result.ok, true, 'SLSA 1 does not require builder_signature');
    });

    await t.test('Fail if manifest signature is invalid', () => {
        const manifest = {
            meta: { id: 'did:axiom:test-bad-sig', version: '1.0.0', name: 'Bad Sig Agent' },
            security: {}
        };
        const signed = signManifest(manifest, privateKeyPem);
        manifest.security = {
            checksum: { algorithm: 'sha256', value: signed.checksum },
            signature: { ...signed.signature, value: 'bm90LWEtc2lnbmF0dXJl' }
        };

        const result = verifyManifest(manifest, publicKeyPem);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.signatureValid, false);
    });

    await t.test('Fail if manifest checksum is invalid', () => {
        const manifest = {
            meta: { id: 'did:axiom:test-bad-hash', version: '1.0.0', name: 'Bad Hash Agent' },
            security: {}
        };
        const signed = signManifest(manifest, privateKeyPem);
        manifest.security = {
            checksum: { algorithm: 'sha256', value: 'cafebabe' },
            signature: signed.signature
        };

        const result = verifyManifest(manifest, publicKeyPem);
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.checksumValid, false);
    });
});
