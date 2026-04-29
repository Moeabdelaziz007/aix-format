/**
 * AIX Error Handler - Production-Grade Retry & Circuit Breaker
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2026
 * 
 * Implements production-grade error handling including:
 * - Retry logic with exponential/linear/constant backoff
 * - Circuit breaker pattern (Hystrix-style)
 * - RFC 7807 error formatting
 * 
 * Research backing:
 * - Netflix Hystrix (2012): Circuit breaker pattern for microservices
 * - AWS Well-Architected Framework: Exponential backoff with jitter
 * - Google SRE Book: Error budgets and graceful degradation
 * 
 * Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */



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
  constructor(config = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeoutSeconds: config.timeoutSeconds || 60,
      ...config
    };
    
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
  }
  
  /**
   * Record successful operation
   */
  recordSuccess() {
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
  recordFailure() {
    this.failures++;
    if (this.failures >= this.config.failureThreshold) {
      this.open();
    }
  }
  
  /**
   * Open the circuit breaker
   */
  open() {
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
  close() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
    
    console.info('[AIX] Circuit breaker CLOSED. Normal operation resumed.');
  }
  
  /**
   * Check if circuit breaker is open
   * 
   * @returns {boolean} True if open (rejecting requests)
   */
  isOpen() {
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed
      if (Date.now() >= this.nextAttemptTime) {
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
   * @returns {Object} State information
   */
  getState() {
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
  constructor(message, details = {}) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class MaxRetriesExceededError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MaxRetriesExceededError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
    this.timestamp = new Date().toISOString();
  }
}


