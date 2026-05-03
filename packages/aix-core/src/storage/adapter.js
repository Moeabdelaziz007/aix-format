import { Redis } from '@upstash/redis';
function toSetOptions(options) {
    if (!options)
        return undefined;
    const opts = {};
    if (options.ex !== undefined)
        opts.ex = options.ex;
    if (options.px !== undefined)
        opts.px = options.px;
    if (options.nx)
        return { ...opts, nx: true };
    if (options.xx)
        return { ...opts, xx: true };
    return opts;
}
class UpstashRedisAdapter {
    constructor() {
        this.isConnected = false;
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (!url || !token) {
            this.client = new Redis({ url: 'http://localhost', token: 'mock' });
            this.isConnected = false;
        }
        else {
            this.client = new Redis({ url, token });
            this.isConnected = true;
        }
    }
    checkConnection() {
        if (!this.isConnected) {
            throw new Error('[Storage] Connection not initialized. Check environment variables.');
        }
    }
    async withRetry(operation, label, key, retries = 2) {
        let attempt = 0;
        while (attempt <= retries) {
            try {
                this.checkConnection();
                return await operation();
            }
            catch (error) {
                attempt++;
                if (attempt > retries) {
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            }
        }
        return null;
    }
    async get(key) {
        return this.withRetry(() => this.client.get(key), 'GET', key);
    }
    async set(key, value, options) {
        const upstashOpts = toSetOptions(options);
        const success = await this.withRetry(async () => {
            if (upstashOpts) {
                await this.client.set(key, value, upstashOpts);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }, 'SET', key);
        if (!success) {
            throw new Error(`[Storage] Persistent write failed for ${key.split(':')[0]}:***`);
        }
    }
    async del(key) {
        try {
            this.checkConnection();
            await this.client.del(...(Array.isArray(key) ? key : [key]));
        }
        catch (error) {
        }
    }
    async incr(key) {
        try {
            this.checkConnection();
            return await this.client.incr(key);
        }
        catch (error) {
            throw error;
        }
    }
    async decr(key) {
        try {
            this.checkConnection();
            return await this.client.decr(key);
        }
        catch (error) {
            throw error;
        }
    }
    async expire(key, seconds) {
        try {
            this.checkConnection();
            await this.client.expire(key, seconds);
        }
        catch (error) {
        }
    }
    async exists(key) {
        try {
            this.checkConnection();
            const count = await this.client.exists(key);
            return count > 0;
        }
        catch (error) {
            return false;
        }
    }
    async lpush(key, value) {
        return this.withRetry(() => this.client.lpush(key, value), 'LPUSH', key);
    }
    async lrange(key, start, stop) {
        return (await this.withRetry(() => this.client.lrange(key, start, stop), 'LRANGE', key)) || [];
    }
    async ltrim(key, start, stop) {
        await this.withRetry(() => this.client.ltrim(key, start, stop), 'LTRIM', key);
    }
    async sadd(key, ...members) {
        return this.withRetry(() => this.client.sadd(key, ...members), 'SADD', key);
    }
    async srem(key, ...members) {
        return this.withRetry(() => this.client.srem(key, ...members), 'SREM', key);
    }
    async smembers(key) {
        return (await this.withRetry(() => this.client.smembers(key), 'SMEMBERS', key)) || [];
    }
    async mget(...keys) {
        if (keys.length === 0)
            return [];
        return (await this.withRetry(() => this.client.mget(...keys), 'MGET', keys[0])) || keys.map(() => null);
    }
}
export const kv = new UpstashRedisAdapter();
