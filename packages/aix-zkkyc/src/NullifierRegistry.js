export class ProofReplayError extends Error {
    constructor(message, code = 'ZK_REPLAY_001') {
        super(message);
        this.name = 'ProofReplayError';
        this.code = code;
    }
}
export class NullifierRegistry {
    constructor(ttlMs = 30 * 24 * 60 * 60 * 1000) {
        this.store = new Map();
        this.ttlMs = ttlMs;
        this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        // Run prune interval every 1 hour
        this.intervalId = setInterval(() => this.pruneExpired(), 60 * 60 * 1000);
        // Ensure the interval doesn't prevent the process from exiting
        if (this.intervalId.unref) {
            this.intervalId.unref();
        }
    }
    async isNullified(proofHash) {
        // 1. Check in-memory store
        const record = this.store.get(proofHash);
        if (record) {
            if (Date.now() > record.expiresAt) {
                this.store.delete(proofHash);
                // We'll let the Redis check proceed or just return false
                // But it's safer to check Redis if memory expired.
            }
            else {
                return true;
            }
        }
        // 2. Check Redis if configured
        if (this.redisUrl && this.redisToken) {
            try {
                const response = await fetch(`${this.redisUrl}/get/zkkyc:null:${proofHash}`, {
                    headers: {
                        Authorization: `Bearer ${this.redisToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.result) {
                        return true;
                    }
                }
            }
            catch (error) {
                console.error('[ZK-KYC] Redis fetch failed during isNullified check:', error);
                // Failover to in-memory: it returned false above.
            }
        }
        return false;
    }
    async registerNullifier(proofHash, agentId, timestamp) {
        const expiresAt = timestamp + this.ttlMs;
        // 1. Save in-memory
        this.store.set(proofHash, { agentId, timestamp, expiresAt });
        // 2. Save to Redis
        if (this.redisUrl && this.redisToken) {
            try {
                const ttlSeconds = Math.floor(this.ttlMs / 1000);
                const payload = JSON.stringify({ agentId, timestamp, expiresAt });
                // Use Upstash REST API set with EX (expiry in seconds)
                const response = await fetch(`${this.redisUrl}/set/zkkyc:null:${proofHash}?EX=${ttlSeconds}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.redisToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: payload
                });
                if (!response.ok) {
                    throw new Error(`Failed to save to Redis: ${response.statusText}`);
                }
            }
            catch (error) {
                console.error('[ZK-KYC] Redis save failed during registerNullifier:', error);
                // Silent failover to in-memory which already happened
            }
        }
    }
    pruneExpired() {
        const now = Date.now();
        for (const [hash, record] of this.store.entries()) {
            if (now > record.expiresAt) {
                this.store.delete(hash);
            }
        }
    }
    dispose() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
