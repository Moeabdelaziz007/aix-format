/**
 * AIX Storage Keys & TTL Configuration (v1.3.3)
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
  
  // Dead Hand Protocol (Autonomous Safety)
  DEAD_HAND: 'aix:deadhand',        // Status, heartbeats, incidents
  
  SKILLS: 'aix:skills',         
  INVOKE: 'aix:invoke',
  SHADOW: 'aix:shadow', // Ghost Agent Pattern: Shadow Memory
  RATE: 'aix:rate'
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
  
  // Dead Hand Protocol
  heartbeat: (agentId: string) => `agent:${agentId}:heartbeat`,
  status: (agentId: string) => `agent:${agentId}:status`,
  frozen: (agentId: string) => `agent:${agentId}:frozen`,
  incident: (agentId: string) => `agent:${agentId}:incident`,
  stats: (agentId: string) => `agent:${agentId}:stats`,
  
  skill: (agentId: string) => `agent:${agentId}:skills`, 
  invoke: (traceId: string) => `agent:${traceId}:invoke`,
  
  // Ghost Agent Pattern
  shadow: (processId: string) => `aix:shadow:${processId}`,
  ghost: (agentId: string) => `agent:${agentId}:ghost`
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
  
  GATEWAY: 60 * 60 * 2,         // 2 Hours
  
  // Dead Hand
  HEARTBEAT: 90,                // 90 Seconds (Dead Hand window)
  INCIDENT: 60 * 60 * 24 * 30,  // 30 Days (Forensic window)
  
  MEMORY: 60 * 60 * 24 * 30,    // 30 Days
  SKILLS: 0,                    // Permanent
  INVOKE: 60 * 60,               // 1 Hour
  SHADOW: 60 * 60 * 24         // 24 Hours
} as const;

export type Namespace = keyof typeof NS;
