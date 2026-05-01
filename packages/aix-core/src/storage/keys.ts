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
  
  // Agent Intelligence & Learning (Hermes Layers)
  MEMORY_SESSION: 'aix:mem:sess',   // Layer 1: Session (24h)
  MEMORY_SKILL: 'aix:mem:skill',     // Layer 2: Learned Skills (Permanent)
  MEMORY_CONTEXT: 'aix:mem:ctx',     // Layer 3: Task Context (Per task)
  MEMORY_EPISODIC: 'aix:mem:epi',    // Layer 4: Long-term Patterns (Permanent)
  
  // Gateway & Execution Loops (Persistent Agent Patterns)
  GATEWAY: 'aix:gateway',           // aix:gateway:{processId}
  
  SKILLS: 'aix:skills',         
  INVOKE: 'aix:invoke'          
} as const;

/** Helper functions for key generation to ensure consistency */
export const KEYS = {
  registry: (agentId: string) => `agent:${agentId}`,
  analytics: (agentId: string) => `agent:${agentId}:analytics`,
  identity: (userId: string) => `user:${userId}:identity`,
  economics: (agentId: string) => `agent:${agentId}:economics`,
  session: (uid: string) => `aix:sessions:${uid}`,
  mcpQuota: (tenantId: string) => `aix:mcp:quota:${tenantId}`,
  wizardSession: (sessionId: string) => `wizard:session:${sessionId}`,
  
  // Intelligence Layers
  memory: (agentId: string) => `agent:${agentId}:memory`,
  memSession: (agentId: string, sid: string) => `agent:${agentId}:mem:sess:${sid}`,
  memSkill: (agentId: string) => `agent:${agentId}:mem:skill`,
  memContext: (agentId: string, taskId: string) => `agent:${agentId}:mem:ctx:${taskId}`,
  memEpisodic: (agentId: string) => `agent:${agentId}:mem:epi`,
  
  // Gateway Logic
  gateway: (processId: string) => `aix:gateway:${processId}`,
  
  skill: (agentId: string) => `agent:${agentId}:skills`, 
  invoke: (traceId: string) => `agent:${traceId}:invoke`
};

export const TTL = {
  SESSIONS: 60 * 60 * 24,       // 24 Hours
  REGISTRY: 0,                 // Permanent
  ABOM: 60 * 60 * 24 * 30,     // 30 Days
  MCP: 60,                     // 60 Seconds
  METRICS: 60 * 60 * 24 * 90,  // 90 Days
  SCAN: 60 * 60 * 24 * 7,      // 7 Days
  HEALTH: 300,                  // 5 Minutes
  
  // Intelligence TTLs
  MEM_SESSION: 60 * 60 * 24,    // 24 Hours
  MEM_SKILL: 0,                 // Permanent
  MEM_CONTEXT: 60 * 60 * 12,    // 12 Hours (Task duration)
  MEM_EPISODIC: 0,              // Permanent
  
  GATEWAY: 60 * 60 * 2,         // 2 Hours (Maximum agent thought life)
  
  MEMORY: 60 * 60 * 24 * 30,    // 30 Days (Standard Context)
  SKILLS: 0,                    // Permanent
  INVOKE: 60 * 60               // 1 Hour (Request Trace)
} as const;

export type Namespace = keyof typeof NS;
