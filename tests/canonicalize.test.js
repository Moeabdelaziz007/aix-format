import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeForSigning, serialize } from '../core/canonicalize.js';

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

test('serialize rejects undefined in object properties', () => {
  assert.throws(() => serialize({ a: undefined }, '$', new WeakSet()), /CANON_UNSUPPORTED_TYPE.*undefined is not allowed/);
});

test('stripDynamicSecurityFields throws on invalid root payload', () => {
  assert.throws(() => canonicalizeForSigning(null), /CANON_INVALID_ROOT/);
  assert.throws(() => canonicalizeForSigning([]), /CANON_INVALID_ROOT/);
  assert.throws(() => canonicalizeForSigning('test'), /CANON_INVALID_ROOT/);
});

test('serialize throws on non-finite numbers', () => {
  assert.throws(() => serialize(NaN, '$', new WeakSet()), /CANON_NON_FINITE_NUMBER/);
  assert.throws(() => serialize(Infinity, '$', new WeakSet()), /CANON_NON_FINITE_NUMBER/);
  assert.throws(() => serialize(-Infinity, '$', new WeakSet()), /CANON_NON_FINITE_NUMBER/);
});

test('serialize circular references', () => {
  const obj = { a: 1 };
  obj.self = obj;
  assert.throws(() => serialize(obj, '$', new WeakSet()), /CANON_CIRCULAR_REFERENCE/);
});

test('serialize throws unsupported type for function, symbol, bigint', () => {
  assert.throws(() => serialize(() => {}, '$', new WeakSet()), /CANON_UNSUPPORTED_TYPE/);
  assert.throws(() => serialize(Symbol('test'), '$', new WeakSet()), /CANON_UNSUPPORTED_TYPE/);
  assert.throws(() => serialize(10n, '$', new WeakSet()), /CANON_UNSUPPORTED_TYPE/);
});
