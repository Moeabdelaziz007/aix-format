export interface StorageOptions {
    ex?: number;
    px?: number;
    nx?: boolean;
    xx?: boolean;
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
declare class UpstashRedisAdapter implements StorageAdapter {
    private client;
    private isConnected;
    constructor();
    private checkConnection;
    private withRetry;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: StorageOptions): Promise<void>;
    del(key: string | string[]): Promise<void>;
    incrBy(key: string, increment: number): Promise<number>;
    decrBy(key: string, decrement: number): Promise<number>;
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
export declare const kv: UpstashRedisAdapter;
export {};
