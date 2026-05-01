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
  ABOM: 'aix:abom',
  MCP: 'aix:mcp:quota',
  METRICS: 'aix:metrics',
  SCAN: 'aix:scan',
  AGENTS: 'agent',
  HEALTH: 'aix:health'
} as const;

/**
 * TTL Strategies (seconds)
 */
export const TTL = {
  SESSIONS: 60 * 60 * 24 * 7,  // 7 Days
  REGISTRY: 0,                // Permanent
  ABOM: 60 * 60 * 24 * 30,    // 30 Days (Cache)
  MCP: 60,                    // 60 Seconds (Rate limiting window)
  METRICS: 60 * 60 * 24 * 90, // 90 Days
  SCAN: 60 * 60 * 24 * 7      // 7 Days
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
  private isConnected: boolean = false;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('[Storage] Missing Upstash Redis credentials. All storage operations will be bypassed.');
      // Initialize with empty strings to avoid crashes, but logic will check isConnected
      this.client = new Redis({ url: 'http://localhost', token: 'mock' });
      this.isConnected = false;
    } else {
      this.client = new Redis({ url, token });
      this.isConnected = true;
    }
  }

  private checkConnection() {
    if (!this.isConnected) {
      throw new Error('[Storage] Connection not initialized. Check environment variables.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      this.checkConnection();
      return await this.client.get<T>(key);
    } catch (error) {
      console.error(`[Storage] GET failed for ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  async set(key: string, value: unknown, options?: StorageOptions): Promise<void> {
    try {
      this.checkConnection();
      const upstashOpts = toSetOptions(options);
      if (upstashOpts) {
        await this.client.set(key, value, upstashOpts);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`[Storage] SET failed for ${key}:`, error);
      // We throw here because failing to save state (like a manifest) is critical
      throw new Error(`[Storage] Persistent write failed for ${key}`);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      this.checkConnection();
      await this.client.del(...(Array.isArray(key) ? key : [key]));
    } catch (error) {
      console.error(`[Storage] DEL failed for ${key}:`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      this.checkConnection();
      return await this.client.incr(key);
    } catch (error) {
      console.error(`[Storage] INCR failed for ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      this.checkConnection();
      return await this.client.decr(key);
    } catch (error) {
      console.error(`[Storage] DECR failed for ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      this.checkConnection();
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`[Storage] EXPIRE failed for ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      this.checkConnection();
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
