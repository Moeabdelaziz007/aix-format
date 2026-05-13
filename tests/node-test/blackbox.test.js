import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { signLogEntry, verifyLogEntry } from '../core/src/security/blackbox.js';

describe('BlackBox Logs Security', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
  const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

  it('should sign and verify a log entry successfully', () => {
    const entry = signLogEntry('read_file', { path: '/etc/passwd' }, privPem);

    assert.ok(entry.timestamp);
    assert.strictEqual(entry.action, 'read_file');
    assert.ok(entry.signature);
    assert.strictEqual(entry.signature.algorithm, 'ed25519');

    const isValid = verifyLogEntry(entry, pubPem);
    assert.strictEqual(isValid, true);
  });

  it('should fail verification if payload is tampered', () => {
    const entry = signLogEntry('read_file', { path: '/etc/passwd' }, privPem);

    // Tamper the payload
    entry.action = 'delete_file';

    const isValid = verifyLogEntry(entry, pubPem);
    assert.strictEqual(isValid, false);
  });

  it('should fail verification if signature is missing', () => {
    const entry = signLogEntry('read_file', { path: '/etc/passwd' }, privPem);

    delete entry.signature;

    const isValid = verifyLogEntry(entry, pubPem);
    assert.strictEqual(isValid, false);
  });

  it('should fail verification if public key is not ed25519', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const rsaPubPem = publicKey.export({ type: 'spki', format: 'pem' });

    const entry = signLogEntry('read_file', { path: '/etc/passwd' }, privPem);
    const isValid = verifyLogEntry(entry, rsaPubPem);
    assert.strictEqual(isValid, false);
  });

  it('should throw error if private key for signing is not ed25519', () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const rsaPrivPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

    assert.throws(
      () => signLogEntry('read_file', { path: '/etc/passwd' }, rsaPrivPem),
      /Invalid private key type: rsa. Expected ed25519/
    );
  });
});
