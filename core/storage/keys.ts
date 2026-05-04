/**
 * KEYS Registry - Centralized Redis/Storage Key Management
 * Single source of truth for all storage key patterns
 */

/**
 * Namespace prefixes for different data types
 */
export const NS = {
  AGENT: 'agent:',
  AIX: 'aix:',
  SESSION: 'session:',
  CACHE: 'cache:',
  TRUST: 'trust:',
  LINEAGE: 'lineage:',
  METRICS: 'metrics:',
  PAYMENT: 'payment:',
  EXECUTION: 'execution:',
  BUS: 'bus:',
  RATE: 'rate:',
} as const;

/**
 * Key generation functions
 * All storage keys MUST be generated through these functions
 */
export const KEYS = {
  // Agent keys
  agent: (id: string) => `${NS.AGENT}${id}`,
  agentConfig: (id: string) => `${NS.AGENT}${id}:config`,
  agentState: (id: string) => `${NS.AGENT}${id}:state`,
  agentMetrics: (id: string) => `${NS.AGENT}${id}:metrics`,
  
  // Agent curiosity/exploration keys
  agentExplorationHistory: (id: string) => `${NS.AGENT}${id}:exploration_history`,
  agentExplorations: (id: string) => `${NS.AGENT}${id}:explorations`,
  agentCuriosityScore: (id: string) => `${NS.AGENT}${id}:curiosity_score`,
  agentSkillCombos: (id: string) => `${NS.AGENT}${id}:skill_combos`,
  agentSkillCombo: (id: string, hash: string) => `${NS.AGENT}${id}:skill_combo:${hash}`,
  agentActionCount: (id: string, action: string) => `${NS.AGENT}${id}:action_count:${action}`,
  
  // Agent meta-loop self-review keys
  agentSelfReview: (id: string, taskId: string) => `${NS.AGENT}${id}:self_review:${taskId}`,
  agentSelfReviewHistory: (id: string) => `${NS.AGENT}${id}:self_review_history`,
  agentFailurePatterns: (id: string) => `${NS.AGENT}${id}:failure_patterns`,
  agentCurrentMode: (id: string) => `${NS.AGENT}${id}:current_mode`,
  agentExplorationRate: (id: string) => `${NS.AGENT}${id}:exploration_rate`,
  
  // AIX format keys
  aix: (key: string) => `${NS.AIX}${key}`,
  aixManifest: (agentId: string) => `${NS.AIX}manifest:${agentId}`,
  aixSkills: (agentId: string) => `${NS.AIX}skills:${agentId}`,
  
  // Session keys
  session: (userId: string) => `${NS.SESSION}${userId}`,
  sessionToken: (token: string) => `${NS.SESSION}token:${token}`,
  
  // Cache keys
  cache: (key: string) => `${NS.CACHE}${key}`,
  cacheAgent: (agentId: string) => `${NS.CACHE}agent:${agentId}`,
  cacheQuery: (query: string) => `${NS.CACHE}query:${query}`,
  
  // Trust chain keys
  trust: (agentId: string) => `${NS.TRUST}${agentId}`,
  trustSignature: (agentId: string) => `${NS.TRUST}${agentId}:signature`,
  trustPoW: (agentId: string) => `${NS.TRUST}${agentId}:pow`,
  
  // Lineage keys
  lineage: (agentId: string) => `${NS.LINEAGE}${agentId}`,
  lineageParent: (agentId: string) => `${NS.LINEAGE}${agentId}:parent`,
  lineageChildren: (agentId: string) => `${NS.LINEAGE}${agentId}:children`,
  
  // Metrics keys
  metrics: (metric: string) => `${NS.METRICS}${metric}`,
  metricsAgent: (agentId: string) => `${NS.METRICS}agent:${agentId}`,
  metricsGlobal: () => `${NS.METRICS}global`,
  
  // Payment keys
  payment: (txId: string) => `${NS.PAYMENT}${txId}`,
  paymentAgent: (agentId: string) => `${NS.PAYMENT}agent:${agentId}`,
  paymentEscrow: (agentId: string) => `${NS.PAYMENT}escrow:${agentId}`,
  
  // Execution keys
  execution: (executionId: string) => `${NS.EXECUTION}${executionId}`,
  executionAgent: (agentId: string) => `${NS.EXECUTION}agent:${agentId}`,
  executionQueue: () => `${NS.EXECUTION}queue`,
  
  // Bus event keys
  bus: (ring: string, event: string) => `${NS.BUS}${ring}:${event}`,
  busQueue: (ring: string) => `${NS.BUS}${ring}:queue`,
  busBacklog: () => `${NS.BUS}backlog`,
  
  // Rate limiting keys
  rate: (key: string) => `${NS.RATE}${key}`,
  rateLimit: (identifier: string) => `${NS.RATE}limit:${identifier}`,
} as const;

/**
 * Key pattern validation
 * Ensures all keys follow the correct format
 */
export function validateKey(key: string): boolean {
  // Check if key starts with a valid namespace
  const validNamespaces = Object.values(NS);
  return validNamespaces.some(ns => key.startsWith(ns));
}

/**
 * Extract namespace from key
 */
export function getNamespace(key: string): string | null {
  const validNamespaces = Object.values(NS);
  const namespace = validNamespaces.find(ns => key.startsWith(ns));
  return namespace || null;
}

/**
 * Key expiration times (in seconds)
 */
export const TTL = {
  SESSION: 86400,        // 24 hours
  CACHE: 3600,           // 1 hour
  CACHE_LONG: 86400,     // 24 hours
  METRICS: 604800,       // 7 days
  EXECUTION: 3600,       // 1 hour
  BUS_EVENT: 300,        // 5 minutes
} as const;

/**
 * Batch key operations
 */
export const BATCH = {
  /**
   * Generate all agent-related keys
   */
  agentKeys: (agentId: string) => ({
    agent: KEYS.agent(agentId),
    config: KEYS.agentConfig(agentId),
    state: KEYS.agentState(agentId),
    metrics: KEYS.agentMetrics(agentId),
    trust: KEYS.trust(agentId),
    lineage: KEYS.lineage(agentId),
    payment: KEYS.paymentAgent(agentId),
  }),
  
  /**
   * Generate all trust-related keys
   */
  trustKeys: (agentId: string) => ({
    trust: KEYS.trust(agentId),
    signature: KEYS.trustSignature(agentId),
    pow: KEYS.trustPoW(agentId),
    lineage: KEYS.lineage(agentId),
  }),
  
  /**
   * Generate all execution-related keys
   */
  executionKeys: (executionId: string, agentId: string) => ({
    execution: KEYS.execution(executionId),
    agent: KEYS.executionAgent(agentId),
    queue: KEYS.executionQueue(),
  }),
} as const;

/**
 * Key pattern matching
 */
export const PATTERNS = {
  allAgents: () => `${NS.AGENT}*`,
  allSessions: () => `${NS.SESSION}*`,
  allCache: () => `${NS.CACHE}*`,
  allMetrics: () => `${NS.METRICS}*`,
  agentsByPrefix: (prefix: string) => `${NS.AGENT}${prefix}*`,
} as const;

/**
 * Type-safe key builder
 */
export class KeyBuilder {
  private parts: string[] = [];
  
  constructor(private namespace: string) {
    this.parts.push(namespace);
  }
  
  add(part: string): this {
    this.parts.push(part);
    return this;
  }
  
  build(): string {
    return this.parts.join(':');
  }
  
  static agent(id: string): KeyBuilder {
    return new KeyBuilder(NS.AGENT).add(id);
  }
  
  static cache(key: string): KeyBuilder {
    return new KeyBuilder(NS.CACHE).add(key);
  }
  
  static metrics(metric: string): KeyBuilder {
    return new KeyBuilder(NS.METRICS).add(metric);
  }
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

// Made with Moe Abdelaziz
