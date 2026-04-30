import { kv as vercelKv } from '@vercel/kv';
import { kv as upstashKv, NS } from './storage/redis.ts';

/**
 * AIXTokenBucket
 * 
 * A distributed rate-limiting token bucket.
 * Migrated from @vercel/kv to @upstash/redis (Unified Storage).
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
   * Prefers Upstash Redis, falls back to Vercel KV if available.
   */
  async consume(key: string, tokens: number = 1): Promise<boolean> {
    const upstashKey = `${NS.RATE}:${key}`;
    const legacyKey = `aix:bucket:${key}`;

    try {
      // 1. Try Upstash Redis first
      if (process.env.UPSTASH_REDIS_REST_URL) {
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
      }

      // 2. Fallback to Legacy Vercel KV during migration
      console.warn("[AIXTokenBucket] Falling back to Legacy Vercel KV");
      await vercelKv.set(legacyKey, this.capacity, { ex: Math.floor(this.windowMs / 1000), nx: true });
      const legacyRemaining = await vercelKv.decrby(legacyKey, tokens);
      if (legacyRemaining < 0) {
        await vercelKv.incrby(legacyKey, tokens);
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
    const legacyKey = `aix:bucket:${key}`;
    
    await Promise.all([
      upstashKv.del(upstashKey),
      vercelKv.del(legacyKey)
    ]).catch(() => {});
  }
}

// Keep export for backward compatibility during transition
export { AIXTokenBucket as KVTokenBucket };


