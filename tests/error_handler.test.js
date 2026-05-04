/**
 * AIX Error Handler Test Suite
 * Created by Mohamed Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Test suite for the AIX Error Handler and Circuit Breaker.
 * Note: TokenBucket removed per ADR-002 - use core/rate-limit-adapter.ts instead
 *
 * Usage: node --test tests/error_handler.test.js
 *
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CircuitBreaker,
  CircuitBreakerError,
  MaxRetriesExceededError,
  TimeoutError
} from '../core/error_handler';

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




// TokenBucket tests removed per ADR-002
// For rate-limiting tests, see tests for core/rate-limit-adapter.ts (AIXTokenBucket)
