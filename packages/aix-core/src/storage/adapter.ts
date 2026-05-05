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

class LocalFileAdapter implements StorageAdapter {
  private baseDir = '/Users/cryptojoker710/Desktop/aix-format/.storage';
  private fs: any;
  private path: any;

  constructor() {
    this.fs = require('fs');
    this.path = require('path');
    if (!this.fs.existsSync(this.baseDir)) {
      this.fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getPath(key: string) {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return this.path.join(this.baseDir, `${safeKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const p = this.getPath(key);
    if (!this.fs.existsSync(p)) return null;
    try {
      return JSON.parse(this.fs.readFileSync(p, 'utf8'));
    } catch { return null; }
  }

  async set(key: string, value: any): Promise<void> {
    this.fs.writeFileSync(this.getPath(key), JSON.stringify(value), 'utf8');
  }

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => {
      const p = this.getPath(k);
      if (this.fs.existsSync(p)) this.fs.unlinkSync(p);
    });
  }

  async incr(key: string): Promise<number> {
    const val = (await this.get<number>(key) || 0) + 1;
    await this.set(key, val);
    return val;
  }

  async decr(key: string): Promise<number> {
    const val = (await this.get<number>(key) || 0) - 1;
    await this.set(key, val);
    return val;
  }

  async expire() {}
  async exists(key: string) { return this.fs.existsSync(this.getPath(key)); }
  async lpush(key: string, value: any) {
    const list = await this.get<any[]>(key) || [];
    list.unshift(value);
    await this.set(key, list);
    return list.length;
  }
  async lrange<T>(key: string, start: number, stop: number) {
    const list = await this.get<T[]>(key) || [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
  async ltrim(key: string, start: number, stop: number) {
    const list = await this.get<any[]>(key) || [];
    await this.set(key, list.slice(start, stop === -1 ? undefined : stop + 1));
  }
  async sadd(key: string, ...members: any[]) {
    const set = new Set(await this.get<any[]>(key) || []);
    members.forEach(m => set.add(m));
    await this.set(key, Array.from(set));
    return set.size;
  }
  async srem(key: string, ...members: any[]) {
    const set = new Set(await this.get<any[]>(key) || []);
    members.forEach(m => set.delete(m));
    await this.set(key, Array.from(set));
    return set.size;
  }
  async smembers<T>(key: string) { return await this.get<T[]>(key) || []; }
  async mget<T>(...keys: string[]) { return Promise.all(keys.map(k => this.get<T>(k))); }
}

class StorageOrchestrator implements StorageAdapter {
  private redis: UpstashRedisAdapter;
  private local: LocalFileAdapter;

  constructor() {
    this.redis = new UpstashRedisAdapter();
    this.local = new LocalFileAdapter();
  }

  private get active(): StorageAdapter {
    // @ts-ignore
    return this.redis.isConnected ? this.redis : this.local;
  }

  get<T>(key: string) { return this.active.get<T>(key); }
  set(key: string, value: any, options?: StorageOptions) { return this.active.set(key, value, options); }
  del(key: string | string[]) { return this.active.del(key); }
  incr(key: string) { return this.active.incr(key); }
  decr(key: string) { return this.active.decr(key); }
  expire(key: string, seconds: number) { return this.active.expire(key, seconds); }
  exists(key: string) { return this.active.exists(key); }
  lpush(key: string, value: any) { return this.active.lpush(key, value); }
  lrange<T>(key: string, start: number, stop: number) { return this.active.lrange<T>(key, start, stop); }
  ltrim(key: string, start: number, stop: number) { return this.active.ltrim(key, start, stop); }
  sadd(key: string, ...members: any[]) { return this.active.sadd(key, ...members); }
  srem(key: string, ...members: any[]) { return this.active.srem(key, ...members); }
  smembers<T>(key: string) { return this.active.smembers<T>(key); }
  mget<T>(...keys: string[]) { return this.active.mget<T>(...keys); }
}

export const kv = new StorageOrchestrator();
