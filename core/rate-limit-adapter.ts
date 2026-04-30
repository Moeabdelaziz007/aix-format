import { kv as upstashKv, NS } from './storage/redis.ts';

/**
 * AIXTokenBucket
 * 
 * A distributed rate-limiting token bucket.
 * Powered by Upstash Redis (Unified Storage).
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
   * Requires Upstash Redis for distributed state.
   */
  async consume(key: string, tokens: number = 1): Promise<boolean> {
    const upstashKey = `${NS.RATE}:${key}`;

    try {
      // Atomic SETNX for initialization
      await upstashKv.set(upstashKey, this.capacity, { 
        ex: Math.floor(this.windowMs / 1000), 
        nx: true 
      });

      const remaining = await upstashKv.decr(upstashKey);
      if (remaining < 0) {
        await upstashKv.incr(upstashKey); // Rollback
        return false;
      }
      return true;

    } catch (error) {
      console.error("[AIXTokenBucket] Error during consumption:", error);
      return true; // Fail-open protocol
    }
  }

  async reset(key: string): Promise<void> {
    const upstashKey = `${NS.RATE}:${key}`;
    await upstashKv.del(upstashKey).catch(() => {});
  }
}

// Keep export for backward compatibility
export { AIXTokenBucket as KVTokenBucket };


