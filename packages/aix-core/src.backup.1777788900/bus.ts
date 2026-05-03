import { kv } from './storage/adapter';
import { PulseEngine, PulseEventType } from './pulse';

/**
 * AIX Nervous System — Universal Cross-Language Event Bus (v1.0.0)
 *
 * Architecture: 4-Ring Heartbeat Topology
 *   Ring 0 — GENESIS : Rust DNA signing/verification
 *   Ring 1 — SOUL    : Identity, KYC, Pets, Dead Hand
 *   Ring 2 — MIND    : Go routing, TS Hermes learning
 *   Ring 3 — BODY    : MCP gateway, Channels, Economics
 *
 * All layers (Rust / Go / TypeScript) write to the same
 * Redis spine via PulseEngine.emit().
 * Studio reads back via the SSE /api/pulse/stream endpoint.
 */

export const BUS_RINGS = {
  GENESIS : 0,
  SOUL    : 1,
  MIND    : 2,
  BODY    : 3,
} as const;

export type BusRing = (typeof BUS_RINGS)[keyof typeof BUS_RINGS];

// ─── Extended event types for cross-layer visibility ────────────────────────
export type BusEventType =
  | PulseEventType
  | 'DNA_VERIFIED'
  | 'DNA_TAMPERED'
  | 'TASK_ROUTED'
  | 'TASK_FAILED'
  | 'PAYMENT_SETTLED'
  | 'AGENT_HIBERNATED'
  | 'CHANNEL_PROVISIONED';

export interface BusEvent {
  id        : string;
  timestamp : number;
  ring      : BusRing;
  type      : BusEventType;
  agentId   : string;
  agentName : string;
  message   : string;
  metadata? : Record<string, unknown>;
}

// ─── Factory helpers (one per ring) ─────────────────────────────────────────

/** Ring 0 — emitted by Rust aix-dna after verify_dna() */
export function createDNAEvent(
  manifestId : string,
  hash       : string,
  ok         : boolean,
): BusEvent {
  return mkEvent(BUS_RINGS.GENESIS, ok ? 'DNA_VERIFIED' : 'DNA_TAMPERED',
    manifestId, 'aix-dna',
    ok
      ? `✅ genesis_hash verified: ${hash.slice(0, 12)}…`
      : `🚨 Tamper detected — hash mismatch: ${hash.slice(0, 12)}…`,
    { hash, ok });
}

/** Ring 1 — emitted by dead-hand.ts */
export function createDeadHandEvent(
  agentId     : string,
  agentName   : string,
  threatLevel : string,
  reason      : string,
  evidence    : Record<string, unknown>,
): BusEvent {
  return mkEvent(BUS_RINGS.SOUL, 'SECURITY_ALERT',
    agentId, agentName,
    `☠️  ${threatLevel}: ${reason}`,
    { threatLevel, reason, evidence });
}

/** Ring 1 — emitted by pets.ts on level-up */
export function createEvolutionEvent(
  agentId   : string,
  agentName : string,
  level     : number,
  reward?   : string,
): BusEvent {
  return mkEvent(BUS_RINGS.SOUL, 'EVOLUTION',
    agentId, agentName,
    reward
      ? `⚡ Level ${level} reached — ${reward} unlocked!`
      : `🌱 Level ${level} reached`,
    { level, reward });
}

/** Ring 1 — emitted by pets.ts on sleep mode */
export function createHibernationEvent(
  agentId   : string,
  agentName : string,
): BusEvent {
  return mkEvent(BUS_RINGS.SOUL, 'AGENT_HIBERNATED',
    agentId, agentName,
    `💤 Agent hibernated after 7 days inactivity`,
    {});
}

/** Ring 2 — emitted by Go swarm_router after routing */
export function createRoutingEvent(
  agentId      : string,
  capability   : string,
  score        : number,
  taskId       : string,
): BusEvent {
  return mkEvent(BUS_RINGS.MIND, 'TASK_ROUTED',
    agentId, capability,
    `🐹 Routed task ${taskId} → ${agentId} (score: ${score.toFixed(2)})`,
    { score, taskId, capability });
}

/** Ring 2 — emitted by learning.ts (Hermes) */
export function createSkillEvent(
  agentId   : string,
  agentName : string,
  goal      : string,
  skillHash : string,
): BusEvent {
  return mkEvent(BUS_RINGS.MIND, 'SKILL_EXTRACTED',
    agentId, agentName,
    `🧠 Learned: "${goal}" (${skillHash})`,
    { goal, skillHash });
}

/** Ring 3 — emitted by economics.ts after settlement */
export function createPaymentEvent(
  agentId   : string,
  agentName : string,
  amount    : number,
  currency  : string,
): BusEvent {
  return mkEvent(BUS_RINGS.BODY, 'PAYMENT_SETTLED',
    agentId, agentName,
    `💰 Settled ${amount} ${currency}`,
    { amount, currency });
}

/** Ring 3 — emitted by channels.ts after provisioning */
export function createChannelEvent(
  agentId   : string,
  agentName : string,
  platform  : 'telegram' | 'whatsapp',
  handle    : string,
): BusEvent {
  return mkEvent(BUS_RINGS.BODY, 'CHANNEL_PROVISIONED',
    agentId, agentName,
    `📡 ${platform === 'telegram' ? '✈️ Telegram' : '💬 WhatsApp'} provisioned: ${handle}`,
    { platform, handle });
}

// ─── Emit helpers ────────────────────────────────────────────────────────────

/**
 * Emit any BusEvent through PulseEngine.
 * This is the single funnel that all layers use.
 */
export async function emit(event: Omit<BusEvent, 'id' | 'timestamp'>): Promise<void> {
  await PulseEngine.emit({
    type      : event.type as PulseEventType,
    agentId   : event.agentId,
    agentName : event.agentName,
    message   : event.message,
    metadata  : { ...event.metadata, ring: event.ring },
  });
}

/**
 * Type-guard: is this event from a given ring?
 */
export function isFromRing(event: BusEvent, ring: BusRing): boolean {
  return event.ring === ring;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function mkEvent(
  ring      : BusRing,
  type      : BusEventType,
  agentId   : string,
  agentName : string,
  message   : string,
  metadata  : Record<string, unknown>,
): BusEvent {
  return {
    id        : Math.random().toString(36).slice(2, 12),
    timestamp : Date.now(),
    ring,
    type,
    agentId,
    agentName,
    message,
    metadata,
  };
}
