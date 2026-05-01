/**
 * AIX Unified Storage Adapter
 * Standardizes access to Upstash Redis across core and apps.
 */

export interface StorageOptions {
  ex?: number; // Expiry in seconds
  px?: number; // Expiry in milliseconds
  nx?: boolean; // Only set if not exists
  xx?: boolean; // Only set if exists
}

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, options?: StorageOptions): Promise<void>;
  del(key: string | string[]): Promise<void>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Key Namespaces to prevent collisions in shared Redis instance.
 */
export const NS = {
  SESSIONS: 'aix:sessions',
  REGISTRY: 'aix:registry',
  SCAN: 'aix:scan',
  MCP: 'aix:mcp',
  METRICS: 'aix:metrics',
} as const;

/**
 * TTL Strategies (seconds)
 */
export const TTL = {
  SESSION: 3600 * 24,  // 24 hours
  ABOM_CACHE: 3600 * 48, // 48 hours
  QUOTA_WINDOW: 60,     // 1 minute
  LONG_LIVED: 3600 * 24 * 30, // 30 days
} as const;

/** Map our generic StorageOptions → Upstash SetCommandOptions */
import type { SetCommandOptions } from '@upstash/redis';

function toSetOptions(options?: StorageOptions): SetCommandOptions | undefined {
  if (!options) return undefined;
  const opts: SetCommandOptions = {} as any;
  if (options.ex !== undefined) (opts as any).ex = options.ex;
  if (options.px !== undefined) (opts as any).px = options.px;
  if (options.nx) return { ...(opts as any), nx: true };
  if (options.xx) return { ...(opts as any), xx: true };
  return opts as SetCommandOptions;
}

import { Redis } from '@upstash/redis';

class UpstashRedisAdapter implements StorageAdapter {
  private client: Redis;

  constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('[Storage] Missing Upstash Redis credentials. Storage operations will fail.');
    }

    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (error) {
      console.error(`[Storage] GET failed for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, options?: StorageOptions): Promise<void> {
    try {
      const upstashOpts = toSetOptions(options);
      if (upstashOpts) {
        await this.client.set(key, value, upstashOpts);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`[Storage] SET failed for ${key}:`, error);
      throw error;
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      await this.client.del(...(Array.isArray(key) ? key : [key]));
    } catch (error) {
      console.error(`[Storage] DEL failed for ${key}:`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`[Storage] INCR failed for ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error(`[Storage] DECR failed for ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`[Storage] EXPIRE failed for ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch (error) {
      console.error(`[Storage] EXISTS failed for ${key}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const kv = new UpstashRedisAdapter();
export default kv;
