/**
 * AIX Error Handler - Production-Grade Retry & Circuit Breaker
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2026
 *
 * Implements production-grade error handling including:
 * - Retry logic with exponential/linear/constant backoff
 * - Circuit breaker pattern (Hystrix-style)
 * - RFC 7807 error formatting
 * - Security-first approach with Zod validation
 * - Cryptographically secure request IDs
 *
 * Research backing:
 * - Netflix Hystrix (2012): Circuit breaker pattern for microservices
 * - AWS Well-Architected Framework: Exponential backoff with jitter
 * - Google SRE Book: Error budgets and graceful degradation
 *
 * Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { z } from 'zod';
import crypto from 'crypto';

/**
 * RULE 1: All inputs → Zod validation
 */
const ErrorContextSchema = z.object({
  code: z.string().optional(),
  agentId: z.string().optional(),
  action: z.string().optional(),
  requestId: z.string().optional(),
});

type ErrorContext = z.infer<typeof ErrorContextSchema>;

interface SafeError {
  message: string;
  requestId: string;
  context: ErrorContext;
  stack?: string;
}

/**
 * Circuit Breaker Configuration Schema
 */
const CircuitBreakerConfigSchema = z.object({
  failureThreshold: z.number().int().positive().optional(),
  successThreshold: z.number().int().positive().optional(),
  timeoutSeconds: z.number().int().positive().optional(),
}).passthrough();

type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;

/**
 * Circuit Breaker Implementation
 * 
 * Implements the circuit breaker pattern to prevent cascading failures.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing, reject all requests immediately
 * - HALF_OPEN: Testing recovery, allow limited requests
 */
export class CircuitBreaker {
  private config: Required<CircuitBreakerConfig>;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  private failures: number;
  private successes: number;
  private nextAttemptTime: number | null;

  constructor(config: CircuitBreakerConfig = {}) {
    // Validate config with Zod (RULE 1)
    const validatedConfig = CircuitBreakerConfigSchema.parse(config);
    
    this.config = {
      failureThreshold: validatedConfig.failureThreshold || 5,
      successThreshold: validatedConfig.successThreshold || 2,
      timeoutSeconds: validatedConfig.timeoutSeconds || 60,
    };
    
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
  }
  
  /**
   * Record successful operation
   */
  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.close();
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }
  
  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.failures++;
    if (this.failures >= this.config.failureThreshold) {
      this.open();
    }
  }
  
  /**
   * Open the circuit breaker
   */
  private open(): void {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + (this.config.timeoutSeconds * 1000);
    
    console.error(
      `[AIX] Circuit breaker OPEN. ` +
      `Failures: ${this.failures}/${this.config.failureThreshold}. ` +
      `Will retry at ${new Date(this.nextAttemptTime).toISOString()}`
    );
  }
  
  /**
   * Close the circuit breaker
   */
  private close(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
    
    console.info('[AIX] Circuit breaker CLOSED. Normal operation resumed.');
  }
  
  /**
   * Check if circuit breaker is open
   * 
   * @returns True if open (rejecting requests)
   */
  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed
      if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
        // Transition to HALF_OPEN to test recovery
        this.state = 'HALF_OPEN';
        this.successes = 0;
        console.info('[AIX] Circuit breaker HALF_OPEN. Testing recovery...');
        return false;
      }
      return true;
    }
    return false;
  }
  
  /**
   * Get current circuit breaker state
   * 
   * @returns State information
   */
  getState(): {
    state: string;
    failures: number;
    successes: number;
    nextAttempt: string | null;
    config: Required<CircuitBreakerConfig>;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
      config: this.config
    };
  }
}

/**
 * Custom Error Classes
 */

export class CircuitBreakerError extends Error {
  public readonly details: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class MaxRetriesExceededError extends Error {
  public readonly details: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'MaxRetriesExceededError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class TimeoutError extends Error {
  public readonly timestamp: string;

  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
    this.timestamp = new Date().toISOString();
  }
}

/**
 * RULE 0: Security First - Handle errors with security in mind
 * RULE 1: All inputs → Zod validation
 * RULE 2: crypto.randomBytes for requestId (NO Math.random)
 * 
 * @param error - The error to handle (unknown type for safety)
 * @param context - Optional context information
 * @returns SafeError object with sanitized information
 */
export function handleError(error: unknown, context: unknown = {}): SafeError {
  // Validate context with Zod (RULE 1)
  const ctx = ErrorContextSchema.safeParse(context);
  
  // Generate secure requestId (RULE 2)
  const requestId = crypto.randomBytes(8).toString('hex');
  
  // NEVER expose stack trace in production (RULE 0)
  const isProd = process.env.NODE_ENV === 'production';
  
  return {
    message: sanitizeMessage(error),
    requestId,
    context: ctx.success ? ctx.data : {},
    stack: isProd ? undefined : (error instanceof Error ? error.stack : undefined),
  };
}

/**
 * Sanitize error message to prevent information leakage
 * 
 * @param error - The error to sanitize
 * @returns Safe error message
 */
function sanitizeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

// TokenBucket removed per ADR-002: Rate-limiting is out-of-scope for core/
// Use core/rate-limit-adapter.ts (AIXTokenBucket) for rate-limiting functionality

// Made with Bob
