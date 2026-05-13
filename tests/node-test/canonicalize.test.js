import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeForSigning } from '../core/canonicalize.js';

test('canonicalization is deterministic with reordered keys', () => {
  const a = { meta: { name: 'x', version: '1' }, security: { checksum: { value: 'x' } }, arr: [1, { b: 2, a: 1 }] };
  const b = { arr: [1, { a: 1, b: 2 }], security: { checksum: { value: 'y' }, signature: { value: 'z' } }, meta: { version: '1', name: 'x' } };

  const ca = canonicalizeForSigning(a).canonicalString;
  const cb = canonicalizeForSigning(b).canonicalString;
  assert.equal(ca, cb);
});

test('canonicalization rejects unsupported types', () => {
  assert.throws(() => canonicalizeForSigning({ meta: { fn: () => {} } }), /CANON_UNSUPPORTED_TYPE/);
});

test('canonicalization rejects circular references', () => {
  const obj = { a: 1 };
  obj.self = obj;
  assert.throws(() => canonicalizeForSigning(obj), /CANON_CIRCULAR_REFERENCE/);
});
