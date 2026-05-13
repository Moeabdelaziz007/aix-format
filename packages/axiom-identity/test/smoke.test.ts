/**
 * Smoke tests for @axiom/identity.
 *
 * Each test exercises one of the four sub-modules end-to-end so a
 * regression in any of them surfaces here, not in a downstream
 * consumer.
 *
 * Run via Node 22's built-in test runner:
 *   node --experimental-strip-types --test test/*.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { canonicalizeJSON, canonicalizeJSONBytes } from '../src/canonical.ts';
import {
  generateKeyPair,
  signPayload,
  verifySignedPayload,
  signBytes,
  verifyBytes,
  codec,
} from '../src/ed25519.ts';
import {
  toAxiomDID,
  toWebDID,
  translateDID,
  isAxiomRooted,
  didId,
  AXIOM_AUTHORITY,
} from '../src/did.ts';
import { createPiClaim, verifyPiClaim, bootstrapPiClaim } from '../src/pi.ts';

// ── canonical (JCS) ─────────────────────────────────────────────────────────

test('canonicalizeJSON sorts object keys lexicographically', () => {
  assert.strictEqual(canonicalizeJSON({ b: 2, a: 1 }), '{"a":1,"b":2}');
});

test('canonicalizeJSON emits valid UTF-16 surrogate pairs verbatim', () => {
  assert.strictEqual(canonicalizeJSON({ x: '😀' }), '{"x":"😀"}');
});

test('canonicalizeJSON throws on lone high surrogate', () => {
  assert.throws(() => canonicalizeJSON({ x: '\uD800' }), /lone high surrogate/);
});

test('canonicalizeJSON throws on circular structure', () => {
  const a: Record<string, unknown> = {};
  a.self = a;
  assert.throws(() => canonicalizeJSON(a), /circular/);
});

test('canonicalizeJSON drops undefined-valued keys (RFC 8785)', () => {
  assert.strictEqual(canonicalizeJSON({ a: 1, b: undefined }), '{"a":1}');
});

test('canonicalizeJSON throws on non-finite numbers', () => {
  assert.throws(() => canonicalizeJSON({ x: NaN }), /non-finite/);
  assert.throws(() => canonicalizeJSON({ x: Infinity }), /non-finite/);
});

test('canonicalizeJSONBytes returns UTF-8 bytes of canonical string', () => {
  const bytes = canonicalizeJSONBytes({ hello: 'world' });
  assert.strictEqual(new TextDecoder().decode(bytes), '{"hello":"world"}');
});

// ── ed25519 ──────────────────────────────────────────────────────────────────

test('generateKeyPair returns 32-byte keys', () => {
  const kp = generateKeyPair();
  assert.strictEqual(kp.privateKey.length, 32);
  assert.strictEqual(kp.publicKey.length, 32);
});

test('signPayload + verifySignedPayload round-trip', () => {
  const kp = generateKeyPair();
  const signed = signPayload({ msg: 'hello', n: 7 }, kp.privateKey);
  assert.strictEqual(signed.signature.algorithm, 'Ed25519');
  assert.strictEqual(signed.signature.canonicalization, 'JCS');
  assert.strictEqual(signed.publicKey.algorithm, 'Ed25519');
  assert.strictEqual(signed.publicKey.encoding, 'base64url');
  assert.match(signed.payload_hash, /^[0-9a-f]{64}$/);
  assert.ok(verifySignedPayload(signed));
});

test('verifySignedPayload rejects payload tampering', () => {
  const kp = generateKeyPair();
  const signed = signPayload({ amount: 10 }, kp.privateKey);
  const tampered = { ...signed, payload: { amount: 9999 } };
  assert.ok(!verifySignedPayload(tampered));
});

test('verifySignedPayload rejects signature tampering', () => {
  const kp = generateKeyPair();
  const signed = signPayload({ ok: true }, kp.privateKey);
  // Flip one bit in the base64url signature value.
  const v = signed.signature.value;
  const flipped = v.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
  assert.ok(!verifySignedPayload({ ...signed, signature: { ...signed.signature, value: flipped } }));
});

test('signBytes / verifyBytes round-trip', () => {
  const kp = generateKeyPair();
  const msg = new TextEncoder().encode('hello bytes');
  const sig = signBytes(msg, kp.privateKey);
  assert.ok(verifyBytes(msg, sig, kp.publicKey));
});

test('codec.bytesToHex / hexToBytes round-trip', () => {
  const bytes = new Uint8Array([0x00, 0x7f, 0xff]);
  assert.strictEqual(codec.bytesToHex(bytes), '007fff');
  const back = codec.hexToBytes('007fff');
  assert.deepStrictEqual(Array.from(back), [0x00, 0x7f, 0xff]);
});

test('codec.bytesToBase64Url / base64UrlToBytes round-trip', () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5]);
  const b64 = codec.bytesToBase64Url(bytes);
  const back = codec.base64UrlToBytes(b64);
  assert.deepStrictEqual(Array.from(back), [1, 2, 3, 4, 5]);
});

// ── did translator ───────────────────────────────────────────────────────────

test('AXIOM_AUTHORITY re-export matches the locked const', () => {
  assert.strictEqual(AXIOM_AUTHORITY, 'axiomid.app');
});

test('toAxiomDID produces did:axiom:axiomid.app:<id>', () => {
  assert.strictEqual(
    toAxiomDID('iqra-sovereign'),
    'did:axiom:axiomid.app:iqra-sovereign',
  );
});

test('toWebDID produces did:web:axiomid.app:<id>', () => {
  assert.strictEqual(
    toWebDID('iqra-sovereign'),
    'did:web:axiomid.app:iqra-sovereign',
  );
});

test('translateDID is lossless across forms', () => {
  const axiom = toAxiomDID('agent-42');
  const out = translateDID(axiom);
  assert.strictEqual(out.id, 'agent-42');
  assert.strictEqual(out.axiom, axiom);
  assert.strictEqual(out.web, 'did:web:axiomid.app:agent-42');
});

test('translateDID rejects unsupported method', () => {
  assert.throws(() => translateDID('did:evil:axiomid.app:x'), /Unsupported DID/);
});

test('translateDID rejects illegal id chars', () => {
  assert.throws(() => translateDID('did:axiom:axiomid.app:has space'), /illegal characters/);
});

test('isAxiomRooted recognises both forms', () => {
  assert.ok(isAxiomRooted('did:axiom:axiomid.app:a'));
  assert.ok(isAxiomRooted('did:web:axiomid.app:a'));
  assert.ok(!isAxiomRooted('did:web:example.com:a'));
});

test('didId extracts the bare id', () => {
  assert.strictEqual(didId('did:axiom:axiomid.app:my-agent'), 'my-agent');
  assert.strictEqual(didId('did:web:axiomid.app:my-agent'), 'my-agent');
});

// ── pi network claim ─────────────────────────────────────────────────────────

test('createPiClaim + verifyPiClaim round-trip', () => {
  const kp = generateKeyPair();
  const claim = createPiClaim({
    owner_id: 'iqra-sovereign',
    app_id: 'pi-app-xxxx',
    environment: 'production',
    privateKey: kp.privateKey,
  });
  assert.strictEqual(claim.payload.domain, 'axiomid.app');
  assert.strictEqual(claim.payload.owner_did, 'did:axiom:axiomid.app:iqra-sovereign');
  assert.strictEqual(claim.well_known_url, 'https://axiomid.app/.well-known/pi-claim.json');
  const v = verifyPiClaim(claim);
  assert.strictEqual(v.ok, true);
});

test('verifyPiClaim rejects DID/domain mismatch', () => {
  const kp = generateKeyPair();
  const claim = createPiClaim({
    owner_id: 'agent-x',
    app_id: 'pi-app',
    environment: 'sandbox',
    privateKey: kp.privateKey,
  });
  // Tamper: swap the domain to a different one. Signature still verifies
  // but the strict DID-domain anchor must reject.
  const tampered = { ...claim, payload: { ...claim.payload, domain: 'attacker.example' } };
  // Re-sign so signature verification doesn't fail first.
  const reSigned = signPayload(tampered.payload, kp.privateKey);
  const tamperedArtifact = { ...reSigned, well_known_url: claim.well_known_url };
  const v = verifyPiClaim(tamperedArtifact);
  assert.strictEqual(v.ok, false);
  if (!v.ok) assert.strictEqual(v.reason, 'DID_DOMAIN_MISMATCH');
});

test('verifyPiClaim rejects host-mismatched well_known_url', () => {
  const kp = generateKeyPair();
  const claim = createPiClaim({
    owner_id: 'agent-y',
    app_id: 'pi-app',
    environment: 'sandbox',
    privateKey: kp.privateKey,
  });
  const tampered = {
    ...claim,
    well_known_url: 'https://attacker.example/.well-known/pi-claim.json',
  };
  const v = verifyPiClaim(tampered);
  assert.strictEqual(v.ok, false);
});

test('bootstrapPiClaim produces a self-verifying artifact', () => {
  const { artifact } = bootstrapPiClaim({
    owner_id: 'fresh-agent',
    app_id: 'pi-app',
    environment: 'production',
  });
  assert.strictEqual(verifyPiClaim(artifact).ok, true);
});
