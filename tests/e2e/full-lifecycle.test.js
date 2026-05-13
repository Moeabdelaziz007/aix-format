/**
 * E2E full-lifecycle test.
 *
 * Walks an AIX manifest through the protocol's complete lifecycle in one
 * test run:
 *   1. CREATE  : write a minimal manifest to disk
 *   2. SIGN    : scripts/agent-sign.js with a fresh ed25519 keypair
 *   3. VERIFY  : scripts/agent-verify.js with the matching public key
 *   4. TAMPER  : mutate a field and assert verify now fails
 *   5. RESIGN  : re-sign the tampered manifest and assert verify passes again
 *
 * Together these steps exercise the parser, canonicalizer, schema
 * validator, signature engine, and CLI surface in a single run, so
 * coverage hits a large slice of the production stack from one test.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const SIGN = path.join(REPO_ROOT, 'scripts', 'agent-sign.js');
const VERIFY = path.join(REPO_ROOT, 'scripts', 'agent-verify.js');

function makeManifest() {
  return {
    meta: {
      version: '1.0.0',
      id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440099',
      name: 'Lifecycle E2E Agent',
      created: '2026-01-12T10:30:00Z',
      author: 'E2E Suite',
    },
    persona: {
      role: 'assistant',
      instructions: 'Walk through the full sign/verify/tamper/resign lifecycle.',
    },
    identity_layer: {
      id: 'did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440099',
      authority: 'axiomid.app',
      issuedAt: '2026-01-12T10:30:00Z',
    },
    security: {},
  };
}

function writeKeyPair(dir, label) {
  const keys = crypto.generateKeyPairSync('ed25519');
  const priv = path.join(dir, `${label}_priv.pem`);
  const pub = path.join(dir, `${label}_pub.pem`);
  fs.writeFileSync(priv, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(pub, keys.publicKey.export({ type: 'spki', format: 'pem' }));
  return { priv, pub };
}

test('full lifecycle: create -> sign -> verify -> tamper -> resign', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-lifecycle-'));
  const manifestPath = path.join(dir, 'agent.aix.json');

  // 1. CREATE
  fs.writeFileSync(manifestPath, JSON.stringify(makeManifest(), null, 2));

  const { priv, pub } = writeKeyPair(dir, 'lifecycle');

  // 2. SIGN
  const signOut = execFileSync('node', [SIGN, manifestPath, '--private-key', priv, '--kid', 'lifecycle-key'], { encoding: 'utf8', cwd: REPO_ROOT });
  assert.match(signOut, /checksum=/);
  assert.match(signOut, /signature_b64=/);

  // 3. VERIFY (passes)
  const verifyOut = execFileSync('node', [VERIFY, manifestPath, '--public-key', pub], { encoding: 'utf8', cwd: REPO_ROOT });
  const result = JSON.parse(verifyOut);
  assert.equal(result.ok, true);
  assert.equal(result.signatureValid, true);
  assert.equal(result.checksumValid, true);

  // 4. TAMPER
  const tampered = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  tampered.persona.instructions = 'I have been tampered with.';
  fs.writeFileSync(manifestPath, JSON.stringify(tampered, null, 2));
  assert.throws(() => execFileSync('node', [VERIFY, manifestPath, '--public-key', pub], { encoding: 'utf8', cwd: REPO_ROOT }),
    'verify should fail after tampering');

  // 5. RESIGN
  execFileSync('node', [SIGN, manifestPath, '--private-key', priv, '--kid', 'lifecycle-key'], { encoding: 'utf8', cwd: REPO_ROOT });
  const verifyAgain = execFileSync('node', [VERIFY, manifestPath, '--public-key', pub], { encoding: 'utf8', cwd: REPO_ROOT });
  const resigned = JSON.parse(verifyAgain);
  assert.equal(resigned.ok, true);
  assert.equal(resigned.signatureValid, true);
});

test('full lifecycle: wrong public key always fails verification', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-lifecycle-wrong-'));
  const manifestPath = path.join(dir, 'agent.aix.json');
  fs.writeFileSync(manifestPath, JSON.stringify(makeManifest(), null, 2));

  const a = writeKeyPair(dir, 'a');
  const b = writeKeyPair(dir, 'b');

  execFileSync('node', [SIGN, manifestPath, '--private-key', a.priv, '--kid', 'a'], { encoding: 'utf8', cwd: REPO_ROOT });
  assert.throws(() => execFileSync('node', [VERIFY, manifestPath, '--public-key', b.pub], { encoding: 'utf8', cwd: REPO_ROOT }),
    'verify with mismatched key must fail');
});
