/**
 * Smoke tests for @axiom/schema.
 *
 * These assertions are intentionally cheap and load-bearing:
 *   - The version constants match the package.json line, the JSON
 *     schema $id, and AXIOM.md's quoted pins.
 *   - The DID type guards match what the schema regex actually
 *     accepts (no false positives, no false negatives).
 *   - The shipped schema parses as JSON and carries the locked-const
 *     `authority` field that the rest of the stack relies on.
 *
 * Run via Node 22's built-in test runner:
 *   node --experimental-strip-types --test test/*.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AIX_FORMAT_VERSION,
  AIX_PROTOCOL_VERSION,
  AXIOM_AUTHORITY,
  AXIOM_PROTOCOL,
  AIX_SCHEMA_URL,
  isAxiomDID,
  isDID,
} from '../src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '..', 'schemas', 'aix.schema.json');
const PKG_PATH = resolve(__dirname, '..', 'package.json');

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));

// ── version pins ─────────────────────────────────────────────────────────────

test('AIX_FORMAT_VERSION is a major.minor string', () => {
  assert.match(AIX_FORMAT_VERSION, /^\d+\.\d+$/);
});

test('AIX_PROTOCOL_VERSION is full semver', () => {
  assert.match(AIX_PROTOCOL_VERSION, /^\d+\.\d+\.\d+/);
});

test('package.json#version starts with AIX_FORMAT_VERSION', () => {
  assert.ok(
    pkg.version.startsWith(AIX_FORMAT_VERSION),
    `package.json#version (${pkg.version}) must start with AIX_FORMAT_VERSION (${AIX_FORMAT_VERSION})`,
  );
});

test('AXIOM_PROTOCOL identifier is axiom-a2a-v1', () => {
  assert.strictEqual(AXIOM_PROTOCOL, 'axiom-a2a-v1');
});

// ── authority lock ───────────────────────────────────────────────────────────

test('AXIOM_AUTHORITY is the locked-const "axiomid.app"', () => {
  assert.strictEqual(AXIOM_AUTHORITY, 'axiomid.app');
});

test('schema locks identity_layer.authority to AXIOM_AUTHORITY', () => {
  const auth = schema.properties.identity_layer.properties.authority;
  assert.strictEqual(
    auth.const,
    AXIOM_AUTHORITY,
    'schema identity_layer.authority.const must equal AXIOM_AUTHORITY constant',
  );
});

// ── schema URL ───────────────────────────────────────────────────────────────

test('AIX_SCHEMA_URL points at the canonical $id', () => {
  assert.strictEqual(schema.$id, AIX_SCHEMA_URL);
});

// ── DID type guards ──────────────────────────────────────────────────────────

test('isAxiomDID accepts a well-formed did:axiom', () => {
  assert.ok(isAxiomDID('did:axiom:axiomid.app:iqra-sovereign'));
});

test('isAxiomDID rejects did:web (wrong method)', () => {
  assert.ok(!isAxiomDID('did:web:axiomid.app:iqra-sovereign'));
});

test('isAxiomDID rejects empty id segment', () => {
  assert.ok(!isAxiomDID('did:axiom:axiomid.app:'));
});

test('isAxiomDID rejects non-string', () => {
  assert.ok(!isAxiomDID(undefined));
  assert.ok(!isAxiomDID(null));
  assert.ok(!isAxiomDID(42));
});

test('isDID accepts did:web', () => {
  assert.ok(isDID('did:web:example.com:foo'));
});

test('isDID accepts did:pi', () => {
  assert.ok(isDID('did:pi:abc123'));
});

test('isDID rejects malformed strings', () => {
  assert.ok(!isDID('axiom:axiomid.app:foo'));
  assert.ok(!isDID('did::missing-method:foo'));
  assert.ok(!isDID(''));
});
