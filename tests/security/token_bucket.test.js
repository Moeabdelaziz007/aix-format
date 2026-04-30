import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenBucket } from '../../core/src/security/token_bucket.js';

test('TokenBucket - initialized correctly', () => {
  const bucket = new TokenBucket(10, 2); // 10 capacity, 2 tokens/sec
  assert.equal(bucket.capacity, 10);
  assert.equal(bucket.tokens, 10);
  assert.equal(bucket.refillRate, 2);
});

test('TokenBucket - tryConsume reduces tokens', () => {
  const bucket = new TokenBucket(10, 2);
  const success = bucket.tryConsume(5);
  assert.equal(success, true);
  assert.ok(bucket.getTokens() <= 5);
});

test('TokenBucket - tryConsume fails when not enough tokens', () => {
  const bucket = new TokenBucket(5, 1);
  const success = bucket.tryConsume(6);
  assert.equal(success, false);
});
