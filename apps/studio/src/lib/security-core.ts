import crypto from 'crypto';
import { z } from 'zod';

/**
 * Security-First Core Module
 * RULE 0: Security precedes everything
 * RULE 2: crypto.randomBytes only, never Math.random
 * 
 * Made with Moe Abdelaziz
 */

// ============================================
// SECURE ID GENERATION
// ============================================

/**
 * Generate cryptographically secure random ID
 * Replaces ALL Math.random() usage in payment/security code
 */
export function secureId(prefix: string = '', length: number = 16): string {
  const randomBytes = crypto.randomBytes(length);
  const id = randomBytes.toString('hex');
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate secure payment ID
 * CRITICAL: Used in payment routes
 */
export function securePaymentId(): string {
  return secureId('pay', 24);
}

/**
 * Generate secure transaction hash
 * CRITICAL: Used in TrustChain
 */
export function secureTransactionHash(): string {
  return `0x${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Generate secure job ID
 * Used in queue system
 */
export function secureJobId(): string {
  return secureId('job', 16);
}

/**
 * Generate secure session ID
 */
export function secureSessionId(): string {
  return secureId('sess', 20);
}

// ============================================
// TRUST CHAIN
// ============================================

export interface TrustChainEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: string; // DID
  payload: Record<string, any>;
  previousHash: string;
  hash: string;
  signature?: string;
}

class TrustChainManager {
  private chain: TrustChainEntry[] = [];
  private lastHash: string = '0x0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Append action to TrustChain
   * RULE 3: Every action must be logged
   */
  append(action: string, actor: string, payload: Record<string, any>): TrustChainEntry {
    const entry: TrustChainEntry = {
      id: secureId('trust', 16),
      timestamp: Date.now(),
      action,
      actor,
      payload,
      previousHash: this.lastHash,
      hash: '', // Will be computed
    };

    // Compute hash
    entry.hash = this.computeHash(entry);
    this.lastHash = entry.hash;
    
    // Store entry
    this.chain.push(entry);

    // TODO: Persist to Redis/Database
    console.log(`[TrustChain] ${action} by ${actor}`);

    return entry;
  }

  /**
   * Compute SHA-256 hash of entry
   */
  private computeHash(entry: Omit<TrustChainEntry, 'hash'>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      payload: entry.payload,
      previousHash: entry.previousHash,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify chain integrity
   */
  verify(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check if previousHash matches
      if (current.previousHash !== previous.hash) {
        console.error(`[TrustChain] Integrity violation at index ${i}`);
        return false;
      }

      // Recompute hash and verify
      const recomputedHash = this.computeHash(current);
      if (current.hash !== recomputedHash) {
        console.error(`[TrustChain] Hash mismatch at index ${i}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Get full chain
   */
  getChain(): TrustChainEntry[] {
    return [...this.chain];
  }

  /**
   * Get entries by actor (DID)
   */
  getByActor(actor: string): TrustChainEntry[] {
    return this.chain.filter(entry => entry.actor === actor);
  }
}

// Singleton instance
export const TrustChain = new TrustChainManager();

// ============================================
// CIRCUIT BREAKER
// ============================================

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreakerImpl {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitorInterval: 10000, // 10 seconds
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   * RULE 8: Protect each LLM provider independently
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`[CircuitBreaker:${this.name}] Attempting HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] CLOSED`);
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.error(`[CircuitBreaker:${this.name}] OPEN after ${this.failureCount} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Circuit breakers for different providers
export const CircuitBreakers = {
  openai: new CircuitBreakerImpl('OpenAI'),
  anthropic: new CircuitBreakerImpl('Anthropic'),
  gemini: new CircuitBreakerImpl('Gemini'),
  redis: new CircuitBreakerImpl('Redis'),
  database: new CircuitBreakerImpl('Database'),
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate input with Zod schema
 * RULE 1: All inputs must be validated
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Safety score calculator
 * RULE 5: safetyScore < 7.0 → abort
 */
export function calculateSafetyScore(metrics: {
  hasValidation: boolean;
  hasAuth: boolean;
  hasRateLimit: boolean;
  hasCircuitBreaker: boolean;
  hasTrustChain: boolean;
}): number {
  let score = 0;
  if (metrics.hasValidation) score += 2;
  if (metrics.hasAuth) score += 2;
  if (metrics.hasRateLimit) score += 2;
  if (metrics.hasCircuitBreaker) score += 1.5;
  if (metrics.hasTrustChain) score += 2.5;
  return score;
}

// Made with Moe Abdelaziz

// Made with Bob
