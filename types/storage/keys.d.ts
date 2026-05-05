/**
 * KEYS Registry - Centralized Redis/Storage Key Management
 * Single source of truth for all storage key patterns
 */
/**
 * Namespace prefixes for different data types
 */
export declare const NS: {
    readonly AGENT: "agent:";
    readonly AIX: "aix:";
    readonly SESSION: "session:";
    readonly CACHE: "cache:";
    readonly TRUST: "trust:";
    readonly LINEAGE: "lineage:";
    readonly METRICS: "metrics:";
    readonly PAYMENT: "payment:";
    readonly EXECUTION: "execution:";
    readonly BUS: "bus:";
    readonly RATE: "rate:";
    readonly HINTS: "hints:";
    readonly GRAPH: "graph:";
    readonly TIER1: "tier1:";
};
/**
 * Key generation functions
 * All storage keys MUST be generated through these functions
 */
export declare const KEYS: {
    readonly agent: (id: string) => string;
    readonly agentConfig: (id: string) => string;
    readonly agentState: (id: string) => string;
    readonly agentMetrics: (id: string) => string;
    readonly agentExplorationHistory: (id: string) => string;
    readonly agentExplorations: (id: string) => string;
    readonly agentCuriosityScore: (id: string) => string;
    readonly agentSkillCombos: (id: string) => string;
    readonly agentSkillCombo: (id: string, hash: string) => string;
    readonly agentActionCount: (id: string, action: string) => string;
    readonly agentSelfReview: (id: string, taskId: string) => string;
    readonly agentSelfReviewHistory: (id: string) => string;
    readonly agentFailurePatterns: (id: string) => string;
    readonly agentCurrentMode: (id: string) => string;
    readonly agentExplorationRate: (id: string) => string;
    readonly aix: (key: string) => string;
    readonly aixManifest: (agentId: string) => string;
    readonly aixSkills: (agentId: string) => string;
    readonly session: (userId: string) => string;
    readonly sessionToken: (token: string) => string;
    readonly cache: (key: string) => string;
    readonly cacheAgent: (agentId: string) => string;
    readonly cacheQuery: (query: string) => string;
    readonly trust: (agentId: string) => string;
    readonly trustSignature: (agentId: string) => string;
    readonly trustPoW: (agentId: string) => string;
    readonly lineage: (agentId: string) => string;
    readonly lineageParent: (agentId: string) => string;
    readonly lineageChildren: (agentId: string) => string;
    readonly metrics: (metric: string) => string;
    readonly metricsAgent: (agentId: string) => string;
    readonly metricsGlobal: () => string;
    readonly payment: (txId: string) => string;
    readonly paymentAgent: (agentId: string) => string;
    readonly paymentEscrow: (agentId: string) => string;
    readonly execution: (executionId: string) => string;
    readonly executionAgent: (agentId: string) => string;
    readonly executionQueue: () => string;
    readonly bus: (ring: string, event: string) => string;
    readonly busQueue: (ring: string) => string;
    readonly busBacklog: () => string;
    readonly rate: (key: string) => string;
    readonly rateLimit: (identifier: string) => string;
    readonly fileHint: (filePath: string) => string;
    readonly dependencyNode: (nodeId: string) => string;
    readonly structuralMap: (scope: string) => string;
    readonly constitution: () => string;
    readonly specializedKnowledge: (agentRole: string) => string;
};
/**
 * Key pattern validation
 * Ensures all keys follow the correct format
 */
export declare function validateKey(key: string): boolean;
/**
 * Extract namespace from key
 */
export declare function getNamespace(key: string): string | null;
/**
 * Key expiration times (in seconds)
 */
export declare const TTL: {
    readonly SESSION: 86400;
    readonly CACHE: 3600;
    readonly CACHE_LONG: 86400;
    readonly METRICS: 604800;
    readonly EXECUTION: 3600;
    readonly BUS_EVENT: 300;
};
/**
 * Batch key operations
 */
export declare const BATCH: {
    /**
     * Generate all agent-related keys
     */
    readonly agentKeys: (agentId: string) => {
        agent: string;
        config: string;
        state: string;
        metrics: string;
        trust: string;
        lineage: string;
        payment: string;
    };
    /**
     * Generate all trust-related keys
     */
    readonly trustKeys: (agentId: string) => {
        trust: string;
        signature: string;
        pow: string;
        lineage: string;
    };
    /**
     * Generate all execution-related keys
     */
    readonly executionKeys: (executionId: string, agentId: string) => {
        execution: string;
        agent: string;
        queue: string;
    };
};
/**
 * Key pattern matching
 */
export declare const PATTERNS: {
    readonly allAgents: () => string;
    readonly allSessions: () => string;
    readonly allCache: () => string;
    readonly allMetrics: () => string;
    readonly agentsByPrefix: (prefix: string) => string;
};
/**
 * Type-safe key builder
 */
export declare class KeyBuilder {
    private namespace;
    private parts;
    constructor(namespace: string);
    add(part: string): this;
    build(): string;
    static agent(id: string): KeyBuilder;
    static cache(key: string): KeyBuilder;
    static metrics(metric: string): KeyBuilder;
}
/**
 * Usage examples:
 *
 * // Simple key generation
 * const agentKey = KEYS.agent('agent-123');
 * const cacheKey = KEYS.cache('user-data');
 *
 * // Batch operations
 * const allAgentKeys = BATCH.agentKeys('agent-123');
 * await redis.mget(Object.values(allAgentKeys));
 *
 * // Pattern matching
 * const allAgents = await redis.keys(PATTERNS.allAgents());
 *
 * // Type-safe builder
 * const customKey = KeyBuilder.agent('agent-123')
 *   .add('custom')
 *   .add('data')
 *   .build(); // 'agent:agent-123:custom:data'
 *
 * // Validation
 * if (validateKey(someKey)) {
 *   const namespace = getNamespace(someKey);
 *   console.log(`Key belongs to ${namespace} namespace`);
 * }
 */
