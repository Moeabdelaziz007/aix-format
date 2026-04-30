/**
 * Token Bucket implementation for rate limiting and quota management.
 * Based on API_EXCELLENCE.md patterns.
 *
 * Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 */

export class TokenBucket {
  /**
   * @param {number} capacity - Maximum number of tokens the bucket can hold
   * @param {number} refillRate - Number of tokens added per second
   */
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to consume tokens from the bucket.
   * @param {number} [tokens=1] - Number of tokens to consume
   * @returns {boolean} True if tokens were consumed, false otherwise
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
   * Refill the bucket based on the time elapsed since the last refill.
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get the estimated wait time in milliseconds until sufficient tokens are available.
   * @param {number} [tokensNeeded=1] - Number of tokens needed
   * @returns {number} Wait time in milliseconds
   */
  getWaitTime(tokensNeeded = 1) {
    this.refill();
    if (this.tokens >= tokensNeeded) return 0;

    const deficit = tokensNeeded - this.tokens;
    return (deficit / this.refillRate) * 1000;
  }

  /**
   * Get current token count
   * @returns {number} Current tokens
   */
  getTokens() {
    this.refill();
    return this.tokens;
  }
}
