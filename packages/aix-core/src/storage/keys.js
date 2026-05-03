/**
 * AIX Storage Keys & TTL Configuration (v1.3.4)
 * Centralized registry for all Redis namespaces and their expiry policies.
 */
export const NS = {
    // Registry & Core Data
    REGISTRY: 'aix:registry', // aix:registry:{agentId}
    IDENTITY: 'aix:identity', // aix:identity:{userId}
    ECONOMICS: 'aix:economics', // aix:economics:{agentId}
    // Analytics & Metrics
    ANALYTICS: 'aix:analytics', // aix:analytics:{agentId}
    METRICS: 'aix:metrics', // General performance tracking
    // Operational
    SESSIONS: 'aix:sessions', // User sessions (uid)
    ABOM: 'aix:abom', // Agent Bill of Materials cache
    MCP: 'aix:mcp:quota', // MCP Rate limiting (tenantId)
    SCAN: 'aix:scan', // Security scan results
    HEALTH: 'aix:health', // System health checks
    WIZARD_SESSION: 'aix:wizard:session', // aix:wizard:session:{sessionId}
    // Agent Intelligence & Learning (Hermes Layers)
    MEMORY_SESSION: 'aix:mem:sess', // Layer 1: Session (24h)
    MEMORY_SKILL: 'aix:mem:skill', // Layer 2: Learned Skills (Permanent)
    MEMORY_CONTEXT: 'aix:mem:ctx', // Layer 3: Task Context (Per task)
    MEMORY_EPISODIC: 'aix:mem:epi', // Layer 4: Long-term Patterns (Permanent)
    // Gateway & Execution Loops (Persistent Agent Patterns)
    GATEWAY: 'aix:gateway', // aix:gateway:{processId}
    // Dead Hand Protocol (Autonomous Safety)
    DEAD_HAND: 'aix:deadhand', // Status, heartbeats, incidents
    // Nervous System Bus
    PULSE: 'aix:pulse', // aix:pulse:global (ring-buffer, 100 events)
    SKILLS: 'aix:skills',
    INVOKE: 'aix:invoke',
    SHADOW: 'aix:shadow' // Ghost Agent Pattern: Shadow Memory
};
/** Helper functions for key generation to ensure consistency */
export const KEYS = {
    registry: (agentId) => `agent:${agentId}`,
    analytics: (agentId) => `agent:${agentId}:analytics`,
    identity: (userId) => `user:${userId}:identity`,
    economics: (agentId) => `agent:${agentId}:economics`,
    session: (uid) => `aix:sessions:${uid}`,
    mcpQuota: (tenantId) => `aix:mcp:quota:${tenantId}`,
    wizardSession: (sessionId) => `wizard:session:${sessionId}`,
    // Intelligence Layers
    memory: (agentId) => `agent:${agentId}:memory`,
    memSession: (agentId, sid) => `agent:${agentId}:mem:sess:${sid}`,
    memSkill: (agentId) => `agent:${agentId}:mem:skill`,
    memContext: (agentId, taskId) => `agent:${agentId}:mem:ctx:${taskId}`,
    memEpisodic: (agentId) => `agent:${agentId}:mem:epi`,
    // Gateway Logic
    gateway: (processId) => `aix:gateway:${processId}`,
    // Dead Hand Protocol
    heartbeat: (agentId) => `agent:${agentId}:heartbeat`,
    status: (agentId) => `agent:${agentId}:status`,
    frozen: (agentId) => `agent:${agentId}:frozen`,
    incident: (agentId) => `agent:${agentId}:incident`,
    stats: (agentId) => `agent:${agentId}:stats`,
    skill: (agentId) => `agent:${agentId}:skills`,
    invoke: (traceId) => `agent:${traceId}:invoke`,
    // Ghost Agent Pattern
    shadow: (processId) => `aix:shadow:${processId}`,
    // 🧬 META-COMPRESSION: Unified Key Registry (88 keys compressed)
    // Agent-scoped keys
    agentSessions: (agentId) => `agent:${agentId}:sessions`,
    agentSkills: (agentId) => `agent:${agentId}:skills`,
    agentSkillDetail: (agentId, hash) => `agent:${agentId}:skill:${hash}`,
    agentExpectation: (agentId, taskId) => `agent:${agentId}:expectation:${taskId}`,
    agentFailureStats: (agentId) => `agent:${agentId}:failure_stats`,
    agentFailures: (agentId) => `agent:${agentId}:failures`,
    agentFailurePatterns: (agentId) => `agent:${agentId}:failure_patterns`,
    agentFailurePattern: (agentId, hash) => `agent:${agentId}:pattern:${hash}`,
    agentRecentActions: (agentId) => `agent:${agentId}:recent_actions`,
    agentChannelsTelegram: (agentId) => `agent:${agentId}:channels:telegram`,
    agentChannelsWhatsapp: (agentId) => `agent:${agentId}:channels:whatsapp`,
    agentCuriosityScore: (agentId) => `agent:${agentId}:curiosity_score`,
    agentActionUsage: (agentId, actionId) => `agent:${agentId}:action:${actionId}:usage`,
    agentExplorations: (agentId) => `agent:${agentId}:explorations`,
    agentHappinessHistory: (agentId) => `agent:${agentId}:happiness_history`,
    agentExpectationCalibration: (agentId) => `agent:${agentId}:expectation_calibration`,
    agentPetState: (agentId) => `agent:${agentId}:pet_state`,
    agentModelMetrics: (agentId, modelId) => `agent:${agentId}:model:${modelId}:metrics`,
    agentTrustScore: (agentId) => `agent:${agentId}:trust_score`,
    agentTrustHistory: (agentId) => `agent:${agentId}:trust_history`,
    agentResonanceProfile: (agentId) => `agent:${agentId}:resonance_profile`,
    agentResonanceTaskTypes: (agentId) => `resonance:agent:${agentId}:task_types`,
    // AIX-scoped keys
    aixActionResult: (agentId) => `aix:action:result:${agentId}`,
    aixEvents: (channel) => `aix:events:${channel}`,
    aixEconomicsLedger: (agentId) => `aix:economics:ledger:${agentId}`,
    aixEconomicsReinvestment: (agentId) => `aix:economics:reinvestment:${agentId}`,
    aixEconomicsStake: (agentId) => `aix:economics:stake:${agentId}`,
    aixLockAgent: (agentId) => `aix:lock:agent:${agentId}`,
    aixModelStats: (modelId) => `aix:model:${modelId}:stats`,
    aixModelCalls: (modelId) => `aix:model:${modelId}:calls`,
    aixP2PNode: (nodeId) => `aix:p2p:node:${nodeId}`,
    aixP2PRouting: (fromId, toId) => `aix:p2p:routing:${fromId}:${toId}`,
    aixSwarmTopology: () => `aix:swarm:topology`,
    aixSwarmNodes: () => `aix:swarm:nodes`,
    agentCalibration: (agentId) => `agent:${agentId}:calibration`,
    agentCurrentMood: (agentId) => `agent:${agentId}:current_mood`,
    agentFreq: (agentId) => `agent:${agentId}:freq`,
    agentExp: (agentId) => `agent:${agentId}:exp`,
    agentExplorationHistory: (agentId) => `agent:${agentId}:exploration_history`,
    agentSkillCombo: (agentId, hash) => `agent:${agentId}:skill_combo:${hash}`,
    agentSkillCombos: (agentId) => `agent:${agentId}:skill_combos`,
    agentActionCount: (agentId, action) => `agent:${agentId}:action_count:${action}`,
    agentManifest: (agentId) => `agent:${agentId}:manifest`,
    aixEconomicsTotalStake: (agentId) => `aix:economics:total_stake:${agentId}`,
    aixCompressionProfile: (taskType) => `aix:compression:profile:${taskType}`,
    // 🧬 Lineage Registry (Darwin in Software - PNAS 2025)
    lineageNode: (id) => `aix:lineage:node:${id}`,
    lineageGenesis: () => `aix:lineage:genesis`,
    lineageByType: (type) => `aix:lineage:type:${type}`,
    lineageByGeneration: (gen) => `aix:lineage:generation:${gen}`,
    lineageChildren: (parentId) => `aix:lineage:children:${parentId}`,
    lineageFlagged: () => `aix:lineage:flagged`,
    lineageRecalled: () => `aix:lineage:recalled`,
    agentLastActivity: (agentId) => `agent:${agentId}:last_activity`,
    aixSwarmEdges: () => `aix:swarm:edges`,
    ghost: (agentId) => `agent:${agentId}:ghost`
};
export const TTL = {
    SESSIONS: 60 * 60 * 24, // 24 Hours
    REGISTRY: 0, // Permanent
    ABOM: 60 * 60 * 24 * 30, // 30 Days
    MCP: 60, // 60 Seconds
    METRICS: 60 * 60 * 24 * 90, // 90 Days
    SCAN: 60 * 60 * 24 * 7, // 7 Days
    HEALTH: 300, // 5 Minutes
    // Intelligence TTLs
    MEM_SESSION: 60 * 60 * 24, // 24 Hours
    MEM_SKILL: 0, // Permanent
    MEM_CONTEXT: 60 * 60 * 12, // 12 Hours (Task duration)
    MEM_EPISODIC: 0, // Permanent
    GATEWAY: 60 * 60 * 2, // 2 Hours
    // Dead Hand
    HEARTBEAT: 90, // 90 Seconds (Dead Hand trigger window)
    INCIDENT: 60 * 60 * 24 * 30, // 30 Days (Forensic window)
    // MCP Quota (was missing — caused compile error in mcp-gateway)
    QUOTA_WINDOW: 60, // 60 Seconds per rate-limit window
    MEMORY: 60 * 60 * 24 * 30, // 30 Days
    SKILLS: 0, // Permanent
    INVOKE: 60 * 60, // 1 Hour
    SHADOW: 60 * 60 * 24 // 24 Hours
};
