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
  | 'CHANNEL_PROVISIONED'
  // ReAct Loop (Ring 2 — MIND)
  | 'THOUGHT_GENERATED'
  | 'ACTION_PLANNED'
  | 'ACTION_EXECUTING'
  | 'OBSERVATION_RECORDED'
  | 'REFLECTION_COMPLETE'
  // Pet (Ring 1 — SOUL)
  | 'PET_MOOD_CHANGED'
  | 'PET_LEVELED_UP'
  | 'PET_ACCESSORY_UNLOCKED'
  // Trust (Ring 0 — GENESIS)
  | 'TRUST_TX_MINING'
  | 'TRUST_TX_MINED'
  | 'TRUST_SCORE_UPDATED'
  // Stream (Ring 3 — BODY)
  | 'RESULT_CHUNK'
  | 'RESULT_COMPLETE'
  | 'METRICS_UPDATED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETE';

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

// ─── Interactive UI Event Factories ──────────────────────────────────────────

/**
 * Ring 2 — MIND: Emitted by agent-runtime.ts during ReAct loop
 * @param agentId Agent identifier
 * @param agentName Agent display name
 * @param thought The reasoning step content
 * @param step Current step number in the ReAct loop
 * @returns BusEvent for THOUGHT_GENERATED
 */
export function createThoughtEvent(
  agentId   : string,
  agentName : string,
  thought   : string,
  step      : number,
): BusEvent {
  return mkEvent(
    BUS_RINGS.MIND,
    'THOUGHT_GENERATED',
    agentId,
    agentName,
    `💭 Step ${step}: ${thought.slice(0, 80)}${thought.length > 80 ? '...' : ''}`,
    { thought, step }
  );
}

/**
 * Ring 2 — MIND: Emitted when agent executes a tool
 * @param agentId Agent identifier
 * @param agentName Agent display name
 * @param tool Tool name being executed
 * @param input Tool input parameters
 * @param step Current step number
 * @returns BusEvent for ACTION_EXECUTING
 */
export function createActionEvent(
  agentId   : string,
  agentName : string,
  tool      : string,
  input     : unknown,
  step      : number,
): BusEvent {
  return mkEvent(
    BUS_RINGS.MIND,
    'ACTION_EXECUTING',
    agentId,
    agentName,
    `⚡ Action: ${tool}`,
    { tool, input, step }
  );
}

/**
 * Ring 2 — MIND: Emitted when tool execution completes
 * @param agentId Agent identifier
 * @param agentName Agent display name
 * @param observation Tool execution result
 * @param step Current step number
 * @returns BusEvent for OBSERVATION_RECORDED
 */
export function createObservationEvent(
  agentId     : string,
  agentName   : string,
  observation : string,
  step        : number,
): BusEvent {
  return mkEvent(
    BUS_RINGS.MIND,
    'OBSERVATION_RECORDED',
    agentId,
    agentName,
    `👁️ Observation: ${observation.slice(0, 80)}${observation.length > 80 ? '...' : ''}`,
    { observation, step }
  );
}

/**
 * Ring 1 — SOUL: Emitted by pets.ts when mood changes
 * @param agentId Agent identifier
 * @param agentName Agent display name
 * @param fromMood Previous mood state
 * @param toMood New mood state
 * @param tau Quality threshold (0.1-1.0)
 * @returns BusEvent for PET_MOOD_CHANGED
 */
export function createPetMoodEvent(
  agentId   : string,
  agentName : string,
  fromMood  : string,
  toMood    : string,
  tau       : number,
): BusEvent {
  return mkEvent(
    BUS_RINGS.SOUL,
    'PET_MOOD_CHANGED',
    agentId,
    agentName,
    `🐾 Mood: ${fromMood} → ${toMood} (τ=${tau.toFixed(2)})`,
    { fromMood, toMood, tau }
  );
}

/**
 * Ring 0 — GENESIS: Emitted by trust-chain.ts during PoW mining
 * @param agentId Agent identifier
 * @param agentName Agent display name
 * @param nonce Current nonce attempt
 * @param hash Current hash being tested
 * @param done Whether mining is complete
 * @returns BusEvent for TRUST_TX_MINING or TRUST_TX_MINED
 */
export function createTrustMiningEvent(
  agentId   : string,
  agentName : string,
  nonce     : number,
  hash      : string,
  done      : boolean,
): BusEvent {
  return mkEvent(
    BUS_RINGS.GENESIS,
    done ? 'TRUST_TX_MINED' : 'TRUST_TX_MINING',
    agentId,
    agentName,
    done
      ? `⛏️ Block mined: ${hash.slice(0, 12)}…`
      : `⛏️ Mining nonce ${nonce}…`,
    { nonce, hash, done }
  );
}

// ─── UI Layer Metadata Interface ─────────────────────────────────────────────

/**
 * Optional metadata for UI layer routing and visualization
 */
export interface UILayerMeta {
  /** Target UI component for this event */
  uiLayer: 'terminal' | 'pet' | 'trust' | 'stream';
  /** ReAct loop step number (for terminal) */
  step?: number;
  /** Quality threshold tau (for pet) */
  tau?: number;
  /** Execution time in milliseconds (for metrics) */
  ms?: number;
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
