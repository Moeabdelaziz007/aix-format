/**
 * AIX Storage Keys & TTL Configuration (v1.3.0)
 * Centralized registry for all Redis namespaces and their expiry policies.
 */

export const NS = {
  // Registry & Core Data
  REGISTRY: 'aix:registry',     // aix:registry:{agentId}
  IDENTITY: 'aix:identity',     // aix:identity:{userId}
  ECONOMICS: 'aix:economics',   // aix:economics:{agentId}
  
  // Analytics & Metrics
  ANALYTICS: 'aix:analytics',   // aix:analytics:{agentId}
  METRICS: 'aix:metrics',       // General performance tracking
  
  // Operational
  SESSIONS: 'aix:sessions',     // User sessions (uid)
  ABOM: 'aix:abom',             // Agent Bill of Materials cache
  MCP: 'aix:mcp:quota',         // MCP Rate limiting (tenantId)
  SCAN: 'aix:scan',             // Security scan results
  HEALTH: 'aix:health'          // System health checks
} as const;

/** Helper functions for key generation to ensure consistency */
export const KEYS = {
  registry: (agentId: string) => `${NS.REGISTRY}:${agentId}`,
  analytics: (agentId: string) => `${NS.ANALYTICS}:${agentId}`,
  identity: (userId: string) => `${NS.IDENTITY}:${userId}`,
  economics: (agentId: string) => `${NS.ECONOMICS}:${agentId}`,
  session: (uid: string) => `${NS.SESSIONS}:${uid}`,
  mcpQuota: (tenantId: string) => `${NS.MCP}:${tenantId}`
};

export const TTL = {
  SESSIONS: 60 * 60 * 24 * 7,   // 7 Days
  REGISTRY: 0,                 // Permanent
  ABOM: 60 * 60 * 24 * 30,     // 30 Days
  MCP: 60,                     // 60 Seconds
  METRICS: 60 * 60 * 24 * 90,  // 90 Days
  SCAN: 60 * 60 * 24 * 7,      // 7 Days
  HEALTH: 300                  // 5 Minutes
} as const;

export type Namespace = keyof typeof NS;
