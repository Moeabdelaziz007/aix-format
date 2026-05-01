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
  HEALTH: 'aix:health',         // System health checks
  WIZARD_SESSION: 'aix:wizard:session', // aix:wizard:session:{sessionId}
  
  // New: Agent Intelligence & Communication
  MEMORY: 'aix:memory',         // aix:memory:{agentId}:{userId}
  SKILLS: 'aix:skills',         // aix:skills:{skillId}
  INVOKE: 'aix:invoke'          // aix:invoke:{traceId}
} as const;

/** Helper functions for key generation to ensure consistency */
export const KEYS = {
  registry: (agentId: string) => `${NS.REGISTRY}:${agentId}`,
  analytics: (agentId: string) => `${NS.ANALYTICS}:${agentId}`,
  identity: (userId: string) => `${NS.IDENTITY}:${userId}`,
  economics: (agentId: string) => `${NS.ECONOMICS}:${agentId}`,
  session: (uid: string) => `${NS.SESSIONS}:${uid}`,
  mcpQuota: (tenantId: string) => `${NS.MCP}:${tenantId}`,
  wizardSession: (sessionId: string) => `${NS.WIZARD_SESSION}:${sessionId}`,
  memory: (agentId: string, userId: string = 'global') => `${NS.MEMORY}:${agentId}:${userId}`,
  skill: (skillId: string) => `${NS.SKILLS}:${skillId}`,
  invoke: (traceId: string) => `${NS.INVOKE}:${traceId}`
};

export const TTL = {
  SESSIONS: 60 * 60 * 24,       // 24 Hours
  REGISTRY: 0,                 // Permanent
  ABOM: 60 * 60 * 24 * 30,     // 30 Days
  MCP: 60,                     // 60 Seconds
  METRICS: 60 * 60 * 24 * 90,  // 90 Days
  SCAN: 60 * 60 * 24 * 7,      // 7 Days
  HEALTH: 300,                  // 5 Minutes
  MEMORY: 60 * 60 * 24 * 30,    // 30 Days (Conversation Context)
  SKILLS: 0,                    // Permanent
  INVOKE: 60 * 60               // 1 Hour (Request Trace)
} as const;

export type Namespace = keyof typeof NS;
