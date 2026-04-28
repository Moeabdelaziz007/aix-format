/**
 * AIX Error Handler Test Suite
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2025
 *
 * Test suite for the AIX Error Handler, Circuit Breaker, and Token Bucket.
 *
 * Usage: node --test tests/error_handler.test.js
 *
 * Copyright © 2025 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AIXErrorHandler,
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
    assert.strictEqual(bucket.tokens, 10);
  });

  it('should consume tokens', () => {
    const bucket = new TokenBucket(10, 1);
    assert.strictEqual(bucket.tryConsume(5), true);
    assert.strictEqual(bucket.tokens, 5);
  });

  it('should fail to consume more tokens than available', () => {
    const bucket = new TokenBucket(5, 1);
    assert.strictEqual(bucket.tryConsume(6), false);
    assert.strictEqual(bucket.tokens, 5);
  });

  it('should refill tokens over time', async () => {
    const bucket = new TokenBucket(10, 10); // 10 tokens per second
    bucket.tryConsume(10);
    assert.strictEqual(bucket.tokens, 0);

    await new Promise(resolve => setTimeout(resolve, 100));

    bucket.refill();
    assert(bucket.tokens > 0);
    assert(bucket.tokens <= 1); // roughly 1 token after 100ms at 10 tokens/s
  });

  it('should calculate wait time', () => {
    const bucket = new TokenBucket(1, 1);
    bucket.tryConsume(1);
    const waitTime = bucket.getWaitTime();
    assert(waitTime > 0);
    assert(waitTime <= 1000);
  });
});

describe('AIXErrorHandler Integration', () => {
  it('should execute operation successfully', async () => {
    const handler = new AIXErrorHandler();
    const operation = async () => 'success';
    const result = await handler.executeWithRetry('test-api', operation);
    assert.strictEqual(result, 'success');
  });

  it('should retry on retryable error', async () => {
    const handler = new AIXErrorHandler({
      defaultRetry: { maxAttempts: 2, initialDelay: 10, jitter: false }
    });

    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts === 1) {
        const err = new Error('Retryable');
        err.status = 503;
        throw err;
      }
      return 'success';
    };

    const result = await handler.executeWithRetry('test-api', operation);
    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 2);
  });

  it('should fail after max retries', async () => {
    const handler = new AIXErrorHandler({
      defaultRetry: { maxAttempts: 2, initialDelay: 10, jitter: false }
    });

    const operation = async () => {
      const err = new Error('Retryable');
      err.status = 503;
      throw err;
    };

    await assert.rejects(
      handler.executeWithRetry('test-api', operation),
      { name: 'MaxRetriesExceededError' }
    );
  });

  it('should open circuit breaker on repeated failures', async () => {
    const handler = new AIXErrorHandler({
      circuitBreaker: { failureThreshold: 2 }
    });

    const operation = async () => {
      const err = new Error('Fatal');
      err.status = 400; // Not retryable in default config
      throw err;
    };

    // First failure
    await assert.rejects(handler.executeWithRetry('test-api', operation));
    // Second failure - should trigger circuit breaker
    await assert.rejects(handler.executeWithRetry('test-api', operation));

    const state = handler.getCircuitBreakerState('test-api');
    assert.strictEqual(state.state, 'OPEN');

    // Next call should fail with CircuitBreakerError immediately
    await assert.rejects(
      handler.executeWithRetry('test-api', operation),
      { name: 'CircuitBreakerError' }
    );
  });
});
