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

test('canonicalization rejects non-finite numbers', () => {
  assert.throws(() => canonicalizeForSigning({ num: NaN }), /CANON_NON_FINITE_NUMBER/);
  assert.throws(() => canonicalizeForSigning({ num: Infinity }), /CANON_NON_FINITE_NUMBER/);
});

test('canonicalization rejects top-level non-objects', () => {
  assert.throws(() => canonicalizeForSigning("string"), /CANON_INVALID_ROOT/);
  assert.throws(() => canonicalizeForSigning([]), /CANON_INVALID_ROOT/);
  assert.throws(() => canonicalizeForSigning(null), /CANON_INVALID_ROOT/);
});

test('canonicalization rejects unsupported types explicitly', () => {
  assert.throws(() => canonicalizeForSigning({ a: Symbol('a') }), /CANON_UNSUPPORTED_TYPE/);
  assert.throws(() => canonicalizeForSigning({ b: 10n }), /CANON_UNSUPPORTED_TYPE/);
  assert.throws(() => canonicalizeForSigning({ c: undefined }), /CANON_UNSUPPORTED_TYPE/);
  assert.throws(() => canonicalizeForSigning({ d: () => {} }), /CANON_UNSUPPORTED_TYPE/);
});
