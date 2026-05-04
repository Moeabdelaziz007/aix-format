/**
 * AIX Storage Keys & TTL Configuration (v1.3.3)
 * Centralized registry for all Redis namespaces and their expiry policies.
 */
export declare const NS: {
    readonly REGISTRY: "aix:registry";
    readonly IDENTITY: "aix:identity";
    readonly ECONOMICS: "aix:economics";
    readonly ANALYTICS: "aix:analytics";
    readonly METRICS: "aix:metrics";
    readonly SESSIONS: "aix:sessions";
    readonly ABOM: "aix:abom";
    readonly MCP: "aix:mcp:quota";
    readonly SCAN: "aix:scan";
    readonly HEALTH: "aix:health";
    readonly WIZARD_SESSION: "aix:wizard:session";
    readonly MEMORY_SESSION: "aix:mem:sess";
    readonly MEMORY_SKILL: "aix:mem:skill";
    readonly MEMORY_CONTEXT: "aix:mem:ctx";
    readonly MEMORY_EPISODIC: "aix:mem:epi";
    readonly GATEWAY: "aix:gateway";
    readonly DEAD_HAND: "aix:deadhand";
    readonly SKILLS: "aix:skills";
    readonly INVOKE: "aix:invoke";
    readonly SHADOW: "aix:shadow";
    readonly RATE: "aix:rate";
};
/** Helper functions for key generation to ensure consistency */
export declare const KEYS: {
    registry: (agentId: string) => string;
    analytics: (agentId: string) => string;
    identity: (userId: string) => string;
    economics: (agentId: string) => string;
    session: (uid: string) => string;
    mcpQuota: (tenantId: string) => string;
    wizardSession: (sessionId: string) => string;
    memory: (agentId: string) => string;
    memSession: (agentId: string, sid: string) => string;
    memSkill: (agentId: string) => string;
    memContext: (agentId: string, taskId: string) => string;
    memEpisodic: (agentId: string) => string;
    gateway: (processId: string) => string;
    heartbeat: (agentId: string) => string;
    status: (agentId: string) => string;
    frozen: (agentId: string) => string;
    incident: (agentId: string) => string;
    stats: (agentId: string) => string;
    skill: (agentId: string) => string;
    invoke: (traceId: string) => string;
    shadow: (processId: string) => string;
    ghost: (agentId: string) => string;
};
export declare const TTL: {
    readonly SESSIONS: number;
    readonly REGISTRY: 0;
    readonly ABOM: number;
    readonly MCP: 60;
    readonly METRICS: number;
    readonly SCAN: number;
    readonly HEALTH: 300;
    readonly MEM_SESSION: number;
    readonly MEM_SKILL: 0;
    readonly MEM_CONTEXT: number;
    readonly MEM_EPISODIC: 0;
    readonly GATEWAY: number;
    readonly HEARTBEAT: 90;
    readonly INCIDENT: number;
    readonly MEMORY: number;
    readonly SKILLS: 0;
    readonly INVOKE: number;
    readonly SHADOW: number;
};
export type Namespace = keyof typeof NS;
