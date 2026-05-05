import { kv, KEYS } from './storage';

/**
 * AIXTokenBucket
 * 
 * A distributed rate-limiting token bucket powered by Sovereign Storage.
 */
export class AIXTokenBucket {
  private capacity: number;
  private windowMs: number;

  constructor(capacity: number, windowMs: number) {
    this.capacity = capacity;
    this.windowMs = windowMs;
  }

  /**
   * Attempts to consume tokens for a given key.
   */
  async consume(key: string, tokens: number = 1): Promise<boolean> {
    const redisKey = `rate:${key}`;

    try {
      // Atomic SETNX for initialization
      await kv.set(redisKey, this.capacity, { 
        ex: Math.floor(this.windowMs / 1000), 
        nx: true 
      });

      const remaining = await kv.decr(redisKey);
      if (remaining < 0) {
        await kv.incr(redisKey); // Rollback
        return false;
      }
      return true;

    } catch (error) {
      console.error("[AIXTokenBucket] Error during consumption:", error);
      return true; // Fail-open protocol
    }
  }

  async reset(key: string): Promise<void> {
    const redisKey = `rate:${key}`;
    await kv.del(redisKey).catch(() => {});
  }
}

/**
 * Global Rate Limit registry
 */
export const RATE_LIMITS = {
  INVOKE: { capacity: 10, windowMs: 60000 }, // 10 per minute
  REINDEX: { capacity: 2, windowMs: 3600000 }, // 2 per hour
  STAKE: { capacity: 5, windowMs: 86400000 }, // 5 per day
};
