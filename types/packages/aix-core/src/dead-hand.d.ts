/**
 * AIX Dead Hand Protocol (Autonomous Safety System)
 * Inspired by fail-safe nuclear command systems.
 * Automatically shuts down or quarantines agents that show malicious or anomalous patterns.
 */
export type ThreatLevel = 'SOFT_KILL' | 'HARD_KILL' | 'QUARANTINE';
export type TrustLevel = 'VERIFIED' | 'PENDING' | 'FLAGGED';
export interface DeadHandTrigger {
    agentId: string;
    reason: string;
    threatLevel: ThreatLevel;
    evidence: Record<string, unknown>;
    timestamp: number;
}
/**
 * Evaluates an agent's current state against safety invariants.
 */
export declare function evaluateAgent(agentId: string): Promise<DeadHandTrigger | null>;
/**
 * Executes the Dead Hand Response (Pattern 4).
 */
export declare function executeDeadHand(t: DeadHandTrigger): Promise<void>;
/**
 * Sends a heartbeat to prevent Dead Hand trigger.
 */
export declare function sendHeartbeat(agentId: string): Promise<void>;
