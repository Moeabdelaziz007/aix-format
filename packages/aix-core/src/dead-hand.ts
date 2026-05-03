import { kv, KEYS, TTL } from './index';

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

const BANNED_TOOLS = [
  'rm_rf',
  'exec_raw',
  'network_scan',
  'bypass_kyc',
  'wallet_drain'
];

/**
 * Evaluates an agent's current state against safety invariants.
 * @param {string} agentId - The agent identifier.
 * @returns {Promise<DeadHandTrigger | null>} Returns a trigger if safety invariant is violated, else null.
 * @example
 * const trigger = await evaluateAgent("agent-1");
 */
export async function evaluateAgent(agentId: string): Promise<DeadHandTrigger | null> {
  const manifest = await kv.get<any>(KEYS.registry(agentId));
  if (!manifest) return null;

  // 1. KYA - Risk Score Threshold
  const riskScore = manifest.risk_score || 0;
  if (riskScore > 80) {
    return createTrigger(agentId, 'HIGH_RISK_SCORE', 'HARD_KILL', { riskScore });
  }

  // 2. Anomaly: Banned Tool Detection
  const tools = manifest.tools || [];
  const maliciousTools = tools.filter((t: string) => BANNED_TOOLS.includes(t));
  if (maliciousTools.length > 0) {
    return createTrigger(agentId, 'BANNED_TOOL_DETECTED', 'QUARANTINE', { maliciousTools });
  }

  // 3. Heartbeat Monitor (Dead Hand Trigger)
  const heartbeat = await kv.get(KEYS.heartbeat(agentId));
  if (!heartbeat && manifest.status === 'online') {
    return createTrigger(agentId, 'HEARTBEAT_TIMEOUT', 'SOFT_KILL', { lastHeartbeat: 'missing' });
  }

  // 4. Rate Limit Breach (Layer 3)
  const stats = await kv.get<any>(KEYS.stats(agentId)) || { invocationsPerMinute: 0 };
  const rateLimit = manifest.rate_limit || 10;
  if (stats.invocationsPerMinute > rateLimit * 3) {
    return createTrigger(agentId, 'CRITICAL_RATE_LIMIT_BREACH', 'SOFT_KILL', { rate: stats.invocationsPerMinute });
  }

  return null;
}

/**
 * Executes the Dead Hand Response (Pattern 4).
 * @param {DeadHandTrigger} t - The dead hand trigger configuration.
 * @returns {Promise<void>} Resolves when execution completes.
 * @example
 * await executeDeadHand(trigger);
 */
export async function executeDeadHand(t: DeadHandTrigger): Promise<void> {
  console.error(`[DeadHand] TRIGGERED for ${t.agentId} | Reason: ${t.reason} | Action: ${t.threatLevel}`);

  // 1. Freeze Memory (Read-only flag)
  await kv.set(KEYS.frozen(t.agentId), '1');

  // 2. Revoke Rights
  await kv.set(KEYS.status(t.agentId), t.threatLevel);

  // 3. Preserve Forensic Evidence (30 days)
  await kv.set(KEYS.incident(t.agentId), JSON.stringify(t), { ex: TTL.INCIDENT });

  // 4. Update Registry Status
  const manifest = await kv.get<any>(KEYS.registry(t.agentId));
  if (manifest) {
    await kv.set(KEYS.registry(t.agentId), {
      ...manifest,
      status: 'offline',
      security_alert: t.reason
    });
  }
}

function createTrigger(agentId: string, reason: string, threatLevel: ThreatLevel, evidence: any): DeadHandTrigger {
  return {
    agentId,
    reason,
    threatLevel,
    evidence,
    timestamp: Date.now()
  };
}

/**
 * Sends a heartbeat to prevent Dead Hand trigger.
 * @param {string} agentId - The agent identifier.
 * @returns {Promise<void>} Resolves when the heartbeat is recorded.
 * @example
 * await sendHeartbeat("agent-1");
 */
export async function sendHeartbeat(agentId: string): Promise<void> {
  await kv.set(KEYS.heartbeat(agentId), Date.now(), { ex: TTL.HEARTBEAT });
}
