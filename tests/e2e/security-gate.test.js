import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

function copyFixture(tempDir) {
  const fixture = path.resolve('tests/fixtures/security/unsigned-manifest.aix.json');
  const output = path.join(tempDir, 'agent.aix.json');
  fs.copyFileSync(fixture, output);
  return output;
}

test('security gate: missing signature fields must fail verification', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-missing-sign-'));
  const manifestPath = copyFixture(dir);
  const keys = crypto.generateKeyPairSync('ed25519');
  const pub = path.join(dir, 'pub.pem');
  fs.writeFileSync(pub, keys.publicKey.export({ type: 'spki', format: 'pem' }));

  assert.throws(() => execFileSync('node', ['scripts/agent-verify.js', manifestPath, '--public-key', pub], { encoding: 'utf8' }));
});

test('security gate: fixture sign -> verify succeeds', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-sign-verify-'));
  const manifestPath = copyFixture(dir);
  const keys = crypto.generateKeyPairSync('ed25519');
  const priv = path.join(dir, 'priv.pem');
  const pub = path.join(dir, 'pub.pem');

  fs.writeFileSync(priv, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(pub, keys.publicKey.export({ type: 'spki', format: 'pem' }));

  execFileSync('node', ['scripts/agent-sign.js', manifestPath, '--private-key', priv, '--kid', 'fixture-key'], { encoding: 'utf8' });
  const verify = execFileSync('node', ['scripts/agent-verify.js', manifestPath, '--public-key', pub], { encoding: 'utf8' });
  const result = JSON.parse(verify);

  assert.equal(result.ok, true);
  assert.equal(result.checksumValid, true);
  assert.equal(result.signatureValid, true);
});
