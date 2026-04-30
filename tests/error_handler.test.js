/**
 * AIX Error Handler Test Suite
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Test suite for the AIX Error Handler, Circuit Breaker, and Token Bucket.
 *
 * Usage: node --test tests/error_handler.test.js
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CircuitBreaker,
  TokenBucket,
    CircuitBreakerError,
  MaxRetriesExceededError,
  TimeoutError
} from '../core/error_handler.js';

describe('CircuitBreaker', () => {
  it('should initialize in CLOSED state', () => {
    const cb = new CircuitBreaker();
    assert.strictEqual(cb.state, 'CLOSED');
    assert.strictEqual(cb.isOpen(), false);
  });

  it('should transition to OPEN after reaching failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    cb.recordFailure();
    cb.recordFailure();
    assert.strictEqual(cb.state, 'CLOSED');
    cb.recordFailure();
    assert.strictEqual(cb.state, 'OPEN');
    assert.strictEqual(cb.isOpen(), true);
  });

  it('should reset failure count on success in CLOSED state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    assert.strictEqual(cb.state, 'CLOSED');
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      timeoutSeconds: 0.1
    });
    cb.recordFailure();
    assert.strictEqual(cb.state, 'OPEN');

    await new Promise(resolve => setTimeout(resolve, 150));

    assert.strictEqual(cb.isOpen(), false);
    assert.strictEqual(cb.state, 'HALF_OPEN');
  });

  it('should transition from HALF_OPEN to CLOSED after success threshold', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeoutSeconds: 0.1
    });
    cb.recordFailure(); // Move to OPEN
    cb.isOpen(); // Should move to HALF_OPEN if we wait, but let's force it
    cb.state = 'HALF_OPEN';

    cb.recordSuccess();
    assert.strictEqual(cb.state, 'HALF_OPEN');
    cb.recordSuccess();
    assert.strictEqual(cb.state, 'CLOSED');
  });

  it('should transition from HALF_OPEN back to OPEN on failure', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      timeoutSeconds: 0.1
    });
    cb.recordFailure(); // Move to OPEN
    cb.state = 'HALF_OPEN';

    cb.recordFailure();
    assert.strictEqual(cb.state, 'OPEN');
  });
});




describe('TokenBucket', () => {
  it('should initialize with full capacity', () => {
    const bucket = new TokenBucket(10, 1);
    assert.strictEqual(bucket.capacity, 10);
    assert.strictEqual(bucket.tokens, 10);
    assert.strictEqual(bucket.refillRate, 1);
  });

  it('should consume tokens when available', () => {
    const bucket = new TokenBucket(10, 1);
    const result = bucket.tryConsume(3);
    assert.strictEqual(result, true);
    assert.strictEqual(bucket.tokens, 7);
  });

  it('should reject when not enough tokens are available', () => {
    const bucket = new TokenBucket(5, 1);
    const result = bucket.tryConsume(6);
    assert.strictEqual(result, false);
    assert.strictEqual(bucket.tokens, 5);
  });

  it('should refill tokens over time', async () => {
    const bucket = new TokenBucket(10, 10); // 10 tokens per second
    bucket.tryConsume(5);
    assert.strictEqual(bucket.tokens, 5);

    // wait 100ms, should refill ~1 token
    await new Promise(resolve => setTimeout(resolve, 100));

    bucket.refill();
    assert(bucket.tokens > 5.9 && bucket.tokens < 6.5, `Tokens should be around 6, but got ${bucket.tokens}`);
  });

  it('should not exceed capacity when refilling', async () => {
    const bucket = new TokenBucket(10, 10);

    // wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    bucket.refill();
    assert.strictEqual(bucket.tokens, 10);
  });

  it('should calculate wait time correctly', () => {
    const bucket = new TokenBucket(10, 10); // 10 tokens per second

    // If we have tokens, wait time is 0
    assert.strictEqual(bucket.getWaitTime(), 0);

    bucket.tokens = 0;

    // To get 1 token at 10 tokens/sec, it takes 0.1 seconds (100ms)
    assert.strictEqual(bucket.getWaitTime(), 100);

    bucket.tokens = 0.5;

    // To get 0.5 tokens at 10 tokens/sec, it takes 0.05 seconds (50ms)
    assert.strictEqual(bucket.getWaitTime(), 50);
  });
});
