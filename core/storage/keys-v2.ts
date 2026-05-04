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
export const NS_METADATA = {
  AGENT: { prefix: 'agent:', description: 'Agent state and configuration' },
  AIX: { prefix: 'aix:', description: 'AIX format manifests and skills' },
  SESSION: { prefix: 'session:', description: 'User session data' },
  CACHE: { prefix: 'cache:', description: 'Temporary cached data' },
  TRUST: { prefix: 'trust:', description: 'Trust chain and signatures' },
  LINEAGE: { prefix: 'lineage:', description: 'Agent lineage and genealogy' },
  METRICS: { prefix: 'metrics:', description: 'Performance and usage metrics' },
  PAYMENT: { prefix: 'payment:', description: 'Payment transactions and escrow' },
  EXECUTION: { prefix: 'execution:', description: 'Task execution state' },
  BUS: { prefix: 'bus:', description: 'Event bus messages' },
  RATE: { prefix: 'rate:', description: 'Rate limiting buckets' },
} as const;

export const NS = Object.fromEntries(
  Object.entries(NS_METADATA).map(([key, { prefix }]) => [key, prefix])
) as Record<keyof typeof NS_METADATA, string>;

/**
 * Key builder with fluent API and validation
 */
export class KeyBuilder {
  private parts: string[] = [];
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.parts.push(namespace.replace(/:$/, '')); // Remove trailing colon
  }

  add(part: string | number): this {
    if (part === null || part === undefined) {
      throw new Error(`[KeyBuilder] Cannot add null/undefined to key`);
    }
    this.parts.push(String(part));
    return this;
  }

  build(): string {
    return this.parts.join(':');
  }

  // Static factory methods
  static agent(id: string): KeyBuilder {
    return new KeyBuilder(NS.AGENT).add(id);
  }

  static cache(key: string): KeyBuilder {
    return new KeyBuilder(NS.CACHE).add(key);
  }

  static metrics(metric: string): KeyBuilder {
    return new KeyBuilder(NS.METRICS).add(metric);
  }

  static rate(key: string): KeyBuilder {
    return new KeyBuilder(NS.RATE).add(key);
  }
}

/**
 * Auto-generated key functions with type safety
 */
export const KEYS = {
  // Agent keys
  agent: (id: string) => `${NS.AGENT}${id}`,
  agentConfig: (id: string) => `${NS.AGENT}${id}:config`,
  agentState: (id: string) => `${NS.AGENT}${id}:state`,
  agentMetrics: (id: string) => `${NS.AGENT}${id}:metrics`,
  
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
  
  // Rate limiting keys (NEW!)
  rate: (key: string) => `${NS.RATE}${key}`,
  rateLimit: (identifier: string) => `${NS.RATE}limit:${identifier}`,
  rateWindow: (identifier: string) => `${NS.RATE}window:${identifier}`,
  rateBucket: (identifier: string) => `${NS.RATE}bucket:${identifier}`,
} as const;

/**
 * Enhanced validation with detailed error messages
 */
export function validateKey(key: string): { valid: boolean; error?: string; namespace?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key must be a non-empty string' };
  }

  const validNamespaces = Object.values(NS);
  const namespace = validNamespaces.find(ns => key.startsWith(ns));
  
  if (!namespace) {
    return {
      valid: false,
      error: `Key must start with a valid namespace: ${validNamespaces.join(', ')}`,
    };
  }

  return { valid: true, namespace };
}

/**
 * Extract namespace from key
 */
export function getNamespace(key: string): string | null {
  const validNamespaces = Object.values(NS);
  return validNamespaces.find(ns => key.startsWith(ns)) || null;
}

/**
 * Get namespace metadata
 */
export function getNamespaceInfo(key: string): typeof NS_METADATA[keyof typeof NS_METADATA] | null {
  const namespace = getNamespace(key);
  if (!namespace) return null;
  
  const entry = Object.entries(NS_METADATA).find(([_, meta]) => meta.prefix === namespace);
  return entry ? entry[1] : null;
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
  RATE_LIMIT: 60,        // 1 minute (default rate limit window)
} as const;

/**
 * Batch key operations
 */
export const BATCH = {
  agentKeys: (agentId: string) => ({
    agent: KEYS.agent(agentId),
    config: KEYS.agentConfig(agentId),
    state: KEYS.agentState(agentId),
    metrics: KEYS.agentMetrics(agentId),
    trust: KEYS.trust(agentId),
    lineage: KEYS.lineage(agentId),
    payment: KEYS.paymentAgent(agentId),
  }),
  
  trustKeys: (agentId: string) => ({
    trust: KEYS.trust(agentId),
    signature: KEYS.trustSignature(agentId),
    pow: KEYS.trustPoW(agentId),
    lineage: KEYS.lineage(agentId),
  }),
  
  executionKeys: (executionId: string, agentId: string) => ({
    execution: KEYS.execution(executionId),
    agent: KEYS.executionAgent(agentId),
    queue: KEYS.executionQueue(),
  }),
  
  rateLimitKeys: (identifier: string) => ({
    rate: KEYS.rate(identifier),
    limit: KEYS.rateLimit(identifier),
    window: KEYS.rateWindow(identifier),
    bucket: KEYS.rateBucket(identifier),
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
  allRateLimits: () => `${NS.RATE}*`,
  agentsByPrefix: (prefix: string) => `${NS.AGENT}${prefix}*`,
  byNamespace: (namespace: keyof typeof NS) => `${NS[namespace]}*`,
} as const;

/**
 * Migration helper: convert old keys to new format
 */
export function migrateKey(oldKey: string): string | null {
  // Handle old manual key constructions
  const migrations: Record<string, (key: string) => string> = {
    'rate:': (key) => KEYS.rate(key.replace('rate:', '')),
    'agent:': (key) => {
      const parts = key.split(':');
      if (parts.length === 2) return KEYS.agent(parts[1]);
      if (parts.length === 3 && parts[2] === 'config') return KEYS.agentConfig(parts[1]);
      return key;
    },
  };

  for (const [prefix, migrator] of Object.entries(migrations)) {
    if (oldKey.startsWith(prefix)) {
      return migrator(oldKey);
    }
  }

  return null;
}

/**
 * Debug helper: analyze key structure
 */
export function analyzeKey(key: string): {
  valid: boolean;
  namespace?: string;
  description?: string;
  parts: string[];
  ttlSuggestion?: number;
} {
  const validation = validateKey(key);
  const info = getNamespaceInfo(key);
  const parts = key.split(':');
  
  let ttlSuggestion: number | undefined;
  if (key.startsWith(NS.CACHE)) ttlSuggestion = TTL.CACHE;
  else if (key.startsWith(NS.SESSION)) ttlSuggestion = TTL.SESSION;
  else if (key.startsWith(NS.RATE)) ttlSuggestion = TTL.RATE_LIMIT;

  return {
    valid: validation.valid,
    namespace: validation.namespace,
    description: info?.description,
    parts,
    ttlSuggestion,
  };
}

// Made with Bob
