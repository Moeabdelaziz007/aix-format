/**
 * AIXTokenBucket
 *
 * A distributed rate-limiting token bucket.
 * Powered by Upstash Redis (Unified Storage).
 */
export declare class AIXTokenBucket {
    private capacity;
    private windowMs;
    constructor(capacity: number, windowMs: number);
    /**
     * Attempts to consume tokens for a given key.
     * Requires Upstash Redis for distributed state.
     */
    consume(key: string, tokens?: number): Promise<boolean>;
    reset(key: string): Promise<void>;
}
export { AIXTokenBucket as KVTokenBucket };
