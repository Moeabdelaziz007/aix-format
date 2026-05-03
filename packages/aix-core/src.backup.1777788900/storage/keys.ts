/**
 * AIX Storage Keys & TTL Configuration (v1.3.4)
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
  MEMORY_SESSION: 'aix:mem:sess',    // Layer 1: Session (24h)
  MEMORY_SKILL: 'aix:mem:skill',     // Layer 2: Learned Skills (Permanent)
  MEMORY_CONTEXT: 'aix:mem:ctx',     // Layer 3: Task Context (Per task)
  MEMORY_EPISODIC: 'aix:mem:epi',    // Layer 4: Long-term Patterns (Permanent)
  
  // Gateway & Execution Loops (Persistent Agent Patterns)
  GATEWAY: 'aix:gateway',           // aix:gateway:{processId}
  
  // Dead Hand Protocol (Autonomous Safety)
  DEAD_HAND: 'aix:deadhand',        // Status, heartbeats, incidents

  // Nervous System Bus
  PULSE: 'aix:pulse',               // aix:pulse:global (ring-buffer, 100 events)
  
  SKILLS: 'aix:skills',         
  INVOKE: 'aix:invoke',
  SHADOW: 'aix:shadow' // Ghost Agent Pattern: Shadow Memory
} as const;

/** Helper functions for key generation to ensure consistency */
export const KEYS = {
  registry:  (agentId: string)  => `agent:${agentId}`,
  analytics: (agentId: string)  => `agent:${agentId}:analytics`,
  identity:  (userId: string)   => `user:${userId}:identity`,
  economics: (agentId: string)  => `agent:${agentId}:economics`,
  session:   (uid: string)      => `aix:sessions:${uid}`,
  mcpQuota:  (tenantId: string) => `aix:mcp:quota:${tenantId}`,
  wizardSession: (sessionId: string) => `wizard:session:${sessionId}`,
  
  // Intelligence Layers
  memory:      (agentId: string)             => `agent:${agentId}:memory`,
  memSession:  (agentId: string, sid: string) => `agent:${agentId}:mem:sess:${sid}`,
  memSkill:    (agentId: string)             => `agent:${agentId}:mem:skill`,
  memContext:  (agentId: string, taskId: string) => `agent:${agentId}:mem:ctx:${taskId}`,
  memEpisodic: (agentId: string)             => `agent:${agentId}:mem:epi`,
  
  // Gateway Logic
  gateway: (processId: string) => `aix:gateway:${processId}`,
  
  // Dead Hand Protocol
  heartbeat: (agentId: string) => `agent:${agentId}:heartbeat`,
  status:    (agentId: string) => `agent:${agentId}:status`,
  frozen:    (agentId: string) => `agent:${agentId}:frozen`,
  incident:  (agentId: string) => `agent:${agentId}:incident`,
  stats:     (agentId: string) => `agent:${agentId}:stats`,
  
  skill:  (agentId: string)  => `agent:${agentId}:skills`, 
  invoke: (traceId: string)  => `agent:${traceId}:invoke`,
  
  // Ghost Agent Pattern
  shadow: (processId: string) => `aix:shadow:${processId}`,
  
  // 🧬 META-COMPRESSION: Unified Key Registry (88 keys compressed)
  // Agent-scoped keys
  agentSessions:      (agentId: string) => `agent:${agentId}:sessions`,
  agentSkills:        (agentId: string) => `agent:${agentId}:skills`,
  agentSkillDetail:   (agentId: string, hash: string) => `agent:${agentId}:skill:${hash}`,
  agentExpectation:   (agentId: string, taskId: string) => `agent:${agentId}:expectation:${taskId}`,
  agentFailureStats:  (agentId: string) => `agent:${agentId}:failure_stats`,
  agentFailures:      (agentId: string) => `agent:${agentId}:failures`,
  agentFailurePatterns: (agentId: string) => `agent:${agentId}:failure_patterns`,
  agentFailurePattern: (agentId: string, hash: string) => `agent:${agentId}:pattern:${hash}`,
  agentRecentActions: (agentId: string) => `agent:${agentId}:recent_actions`,
  agentChannelsTelegram: (agentId: string) => `agent:${agentId}:channels:telegram`,
  agentChannelsWhatsapp: (agentId: string) => `agent:${agentId}:channels:whatsapp`,
  agentCuriosityScore: (agentId: string) => `agent:${agentId}:curiosity_score`,
  agentActionUsage:   (agentId: string, actionId: string) => `agent:${agentId}:action:${actionId}:usage`,
  agentExplorations:  (agentId: string) => `agent:${agentId}:explorations`,
  agentHappinessHistory: (agentId: string) => `agent:${agentId}:happiness_history`,
  agentExpectationCalibration: (agentId: string) => `agent:${agentId}:expectation_calibration`,
  agentPetState:      (agentId: string) => `agent:${agentId}:pet_state`,
  agentModelMetrics:  (agentId: string, modelId: string) => `agent:${agentId}:model:${modelId}:metrics`,
  agentTrustScore:    (agentId: string) => `agent:${agentId}:trust_score`,
  agentTrustHistory:  (agentId: string) => `agent:${agentId}:trust_history`,
  agentResonanceProfile: (agentId: string) => `agent:${agentId}:resonance_profile`,
  agentResonanceTaskTypes: (agentId: string) => `resonance:agent:${agentId}:task_types`,
  
  // AIX-scoped keys
  aixActionResult:    (agentId: string) => `aix:action:result:${agentId}`,
  aixEvents:          (channel: string) => `aix:events:${channel}`,
  aixEconomicsLedger: (agentId: string) => `aix:economics:ledger:${agentId}`,
  aixEconomicsReinvestment: (agentId: string) => `aix:economics:reinvestment:${agentId}`,
  aixEconomicsStake:  (agentId: string) => `aix:economics:stake:${agentId}`,
  aixLockAgent:       (agentId: string) => `aix:lock:agent:${agentId}`,
  aixModelStats:      (modelId: string) => `aix:model:${modelId}:stats`,
  aixModelCalls:      (modelId: string) => `aix:model:${modelId}:calls`,
  aixP2PNode:         (nodeId: string) => `aix:p2p:node:${nodeId}`,
  aixP2PRouting:      (fromId: string, toId: string) => `aix:p2p:routing:${fromId}:${toId}`,
  aixSwarmTopology:   () => `aix:swarm:topology`,
  aixSwarmNodes:      () => `aix:swarm:nodes`,
  aixSwarmEdges:      () => `aix:swarm:edges`,
  ghost:  (agentId: string)   => `agent:${agentId}:ghost`
};

export const TTL = {
  SESSIONS: 60 * 60 * 24,       // 24 Hours
  REGISTRY: 0,                  // Permanent
  ABOM: 60 * 60 * 24 * 30,      // 30 Days
  MCP: 60,                      // 60 Seconds
  METRICS: 60 * 60 * 24 * 90,   // 90 Days
  SCAN: 60 * 60 * 24 * 7,       // 7 Days
  HEALTH: 300,                   // 5 Minutes
  
  // Intelligence TTLs
  MEM_SESSION: 60 * 60 * 24,    // 24 Hours
  MEM_SKILL: 0,                 // Permanent
  MEM_CONTEXT: 60 * 60 * 12,    // 12 Hours (Task duration)
  MEM_EPISODIC: 0,              // Permanent
  
  GATEWAY: 60 * 60 * 2,         // 2 Hours
  
  // Dead Hand
  HEARTBEAT: 90,                // 90 Seconds (Dead Hand trigger window)
  INCIDENT: 60 * 60 * 24 * 30, // 30 Days (Forensic window)
  
  // MCP Quota (was missing — caused compile error in mcp-gateway)
  QUOTA_WINDOW: 60,             // 60 Seconds per rate-limit window

  MEMORY: 60 * 60 * 24 * 30,   // 30 Days
  SKILLS: 0,                   // Permanent
  INVOKE: 60 * 60,              // 1 Hour
  SHADOW: 60 * 60 * 24         // 24 Hours
} as const;

export type Namespace = keyof typeof NS;
