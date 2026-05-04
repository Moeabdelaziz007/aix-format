import { Redis } from '@upstash/redis';
import type { SetCommandOptions } from '@upstash/redis';

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
  incrby?(key: string, decrement: number): Promise<number>;
  incrBy?(key: string, decrement: number): Promise<number>;
  decrBy?(key: string, decrement: number): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  exists(key: string): Promise<boolean>;
  lpush(key: string, value: any): Promise<number>;
  lrange<T>(key: string, start: number, stop: number): Promise<T[]>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  sadd(key: string, ...members: any[]): Promise<number>;
  srem(key: string, ...members: any[]): Promise<number>;
  smembers<T>(key: string): Promise<T[]>;
  mget<T>(...keys: string[]): Promise<(T | null)[]>;
}

function toSetOptions(options?: StorageOptions): SetCommandOptions | undefined {
  if (!options) return undefined;
  const opts: SetCommandOptions = {} as any;
  if (options.ex !== undefined) (opts as any).ex = options.ex;
  if (options.px !== undefined) (opts as any).px = options.px;
  if (options.nx) return { ...(opts as any), nx: true };
  if (options.xx) return { ...(opts as any), xx: true };
  return opts as SetCommandOptions;
}

class UpstashRedisAdapter implements StorageAdapter {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('[Storage] Missing Upstash Redis credentials. All storage operations will be bypassed.');
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

  private async withRetry<T>(operation: () => Promise<T>, label: string, key: string, retries: number = 2): Promise<T | null> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        this.checkConnection();
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          console.error(`[Storage] ${label} failed permanently for key: ${key.split(':')[0]}:*** | Attempts: ${attempt} | Error:`, (error as Error).message);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    return null;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.withRetry(() => this.client.get<T>(key), 'GET', key);
  }

  async set(key: string, value: unknown, options?: StorageOptions): Promise<void> {
    const upstashOpts = toSetOptions(options);
    const success = await this.withRetry(async () => {
      if (upstashOpts) {
        await this.client.set(key, value, upstashOpts);
      } else {
        await this.client.set(key, value);
      }
      return true;
    }, 'SET', key);

    if (!success) {
      throw new Error(`[Storage] Persistent write failed for ${key.split(':')[0]}:***`);
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

  async incrBy(key: string, increment: number): Promise<number> {
    try {
      this.checkConnection();
      return await this.client.incrby(key, increment);
    } catch (error) {
      console.error(`[Storage] INCRBY failed for ${key}:`, error);
      throw error;
    }
  }

  async decrBy(key: string, decrement: number): Promise<number> {
    try {
      this.checkConnection();
      return await this.client.decrby(key, decrement);
    } catch (error) {
      console.error(`[Storage] DECRBY failed for ${key}:`, error);
      throw error;
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

  async lpush(key: string, value: any): Promise<number> {
    return this.withRetry(() => this.client.lpush(key, value), 'LPUSH', key) as any;
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    return (await this.withRetry(() => this.client.lrange<T>(key, start, stop), 'LRANGE', key)) as T[] || [];
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.withRetry(() => this.client.ltrim(key, start, stop), 'LTRIM', key);
  }

  async sadd(key: string, ...members: any[]): Promise<number> {
    return this.withRetry(() => this.client.sadd(key, members[0], ...members.slice(1)), 'SADD', key) as any;
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    return this.withRetry(() => this.client.srem(key, members[0], ...members.slice(1)), 'SREM', key) as any;
  }

  async smembers<T>(key: string): Promise<T[]> {
    return (await this.withRetry(() => this.client.smembers(key), 'SMEMBERS', key)) as T[] || [];
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    return (await this.withRetry(() => this.client.mget(...keys), 'MGET', keys[0])) as (T | null)[] || keys.map(() => null);
  }
}

export const kv = new UpstashRedisAdapter();
