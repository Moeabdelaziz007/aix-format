/**
 * Cross-package contract: @axiom/identity ⇄ @axiom/schema.
 *
 * Drift between the two canonical core packages is the single failure
 * mode this suite exists to detect. Any change that lets `@axiom/identity`
 * see a different `AXIOM_AUTHORITY` value than `@axiom/schema` exports,
 * or lets the schema's `identity_layer.authority` const drift away from
 * what the identity package emits, MUST break this test before it ships.
 *
 * Run via Node 22's built-in test runner:
 *   node --experimental-strip-types --test test/contract.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AXIOM_AUTHORITY as IDENTITY_AUTHORITY,
  toAxiomDID,
  toWebDID,
  translateDID,
  generateKeyPair,
  signPayload,
  verifySignedPayload,
  createPiClaim,
  verifyPiClaim,
} from '../src/index.ts';
import {
  AXIOM_AUTHORITY as SCHEMA_AUTHORITY,
  AIX_FORMAT_VERSION as SCHEMA_FORMAT_VERSION,
  AIX_PROTOCOL_VERSION as SCHEMA_PROTOCOL_VERSION,
  isAxiomDID,
  isDID,
} from '../../axiom-schema/src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_JSON_PATH = resolve(
  __dirname,
  '..',
  '..',
  'axiom-schema',
  'schemas',
  'aix.schema.json',
);
const schema = JSON.parse(readFileSync(SCHEMA_JSON_PATH, 'utf-8'));

// ── authority lock: 3-way agreement ──────────────────────────────────────────

test('@axiom/identity AXIOM_AUTHORITY equals @axiom/schema AXIOM_AUTHORITY', () => {
  assert.strictEqual(
    IDENTITY_AUTHORITY,
    SCHEMA_AUTHORITY,
    'Identity and Schema MUST export the same AXIOM_AUTHORITY value or DIDs drift.',
  );
});

test('schema identity_layer.authority.const equals AXIOM_AUTHORITY', () => {
  const authConst = schema.properties.identity_layer.properties.authority.const;
  assert.strictEqual(
    authConst,
    IDENTITY_AUTHORITY,
    'Schema authority const MUST equal the identity package authority. ' +
      'If you bumped one, you MUST bump the other in the same PR.',
  );
});

// ── DID round-trip across packages ───────────────────────────────────────────

test('toAxiomDID outputs a string that isAxiomDID accepts', () => {
  const did = toAxiomDID('contract-test-agent');
  assert.ok(
    isAxiomDID(did),
    'Identity-emitted DIDs MUST pass the Schema-shipped type guard.',
  );
});

test('translateDID outputs that isDID accepts in both forms', () => {
  const out = translateDID(toAxiomDID('cross-test'));
  assert.ok(isDID(out.axiom));
  assert.ok(isDID(out.web));
});

test('toAxiomDID and toWebDID both contain AXIOM_AUTHORITY literally', () => {
  const axiom = toAxiomDID('agent-7');
  const web = toWebDID('agent-7');
  assert.ok(
    axiom.includes(`:${IDENTITY_AUTHORITY}:`),
    'did:axiom output must embed AXIOM_AUTHORITY.',
  );
  assert.ok(
    web.includes(`:${IDENTITY_AUTHORITY}:`),
    'did:web output must embed AXIOM_AUTHORITY.',
  );
});

// ── version pin agreement ────────────────────────────────────────────────────

test('Schema AIX_FORMAT_VERSION is the major.minor of AIX_PROTOCOL_VERSION', () => {
  const [maj, min] = SCHEMA_PROTOCOL_VERSION.split('.');
  assert.strictEqual(
    `${maj}.${min}`,
    SCHEMA_FORMAT_VERSION,
    'AIX_FORMAT_VERSION (major.minor) must match the leading two segments of AIX_PROTOCOL_VERSION.',
  );
});

// ── signing round-trip uses canonical types ──────────────────────────────────

test('signPayload returns the shape the schema names', () => {
  const kp = generateKeyPair();
  const signed = signPayload({ ping: 'pong' }, kp.privateKey);

  // The schema's $defs.Signature requires { algorithm: 'Ed25519' | 'secp256k1',
  // value: string, canonicalization?: 'JCS' | 'RFC8785' }. The identity
  // package emits Ed25519 + JCS, both of which are valid choices in the
  // schema's enum. This test guards against accidental drift in either side.
  const sigEnum = schema.$defs.Signature.properties.algorithm.enum;
  const canEnum = schema.$defs.Signature.properties.canonicalization.enum;

  assert.ok(sigEnum.includes(signed.signature.algorithm));
  assert.ok(canEnum.includes(signed.signature.canonicalization));

  // Public key encoding contract.
  const pkEnum = schema.$defs.PublicKey.properties.encoding.enum;
  assert.ok(pkEnum.includes(signed.publicKey.encoding));

  assert.ok(verifySignedPayload(signed));
});

// ── pi claim contract ────────────────────────────────────────────────────────

test('createPiClaim emits a DID rooted on AXIOM_AUTHORITY', () => {
  const kp = generateKeyPair();
  const claim = createPiClaim({
    owner_id: 'pi-contract-test',
    app_id: 'pi-app-contract',
    environment: 'production',
    privateKey: kp.privateKey,
  });
  assert.strictEqual(claim.payload.domain, IDENTITY_AUTHORITY);
  assert.ok(claim.payload.owner_did.startsWith(`did:axiom:${IDENTITY_AUTHORITY}:`));
  assert.strictEqual(verifyPiClaim(claim).ok, true);
});
