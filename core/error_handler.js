/**
 * AIX Error Handler - Production-Grade Retry & Circuit Breaker
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Implements production-grade error handling including:
 * - Retry logic with exponential/linear/constant backoff
 * - Circuit breaker pattern (Hystrix-style)
 * - Rate limiting (token bucket algorithm)
 * - RFC 7807 error formatting
 * 
 * Research backing:
 * - Netflix Hystrix (2012): Circuit breaker pattern for microservices
 * - AWS Well-Architected Framework: Exponential backoff with jitter
 * - Google SRE Book: Error budgets and graceful degradation
 * 
 * Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 * Licensed under MIT License - See LICENSE.md
 */

/**
 * Main error handler class
 */
export class AIXErrorHandler {
  constructor(config = {}) {
    this.circuitBreakers = new Map();  // Per-API circuit breakers
    this.rateLimiters = new Map();     // Token bucket rate limiters
    this.config = {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeoutSeconds: 60,
        ...config.circuitBreaker
      },
      defaultRetry: {
        maxAttempts: 3,
        strategy: 'exponential_backoff',
        initialDelay: 1000,
        maxDelay: 32000,
        jitter: true,
        ...config.defaultRetry
      }
    };
  }
  
  /**
   * Execute operation with retry logic
   * 
   * @param {string} apiName - Name of the API
   * @param {Function} operation - Async function to execute
   * @param {Object} errorConfig - Error handling configuration
   * @returns {Promise<any>} Result of operation
   */
  async executeWithRetry(apiName, operation, errorConfig = {}) {
    const config = { ...this.config.defaultRetry, ...errorConfig };
    const circuitBreaker = this.getCircuitBreaker(apiName);
    
    // Check circuit breaker state
    if (circuitBreaker.isOpen()) {
      throw new CircuitBreakerError(
        `Circuit breaker open for ${apiName}`,
        { 
          nextAttempt: circuitBreaker.nextAttemptTime,
          state: 'OPEN',
          apiName
        }
      );
    }
    
    let lastError;
    let attempt = 0;
    
    while (attempt < config.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(
          operation,
          config.timeout || 30000
        );
        
        circuitBreaker.recordSuccess();
        return result;
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Determine if error is retryable
        if (!this.isRetryable(error, config)) {
          circuitBreaker.recordFailure();
          throw this.formatError(error, apiName);
        }
        
        // Check if this is the last attempt
        if (attempt >= config.maxAttempts) {
          break;
        }
        
        // Calculate backoff delay
        const delay = this.calculateBackoff(
          attempt,
          config.strategy,
          config.initialDelay || 1000,
          config.maxDelay || 32000,
          config.jitter !== false
        );
        
        // Log retry attempt
        console.warn(
          `[AIX] API ${apiName} failed (attempt ${attempt}/${config.maxAttempts}). ` +
          `Retrying in ${delay}ms...`,
          { 
            error: error.message, 
            status: error.status,
            request_id: error.request_id,
            timestamp: new Date().toISOString()
          }
        );
        
        await this.sleep(delay);
      }
    }
    
    // All retries exhausted
    circuitBreaker.recordFailure();
    throw new MaxRetriesExceededError(
      `Failed after ${attempt} attempts`,
      { lastError, apiName, attempts: attempt }
    );
  }
  
  /**
   * Execute with timeout
   * 
   * @param {Function} operation - Async function to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>} Result of operation
   */
  async executeWithTimeout(operation, timeoutMs) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new TimeoutError(`Operation timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }
  
  /**
   * Calculate backoff delay
   * 
   * @param {number} attempt - Attempt number (1-indexed)
   * @param {string} strategy - Backoff strategy
   * @param {number} initial - Initial delay in ms
   * @param {number} max - Maximum delay in ms
   * @param {boolean} jitter - Whether to add jitter
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(attempt, strategy, initial, max, jitter) {
    let delay;
    
    switch (strategy) {
      case 'exponential_backoff':
        // Exponential: initial * 2^(attempt-1)
        delay = Math.min(initial * Math.pow(2, attempt - 1), max);
        break;
      
      case 'linear_backoff':
        // Linear: initial * attempt
        delay = Math.min(initial * attempt, max);
        break;
      
      case 'constant':
        // Constant: always initial delay
        delay = initial;
        break;
      
      default:
        console.warn(`[AIX] Unknown backoff strategy: ${strategy}, using constant`);
        delay = initial;
    }
    
    // Add jitter to prevent thundering herd
    // Random value between 50% and 100% of calculated delay
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
  
  /**
   * Check if error is retryable
   * 
   * @param {Error} error - Error object with status code
   * @param {Object} config - Error configuration
   * @returns {boolean} Whether error is retryable
   */
  isRetryable(error, config) {
    // Default retryable status codes if not specified
    const defaultRetryable = [408, 429, 500, 502, 503, 504];
    const defaultFatal = [400, 401, 403, 404, 405, 422];
    
    // Check if status code is in retryable list
    const retryable = config.retryableErrors?.find(rule =>
      Array.isArray(rule.statusCode)
        ? rule.statusCode.includes(error.status)
        : rule.statusCode === error.status
    );
    
    // Check if it's a fatal error
    const fatal = config.fatalErrors?.find(rule =>
      Array.isArray(rule.statusCode)
        ? rule.statusCode.includes(error.status)
        : rule.statusCode === error.status
    );
    
    // If explicit config exists, use it
    if (retryable || fatal) {
      return retryable && !fatal;
    }
    
    // Fall back to defaults
    return defaultRetryable.includes(error.status) &&
           !defaultFatal.includes(error.status);
  }
  
  /**
   * Format error in RFC 7807 Problem Details format
   * 
   * @param {Error} error - Error object
   * @param {string} apiName - API name
   * @returns {Object} Formatted error
   */
  formatError(error, apiName) {
    return {
      error: {
        type: `https://aix-format.org/errors/${this.getErrorType(error.status)}`,
        title: this.getErrorTitle(error.status),
        status: error.status || 500,
        detail: error.message,
        instance: error.url,
        request_id: error.request_id || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        api_name: apiName,
        retry_after: error.retryAfter
      }
    };
  }
  
  /**
   * Get or create circuit breaker for API
   * 
   * @param {string} apiName - API name
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(apiName) {
    if (!this.circuitBreakers.has(apiName)) {
      this.circuitBreakers.set(
        apiName,
        new CircuitBreaker(this.config.circuitBreaker)
      );
    }
    return this.circuitBreakers.get(apiName);
  }
  
  /**
   * Get circuit breaker state for API
   * 
   * @param {string} apiName - API name
   * @returns {Object} Circuit breaker state
   */
  getCircuitBreakerState(apiName) {
    const breaker = this.circuitBreakers.get(apiName);
    return breaker ? breaker.getState() : null;
  }
  
  /**
   * Reset circuit breaker for API
   * 
   * @param {string} apiName - API name
   */
  resetCircuitBreaker(apiName) {
    const breaker = this.circuitBreakers.get(apiName);
    if (breaker) {
      breaker.close();
    }
  }
  
  /**
   * Helper: Sleep for specified milliseconds
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Helper: Generate unique request ID
   * 
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Helper: Get error type from status code
   * 
   * @param {number} status - HTTP status code
   * @returns {string} Error type
   */
  getErrorType(status) {
    const types = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      405: 'method-not-allowed',
      408: 'request-timeout',
      422: 'unprocessable-entity',
      429: 'rate-limit-exceeded',
      500: 'internal-server-error',
      502: 'bad-gateway',
      503: 'service-unavailable',
      504: 'gateway-timeout'
    };
    return types[status] || 'unknown-error';
  }
  
  /**
   * Helper: Get error title from status code
   * 
   * @param {number} status - HTTP status code
   * @returns {string} Error title
   */
  getErrorTitle(status) {
    const titles = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      408: 'Request Timeout',
      422: 'Unprocessable Entity',
      429: 'Rate Limit Exceeded',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    return titles[status] || 'Unknown Error';
  }
}

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

export class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Token Bucket Rate Limiter
 * 
 * Implements token bucket algorithm for rate limiting.
 */
export class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;          // Maximum tokens
    this.tokens = capacity;            // Current tokens
    this.refillRate = refillRate;      // Tokens per second
    this.lastRefill = Date.now();
  }
  
  /**
   * Try to consume tokens
   * 
   * @param {number} tokens - Number of tokens to consume
   * @returns {boolean} True if tokens were consumed
   */
  tryConsume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;  // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  /**
   * Get wait time until token available
   * 
   * @returns {number} Wait time in milliseconds
   */
  getWaitTime() {
    if (this.tokens >= 1) return 0;
    
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000;
  }
  
  /**
   * Get current state
   * 
   * @returns {Object} State information
   */
  getState() {
    this.refill();  // Ensure tokens are up to date
    
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      refillRate: this.refillRate,
      utilization: (1 - this.tokens / this.capacity) * 100
    };
  }
}

