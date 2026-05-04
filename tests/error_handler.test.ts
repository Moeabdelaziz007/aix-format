/**
 * AIX Error Handler Security Tests
 * 
 * Tests security-first approach:
 * - RULE 0: Security First - stack traces hidden in production
 * - RULE 1: Zod validation for all inputs
 * - RULE 2: crypto.randomBytes for requestId (no Math.random)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleError, CircuitBreaker, CircuitBreakerError, MaxRetriesExceededError, TimeoutError } from '../core/error_handler';

describe('error_handler security', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('RULE 0: Security First', () => {
    it('hides stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      const result = handleError(error);
      
      expect(result.stack).toBeUndefined();
      expect(result.message).toBe('Test error');
      expect(result.requestId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('shows stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const result = handleError(error);
      
      expect(result.stack).toBeDefined();
      expect(result.stack).toContain('Test error');
    });

    it('shows stack trace when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const error = new Error('Test error');
      const result = handleError(error);
      
      expect(result.stack).toBeDefined();
    });
  });

  describe('RULE 1: Zod validation', () => {
    it('validates context with Zod', () => {
      const result = handleError(new Error('test'), {
        agentId: 'agent-123',
        action: 'spawn',
      });
      
      expect(result.context.agentId).toBe('agent-123');
      expect(result.context.action).toBe('spawn');
    });

    it('handles invalid context gracefully', () => {
      const result = handleError(new Error('test'), {
        invalidField: 'should be ignored',
        agentId: 'agent-123',
      });
      
      // Only valid fields should be present
      expect(result.context.agentId).toBe('agent-123');
      expect('invalidField' in result.context).toBe(false);
    });

    it('handles null context', () => {
      const result = handleError(new Error('test'), null);
      
      expect(result.context).toEqual({});
      expect(result.requestId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('handles undefined context', () => {
      const result = handleError(new Error('test'));
      
      expect(result.context).toEqual({});
      expect(result.requestId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('validates all ErrorContext fields', () => {
      const result = handleError(new Error('test'), {
        code: 'ERR_001',
        agentId: 'agent-456',
        action: 'execute',
        requestId: 'existing-id',
      });
      
      expect(result.context.code).toBe('ERR_001');
      expect(result.context.agentId).toBe('agent-456');
      expect(result.context.action).toBe('execute');
      expect(result.context.requestId).toBe('existing-id');
    });
  });

  describe('RULE 2: crypto.randomBytes for requestId', () => {
    it('uses crypto.randomBytes for requestId', () => {
      const result1 = handleError(new Error('test'));
      const result2 = handleError(new Error('test'));
      
      // Different IDs
      expect(result1.requestId).not.toBe(result2.requestId);
      // Hex format (16 chars = 8 bytes)
      expect(result1.requestId).toMatch(/^[0-9a-f]{16}$/);
      expect(result2.requestId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('generates cryptographically secure IDs', () => {
      const ids = new Set<string>();
      
      // Generate 1000 IDs and check for collisions
      for (let i = 0; i < 1000; i++) {
        const result = handleError(new Error('test'));
        ids.add(result.requestId);
      }
      
      // No collisions expected with crypto.randomBytes
      expect(ids.size).toBe(1000);
    });
  });

  describe('Error message sanitization', () => {
    it('handles Error instances', () => {
      const error = new Error('Detailed error message');
      const result = handleError(error);
      
      expect(result.message).toBe('Detailed error message');
    });

    it('handles string errors', () => {
      const result = handleError('String error message');
      
      expect(result.message).toBe('String error message');
    });

    it('handles unknown error types', () => {
      const result = handleError({ weird: 'object' });
      
      expect(result.message).toBe('Unknown error occurred');
    });

    it('handles null errors', () => {
      const result = handleError(null);
      
      expect(result.message).toBe('Unknown error occurred');
    });

    it('handles undefined errors', () => {
      const result = handleError(undefined);
      
      expect(result.message).toBe('Unknown error occurred');
    });
  });
});

describe('CircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const breaker = new CircuitBreaker();
    const state = breaker.getState();
    
    expect(state.state).toBe('CLOSED');
    expect(state.failures).toBe(0);
    expect(state.successes).toBe(0);
  });

  it('validates config with Zod', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 1,
      timeoutSeconds: 30,
    });
    
    const state = breaker.getState();
    expect(state.config.failureThreshold).toBe(3);
    expect(state.config.successThreshold).toBe(1);
    expect(state.config.timeoutSeconds).toBe(30);
  });

  it('opens after failure threshold', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });
    
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
    
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
  });

  it('resets failures on success in CLOSED state', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });
    
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    
    const state = breaker.getState();
    expect(state.failures).toBe(0);
  });

  it('transitions to HALF_OPEN after timeout', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      timeoutSeconds: 1, // 1 second timeout
    });
    
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(breaker.isOpen()).toBe(false);
    const state = breaker.getState();
    expect(state.state).toBe('HALF_OPEN');
  });

  it('closes from HALF_OPEN after success threshold', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeoutSeconds: 0,
    });
    
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
    
    // Force HALF_OPEN
    breaker.isOpen(); // This will transition to HALF_OPEN if timeout elapsed
    
    breaker.recordSuccess();
    breaker.recordSuccess();
    
    const state = breaker.getState();
    expect(state.state).toBe('CLOSED');
  });
});

describe('Custom Error Classes', () => {
  it('CircuitBreakerError includes details and timestamp', () => {
    const error = new CircuitBreakerError('Circuit open', { attempts: 5 });
    
    expect(error.name).toBe('CircuitBreakerError');
    expect(error.message).toBe('Circuit open');
    expect(error.details.attempts).toBe(5);
    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('MaxRetriesExceededError includes details and timestamp', () => {
    const error = new MaxRetriesExceededError('Max retries', { retries: 3 });
    
    expect(error.name).toBe('MaxRetriesExceededError');
    expect(error.message).toBe('Max retries');
    expect(error.details.retries).toBe(3);
    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('TimeoutError includes timestamp', () => {
    const error = new TimeoutError('Operation timed out');
    
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Operation timed out');
    expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// Made with Bob
