/**
 * KEYS Registry V2 - Self-Documenting, Type-Safe Storage Key Management
 * Features:
 * - Auto-generated key functions from namespace definitions
 * - Runtime validation with detailed error messages
 * - Pattern matching utilities
 * - Batch operations
 * - Migration helpers
 */
/**
 * Namespace definitions with metadata
 */
export declare const NS_METADATA: {
    readonly AGENT: {
        readonly prefix: "agent:";
        readonly description: "Agent state and configuration";
    };
    readonly AIX: {
        readonly prefix: "aix:";
        readonly description: "AIX format manifests and skills";
    };
    readonly SESSION: {
        readonly prefix: "session:";
        readonly description: "User session data";
    };
    readonly CACHE: {
        readonly prefix: "cache:";
        readonly description: "Temporary cached data";
    };
    readonly TRUST: {
        readonly prefix: "trust:";
        readonly description: "Trust chain and signatures";
    };
    readonly LINEAGE: {
        readonly prefix: "lineage:";
        readonly description: "Agent lineage and genealogy";
    };
    readonly METRICS: {
        readonly prefix: "metrics:";
        readonly description: "Performance and usage metrics";
    };
    readonly PAYMENT: {
        readonly prefix: "payment:";
        readonly description: "Payment transactions and escrow";
    };
    readonly EXECUTION: {
        readonly prefix: "execution:";
        readonly description: "Task execution state";
    };
    readonly BUS: {
        readonly prefix: "bus:";
        readonly description: "Event bus messages";
    };
    readonly RATE: {
        readonly prefix: "rate:";
        readonly description: "Rate limiting buckets";
    };
};
export declare const NS: Record<keyof typeof NS_METADATA, string>;
/**
 * Key builder with fluent API and validation
 */
export declare class KeyBuilder {
    private parts;
    private namespace;
    constructor(namespace: string);
    add(part: string | number): this;
    build(): string;
    static agent(id: string): KeyBuilder;
    static cache(key: string): KeyBuilder;
    static metrics(metric: string): KeyBuilder;
    static rate(key: string): KeyBuilder;
}
/**
 * Auto-generated key functions with type safety
 */
export declare const KEYS: {
    readonly agent: (id: string) => string;
    readonly agentConfig: (id: string) => string;
    readonly agentState: (id: string) => string;
    readonly agentMetrics: (id: string) => string;
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
    readonly rateWindow: (identifier: string) => string;
    readonly rateBucket: (identifier: string) => string;
};
/**
 * Enhanced validation with detailed error messages
 */
export declare function validateKey(key: string): {
    valid: boolean;
    error?: string;
    namespace?: string;
};
/**
 * Extract namespace from key
 */
export declare function getNamespace(key: string): string | null;
/**
 * Get namespace metadata
 */
export declare function getNamespaceInfo(key: string): typeof NS_METADATA[keyof typeof NS_METADATA] | null;
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
    readonly RATE_LIMIT: 60;
};
/**
 * Batch key operations
 */
export declare const BATCH: {
    readonly agentKeys: (agentId: string) => {
        agent: string;
        config: string;
        state: string;
        metrics: string;
        trust: string;
        lineage: string;
        payment: string;
    };
    readonly trustKeys: (agentId: string) => {
        trust: string;
        signature: string;
        pow: string;
        lineage: string;
    };
    readonly executionKeys: (executionId: string, agentId: string) => {
        execution: string;
        agent: string;
        queue: string;
    };
    readonly rateLimitKeys: (identifier: string) => {
        rate: string;
        limit: string;
        window: string;
        bucket: string;
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
    readonly allRateLimits: () => string;
    readonly agentsByPrefix: (prefix: string) => string;
    readonly byNamespace: (namespace: keyof typeof NS) => string;
};
/**
 * Migration helper: convert old keys to new format
 */
export declare function migrateKey(oldKey: string): string | null;
/**
 * Debug helper: analyze key structure
 */
export declare function analyzeKey(key: string): {
    valid: boolean;
    namespace?: string;
    description?: string;
    parts: string[];
    ttlSuggestion?: number;
};
