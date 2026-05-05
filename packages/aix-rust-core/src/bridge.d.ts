/**
 * TypeScript Integration Bridge for Rust Core (Gem 1 - Batching)
 *
 * Provides high-level TypeScript API with automatic batching and serialization.
 */
import type { BusEvent, Skill, RustCore } from '../index';
declare const rustCore: RustCore;
export declare class RustEventStore {
    private batch;
    private batchSize;
    private flushTimer;
    private flushInterval;
    constructor(batchSize?: number, flushIntervalMs?: number);
    /**
     * Publish event with automatic batching (Gem 1)
     * Events are accumulated and flushed in batches for 1000x performance
     */
    publish(event: BusEvent): Promise<void>;
    /**
     * Manually flush pending events
     */
    flush(): Promise<void>;
    /**
     * Query events by agent ID
     */
    query(agentId: string, pattern?: string): Promise<BusEvent[]>;
    /**
     * Query events by type
     */
    queryByType(eventType: string): Promise<BusEvent[]>;
    /**
     * Get total event count
     */
    count(): Promise<number>;
    /**
     * Cleanup - flush pending events
     */
    destroy(): Promise<void>;
}
export declare class RustSkillCache {
    private embeddingDim;
    constructor(embeddingDim?: number);
    /**
     * Add skill to cache
     */
    addSkill(skill: Skill): Promise<void>;
    /**
     * SIMD semantic search (Gem 2 - 5x faster)
     * Returns skill IDs sorted by similarity
     */
    search(queryEmbedding: number[], limit?: number): Promise<string[]>;
    /**
     * Get skill by ID
     */
    getSkill(skillId: string): Promise<Skill | null>;
    /**
     * Update skill statistics after execution
     */
    updateStats(skillId: string, success: boolean, durationMs: number): Promise<void>;
    /**
     * Execute skill with automatic stats tracking
     */
    executeSkill<T, R>(skillId: string, executor: (skill: Skill, input: T) => Promise<R>, input: T): Promise<R>;
}
export declare class RustTrustChain {
    /**
     * Register new agent
     * Returns public key as hex string
     */
    registerAgent(agentId: string): Promise<string>;
    /**
     * Add trust transaction
     * Returns transaction hash
     */
    addTransaction(agentId: string, delta: number, reason: string, taskHash: string): Promise<string>;
    /**
     * Verify single agent's chain
     */
    verifyChain(agentId: string): Promise<boolean>;
    /**
     * Batch verify multiple chains (Gem 2 - 10x faster)
     */
    verifyBatch(agentIds: string[]): Promise<Map<string, boolean>>;
    /**
     * Get agent's trust score
     */
    getTrustScore(agentId: string): Promise<number | null>;
    /**
     * Reward agent for good behavior
     */
    reward(agentId: string, amount: number, reason: string, taskHash: string): Promise<string>;
    /**
     * Penalize agent for bad behavior
     */
    penalize(agentId: string, amount: number, reason: string, taskHash: string): Promise<string>;
}
export declare class RustBridge {
    readonly eventStore: RustEventStore;
    readonly skillCache: RustSkillCache;
    readonly trustChain: RustTrustChain;
    constructor(config?: {
        eventBatchSize?: number;
        eventFlushInterval?: number;
        embeddingDim?: number;
    });
    /**
     * Cleanup all resources
     */
    destroy(): Promise<void>;
}
/**
 * Get singleton bridge instance
 */
export declare function getRustBridge(config?: {
    eventBatchSize?: number;
    eventFlushInterval?: number;
    embeddingDim?: number;
}): RustBridge;
/**
 * Destroy singleton instance
 */
export declare function destroyRustBridge(): Promise<void>;
export { rustCore };
export default RustBridge;
//# sourceMappingURL=bridge.d.ts.map