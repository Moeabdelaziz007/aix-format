# AIX API Excellence Guide

**Version:** 1.1  
**Author:** Mohamed H Abdelaziz  
**Organization:** AMRIKYY AI Solutions  
**Date:** January 2025  
**Contact:** amrikyy@gmail.com

---

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**  
Licensed under MIT with Attribution Requirements.

---

## Abstract

This document specifies production-grade API integration patterns for AIX agents. It covers error handling, pagination, rate limiting, versioning, caching, and resilience patterns based on industry best practices from Netflix, AWS, Google, and Stripe.

**Target Audience:** Agent developers, API integrators, runtime implementers

---

## Table of Contents

1. [Error Handling & Retry Strategies](#1-error-handling--retry-strategies)
2. [Pagination Patterns](#2-pagination-patterns)
3. [Rate Limiting Architecture](#3-rate-limiting-architecture)
4. [API Versioning Strategies](#4-api-versioning-strategies)
5. [Caching Patterns](#5-caching-patterns)
6. [Timeout Management](#6-timeout-management)
7. [Circuit Breaker Pattern](#7-circuit-breaker-pattern)

---

## 1. Error Handling & Retry Strategies

### 1.1 Standardized Error Response (RFC 7807)

**All AIX-aware systems MUST return errors in RFC 7807 Problem Details format:**

```json
{
  "error": {
    "type": "https://aix-format.org/errors/rate-limit-exceeded",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "You have exceeded 100 requests per minute",
    "instance": "/api/v1/search?q=quantum",
    "retry_after": 60,
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | URI | Yes | Absolute URI identifying the error type |
| `title` | string | Yes | Short, human-readable summary |
| `status` | integer | Yes | HTTP status code |
| `detail` | string | No | Human-readable explanation |
| `instance` | URI | No | URI reference to specific occurrence |
| `retry_after` | integer | No | Seconds until retry (for 429, 503) |
| `request_id` | string | No | Unique request identifier |
| `timestamp` | ISO 8601 | No | When error occurred |

### 1.2 Error Classification

```yaml
apis:
  - name: "scholarly_api"
    error_handling:
      
      # Transient errors - RETRY these
      retryable_errors:
        - status_code: 408  # Request Timeout
          strategy: "linear_backoff"
          max_attempts: 2
        
        - status_code: 429  # Too Many Requests
          strategy: "exponential_backoff"
          max_attempts: 5
          respect_retry_after_header: true
        
        - status_code: [500, 502, 503, 504]  # Server errors
          strategy: "exponential_backoff"
          max_attempts: 3
          initial_delay_ms: 500
          max_delay_ms: 16000
          jitter: true
      
      # Permanent errors - DON'T retry
      fatal_errors:
        - status_code: [400, 401, 403, 404, 405, 422]
          action: "fail_immediately"
          log_level: "error"
          notify_user: true
```

### 1.3 Backoff Strategies

#### Exponential Backoff (Recommended)

```yaml
retry:
  strategy: "exponential_backoff"
  initial_delay_ms: 1000
  max_delay_ms: 32000
  multiplier: 2
  jitter: true
```

**Formula:**
```
delay = min(initial_delay * 2^(attempt-1), max_delay)
if jitter:
  delay = delay * (0.5 + random(0, 0.5))
```

**Example Sequence (with jitter):**
- Attempt 1: Immediate
- Attempt 2: ~750-1000ms
- Attempt 3: ~1500-2000ms
- Attempt 4: ~3000-4000ms
- Attempt 5: ~6000-8000ms

**Benefits:**
- ✅ Reduces server load gradually
- ✅ Jitter prevents thundering herd
- ✅ Industry standard (AWS, Google)

#### Linear Backoff

```yaml
retry:
  strategy: "linear_backoff"
  delay_increment_ms: 1000
  max_attempts: 3
```

**Formula:**
```
delay = delay_increment * attempt
```

**Use Cases:**
- Predictable retry timing
- User-facing operations
- Quick timeout scenarios

#### Constant Backoff

```yaml
retry:
  strategy: "constant"
  delay_ms: 5000
  max_attempts: 2
```

**Use Cases:**
- Known recovery time
- Health checks
- Simple retry logic

### 1.4 Implementation

**File:** `core/error_handler.js`

```javascript
/**
 * AIX Error Handler - Production-Grade Retry & Circuit Breaker
 * Created by Mohamed H Abdelaziz - AMRIKYY AI Solutions 2025
 * 
 * Research backing:
 * - Netflix Hystrix (2012): Circuit breaker pattern
 * - AWS Well-Architected Framework: Exponential backoff with jitter
 * - Google SRE Book: Error budgets and graceful degradation
 */

class AIXErrorHandler {
  constructor(config) {
    this.circuitBreakers = new Map();  // Per-API circuit breakers
    this.rateLimiters = new Map();     // Token bucket rate limiters
    this.config = config;
  }
  
  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(apiName, operation, errorConfig) {
    const circuitBreaker = this.getCircuitBreaker(apiName);
    
    // Check circuit breaker state
    if (circuitBreaker.isOpen()) {
      throw new CircuitBreakerError(
        `Circuit breaker open for ${apiName}`,
        { 
          nextAttempt: circuitBreaker.nextAttemptTime,
          state: 'OPEN'
        }
      );
    }
    
    let lastError;
    let attempt = 0;
    
    while (attempt < errorConfig.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(
          operation,
          errorConfig.timeout
        );
        
        circuitBreaker.recordSuccess();
        return result;
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Determine if error is retryable
        if (!this.isRetryable(error, errorConfig)) {
          circuitBreaker.recordFailure();
          throw this.formatError(error, apiName);
        }
        
        // Check if this is the last attempt
        if (attempt >= errorConfig.maxAttempts) {
          break;
        }
        
        // Calculate backoff delay
        const delay = this.calculateBackoff(
          attempt,
          errorConfig.strategy,
          errorConfig.initialDelay,
          errorConfig.maxDelay,
          errorConfig.jitter
        );
        
        // Log retry attempt
        console.warn(
          `API ${apiName} failed (attempt ${attempt}/${errorConfig.maxAttempts}). ` +
          `Retrying in ${delay}ms...`,
          { 
            error: error.message, 
            status: error.status,
            request_id: error.request_id
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
   */
  calculateBackoff(attempt, strategy, initial, max, jitter) {
    let delay;
    
    switch (strategy) {
      case 'exponential_backoff':
        delay = Math.min(initial * Math.pow(2, attempt - 1), max);
        break;
      
      case 'linear_backoff':
        delay = Math.min(initial * attempt, max);
        break;
      
      case 'constant':
        delay = initial;
        break;
      
      default:
        delay = initial;
    }
    
    // Add jitter to prevent thundering herd
    if (jitter) {
      // Random value between 50% and 100% of calculated delay
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
  
  /**
   * Check if error is retryable
   */
  isRetryable(error, config) {
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
    
    return retryable && !fatal;
  }
  
  /**
   * Format error in RFC 7807 format
   */
  formatError(error, apiName) {
    return {
      error: {
        type: `https://aix-format.org/errors/${this.getErrorType(error.status)}`,
        title: this.getErrorTitle(error.status),
        status: error.status,
        detail: error.message,
        instance: error.url,
        request_id: error.request_id || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        api_name: apiName
      }
    };
  }
  
  /**
   * Get or create circuit breaker for API
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
   * Helper: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Helper: Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Helper: Get error type from status code
   */
  getErrorType(status) {
    const types = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      408: 'request-timeout',
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
   */
  getErrorTitle(status) {
    const titles = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      408: 'Request Timeout',
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
 * States:
 * - CLOSED: Normal operation
 * - OPEN: Failing, reject all requests
 * - HALF_OPEN: Testing if service recovered
 */
class CircuitBreaker {
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
  
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.close();
      }
    } else {
      this.failures = 0;
    }
  }
  
  recordFailure() {
    this.failures++;
    if (this.failures >= this.config.failureThreshold) {
      this.open();
    }
  }
  
  open() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + (this.config.timeoutSeconds * 1000);
    console.error(
      `Circuit breaker OPEN. Will retry at ${new Date(this.nextAttemptTime).toISOString()}`
    );
  }
  
  close() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptTime = null;
    console.info('Circuit breaker CLOSED. Normal operation resumed.');
  }
  
  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
        return false;
      }
      return true;
    }
    return false;
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null
    };
  }
}

/**
 * Custom Error Classes
 */
class CircuitBreakerError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.details = details;
  }
}

class MaxRetriesExceededError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MaxRetriesExceededError';
    this.details = details;
  }
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export { AIXErrorHandler, CircuitBreaker };
```

---

## 2. Pagination Patterns

### 2.1 Overview

AIX supports three pagination strategies. Choose based on your use case:

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| **Offset** | Small datasets, simple UIs | Simple, stateless | Performance degrades on large datasets |
| **Cursor** | Large datasets, real-time data | Consistent, fast | Complex implementation |
| **Page** | Traditional pagination UIs | User-friendly | Inconsistent with real-time updates |

### 2.2 Offset-Based Pagination

**Best for:** Simple APIs, small to medium datasets

```yaml
apis:
  - name: "simple_api"
    endpoints:
      - path: "/items"
        method: "GET"
        pagination:
          type: "offset"
          parameters:
            limit:
              name: "limit"
              type: "integer"
              default: 20
              minimum: 1
              maximum: 100
            offset:
              name: "offset"
              type: "integer"
              default: 0
              minimum: 0
```

**Usage:**
```http
GET /items?limit=20&offset=0   # Page 1 (items 1-20)
GET /items?limit=20&offset=20  # Page 2 (items 21-40)
GET /items?limit=20&offset=40  # Page 3 (items 41-60)
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total_count": 250
  }
}
```

**Pros:**
- ✅ Simple to implement
- ✅ Easy to jump to any page
- ✅ Stateless

**Cons:**
- ❌ Performance degrades with large offsets (SQL: `OFFSET 1000000`)
- ❌ Inconsistent results if data changes between requests
- ❌ Skipped/duplicate items possible

### 2.3 Cursor-Based Pagination (Recommended)

**Best for:** Large datasets, infinite scroll, real-time data

```yaml
apis:
  - name: "recommended_api"
    endpoints:
      - path: "/feed"
        method: "GET"
        pagination:
          type: "cursor"
          parameters:
            per_page:
              name: "per_page"
              type: "integer"
              default: 50
              maximum: 100
            cursor:
              name: "cursor"
              type: "string"
              encoding: "base64"
              description: "Opaque cursor for next page"
```

**Usage:**
```http
GET /feed?per_page=50                          # First page
GET /feed?per_page=50&cursor=eyJpZCI6MTIzfQ==  # Next page
```

**Response:**
```json
{
  "data": [
    {"id": 1, "title": "Item 1"},
    {"id": 2, "title": "Item 2"}
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ==",
    "prev_cursor": "eyJpZCI6OTh9",
    "has_more": true
  }
}
```

**Cursor Format (Base64-encoded JSON):**
```json
// Decoded cursor
{
  "id": 123,
  "created_at": "2025-01-15T10:30:00Z",
  "sort_key": "popularity"
}
```

**Pros:**
- ✅ Consistent performance (no large offsets)
- ✅ No skipped/duplicate items
- ✅ Works with real-time data
- ✅ Scales to billions of records

**Cons:**
- ❌ Cannot jump to arbitrary page
- ❌ More complex to implement
- ❌ Cursor format must be stable

**Used by:** Twitter, Facebook, Stripe, GitHub (v3), Instagram

### 2.4 Page-Based Pagination

**Best for:** Traditional pagination UIs with page numbers

```yaml
apis:
  - name: "traditional_api"
    endpoints:
      - path: "/articles"
        method: "GET"
        pagination:
          type: "page"
          parameters:
            page:
              name: "page"
              type: "integer"
              default: 1
              minimum: 1
            per_page:
              name: "per_page"
              type: "integer"
              default: 25
              maximum: 100
```

**Usage:**
```http
GET /articles?page=1&per_page=25  # Page 1
GET /articles?page=2&per_page=25  # Page 2
GET /articles?page=3&per_page=25  # Page 3
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total_pages": 10,
    "total_count": 250,
    "has_next": true,
    "has_prev": false
  }
}
```

**Pros:**
- ✅ Intuitive for users
- ✅ Can display total pages
- ✅ Easy to implement

**Cons:**
- ❌ Total count expensive on large datasets
- ❌ Inconsistent with real-time updates
- ❌ Performance degrades on later pages

---

## 3. Rate Limiting Architecture

### 3.1 Token Bucket Algorithm

```yaml
apis:
  - name: "api_with_rate_limit"
    rate_limiting:
      algorithm: "token_bucket"
      
      # Global limits
      global:
        requests_per_second: 10
        requests_per_minute: 100
        requests_per_hour: 5000
        burst_size: 20  # Allow bursts up to 20 req/s
      
      # Per-endpoint limits
      endpoints:
        "/search":
          requests_per_minute: 60
          burst_size: 10
        
        "/upload":
          requests_per_minute: 10
          burst_size: 2
```

**Implementation:**
```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;  // tokens per second
    this.lastRefill = Date.now();
  }
  
  tryConsume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getWaitTime() {
    if (this.tokens >= 1) return 0;
    
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000;
  }
}
```

### 3.2 Rate Limit Headers

**Send in every response:**
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1642252800
X-RateLimit-Retry-After: 60
```

**On rate limit exceeded:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642252800

{
  "error": {
    "type": "https://aix-format.org/errors/rate-limit-exceeded",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "You have exceeded 100 requests per minute",
    "retry_after": 60
  }
}
```

---

## 4. API Versioning Strategies

### 4.1 URI Versioning (Recommended)

```yaml
apis:
  - name: "versioned_api"
    versioning:
      strategy: "uri"
      current_version: "v2"
      supported_versions: ["v1", "v2"]
      deprecated_versions: ["v1"]
      
      base_urls:
        v1: "https://api.example.com/v1"
        v2: "https://api.example.com/v2"
      
      deprecation:
        v1:
          deprecated_date: "2024-12-01"
          sunset_date: "2025-06-01"
          migration_guide: "https://docs.example.com/migrate-v1-to-v2"
```

**Usage:**
```http
GET https://api.example.com/v1/users  # Old version
GET https://api.example.com/v2/users  # New version
```

**Pros:**
- ✅ Clear and explicit
- ✅ Easy to route
- ✅ Can run multiple versions

**Cons:**
- ❌ URL pollution
- ❌ Client must update URLs

### 4.2 Header Versioning

```yaml
versioning:
  strategy: "header"
  header_name: "X-API-Version"
  default_version: "2"
```

**Usage:**
```http
GET https://api.example.com/users
X-API-Version: 2
```

### 4.3 Accept Header Versioning

```yaml
versioning:
  strategy: "accept_header"
  media_types:
    v1: "application/vnd.example.v1+json"
    v2: "application/vnd.example.v2+json"
```

**Usage:**
```http
GET https://api.example.com/users
Accept: application/vnd.example.v2+json
```

---

## 5. Caching Patterns

### 5.1 HTTP Caching

```yaml
apis:
  - name: "cacheable_api"
    caching:
      enabled: true
      
      # Cache control
      cache_control:
        public: true
        max_age: 3600  # 1 hour
        s_maxage: 7200  # 2 hours (CDN)
        stale_while_revalidate: 300
      
      # ETags for validation
      etag:
        enabled: true
        algorithm: "sha256"
      
      # Last-Modified header
      last_modified: true
```

**Response Headers:**
```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600, s-maxage=7200
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Tue, 15 Jan 2025 10:30:00 GMT
```

### 5.2 Client-Side Caching

```yaml
memory:
  caching:
    enabled: true
    ttl_seconds: 3600
    max_size_mb: 100
    
    strategies:
      # Time-based
      - type: "ttl"
        duration: 3600
      
      # Size-based (LRU)
      - type: "lru"
        max_entries: 1000
      
      # Validation-based
      - type: "etag"
        revalidate: true
```

---

## 6. Timeout Management

### 6.1 Timeout Configuration

```yaml
apis:
  - name: "timeout_controlled_api"
    timeout:
      # Connection timeout
      connect_ms: 5000
      
      # Read timeout (first byte)
      read_ms: 30000
      
      # Total request timeout
      total_ms: 60000
      
      # Per-operation timeouts
      operations:
        search:
          total_ms: 10000
        upload:
          total_ms: 300000  # 5 minutes
```

### 6.2 Timeout Strategies

```javascript
class TimeoutManager {
  async executeWithTimeout(operation, timeoutMs, strategy = 'abort') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const result = await operation({ signal: controller.signal });
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        switch (strategy) {
          case 'abort':
            throw new TimeoutError(`Operation timeout after ${timeoutMs}ms`);
          
          case 'retry':
            return this.executeWithTimeout(operation, timeoutMs * 2, 'abort');
          
          case 'fallback':
            return this.getFallbackValue();
          
          default:
            throw error;
        }
      }
      
      throw error;
    }
  }
}
```

---

## 7. Circuit Breaker Pattern

### 7.1 Configuration

```yaml
circuit_breaker:
  enabled: true
  failure_threshold: 5      # Open after 5 failures
  success_threshold: 2      # Close after 2 successes in HALF_OPEN
  timeout_seconds: 60       # Wait 60s before HALF_OPEN
  half_open_max_requests: 3 # Max requests in HALF_OPEN state
```

### 7.2 State Diagram

```
     [Failures < threshold]
            │
            ▼
    ┌──── CLOSED ────┐
    │   (Normal)     │
    │  Requests OK   │
    └────────────────┘
            │
[Failures ≥ threshold]
            │
            ▼
    ┌──── OPEN ──────┐
    │  (Failing)     │
    │  Reject All    │
    └────────────────┘
            │
  [After timeout_seconds]
            │
            ▼
    ┌── HALF_OPEN ───┐
    │  (Testing)     │
    │ Try N requests │
    └────────────────┘
         │       │
[Success ≥ N]   [Any failure]
         │       │
         ▼       ▼
      CLOSED    OPEN
```

---

## Research References

### Industry Best Practices
- **Netflix Hystrix** (2012): Circuit breaker for microservices
- **AWS Well-Architected Framework**: Exponential backoff with jitter
- **Google SRE Book**: Error budgets, graceful degradation
- **Stripe API**: Cursor-based pagination, idempotency keys
- **Twitter API**: Rate limiting, cursor pagination

### Standards
- **RFC 7807**: Problem Details for HTTP APIs
- **RFC 7231**: HTTP/1.1 Semantics (caching, status codes)
- **RFC 6585**: Additional HTTP Status Codes (429 Too Many Requests)

---

**End of API Excellence Guide**

For questions: amrikyy@gmail.com

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**

