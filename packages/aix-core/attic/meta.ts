/**
 * 🧬 AIX META ENGINE - The ONE Function That Runs Everything
 * 
 * Philosophy: بدل 7 engines منفصلين، engine واحد recursive
 * 40 سطر يعوضوا 400
 * 
 * Features built-in:
 * - ReAct loop (Observe → Decide → Act → Reflect)
 * - UCB1 selection (tracks which phases succeed)
 * - Entropy control (prevents infinite loops)
 * - Self-reflection (agent watches its own output)
 * - Pet circular observation (emergent cross-learning)
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type Phase = 'observe' | 'decide' | 'act' | 'reflect';

export interface Agent {
  id: string;
  skills: Record<Phase, (input: unknown) => Promise<PhaseResult>>;
  state: AgentState;
}

export interface AgentState {
  lastResult: unknown;
  entropy: number;
  phaseWins: Record<Phase, number>;
  mood: 'ecstatic' | 'happy' | 'neutral' | 'tired' | 'dying';
  τ: number;  // quality threshold
}

export interface PhaseResult {
  success: boolean;
  confidence: number;
  data: unknown;
  nextPhase?: Phase;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE ONE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

const PHASE_CHAIN: Record<Phase, Phase> = {
  observe: 'decide',
  decide: 'act',
  act: 'reflect',
  reflect: 'observe'  // ← infinite loop built-in
};

/**
 * The recursive meta function that runs everything
 * 
 * @param agent - The agent executing
 * @param input - Input data
 * @param phase - Current phase (default: observe)
 * @param depth - Recursion depth (entropy guard)
 * @returns Result of the complete loop
 */
export async function meta(
  agent: Agent,
  input: unknown,
  phase: Phase = 'observe',
  depth = 0
): Promise<unknown> {
  // Entropy guard: prevent infinite loops
  if (depth > 10) return agent.state.lastResult;

  // Execute current phase
  const result = await agent.skills[phase](input);

  // Self-observation: agent watches its own output
  if (result?.confidence < 0.4 && phase === 'reflect') {
    agent.state.entropy += 0.1;
    // Retry smarter: go back to observe with increased entropy
    return meta(agent, input, 'observe', depth + 1);
  }

  // UCB1 built-in: track which phases succeed most
  agent.state.phaseWins[phase] = (agent.state.phaseWins[phase] ?? 0) + (result?.success ? 1 : 0);

  // Store result for entropy guard
  agent.state.lastResult = result;

  // Continue to next phase or complete loop
  return PHASE_CHAIN[phase] === 'observe'
    ? result  // Loop complete
    : meta(agent, result, PHASE_CHAIN[phase], depth + 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PETS AS META-OBSERVERS - Circular Observation Ring
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * الفكرة: Bull يراقب Volt، Volt يراقب Shade، etc.
 * Circular observation = emergent self-regulation
 * 
 * Emergent property: Bull يبقى أحسن في timing لأنه بيتعلم من Chrono
 */

export const PET_WATCH_RING: Record<string, string> = {
  'bull':   'volt',   // Bull يراقب memory optimization
  'volt':   'shade',  // Volt يراقب web alerts
  'shade':  'drop',   // Shade يراقب airdrops
  'drop':   'chrono', // Drop يراقب timing
  'chrono': 'bull',   // Chrono يراقب trading signals ← ring closed
};

export interface Pet {
  id: string;
  learn: (event: unknown) => void;
  state: AgentState;
}

/**
 * Setup circular observation between pets
 * 5 lines يخلي كل pet يتعلم من جاره
 */
export function setupPetObservation(
  pets: Map<string, Pet>,
  bus: EventEmitter
): void {
  Object.entries(PET_WATCH_RING).forEach(([watcher, target]) => {
    // Each pet learns from its neighbor's events
    bus.on(`pet.${target}.*`, (event) => {
      const pet = pets.get(watcher);
      if (pet) {
        pet.learn(event);  // Cross-pollination happens here
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD-BASED SPEED CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pet mood controls meta loop speed
 * ecstatic → fast & aggressive
 * dying → slow & conservative
 */
export function getMoodSpeed(mood: AgentState['mood']): {
  sleepMs: number;
  aggressionFactor: number;
} {
  const MOOD_TAU: Record<AgentState['mood'], number> = {
    ecstatic: 0.9,
    happy: 0.7,
    neutral: 0.5,
    tired: 0.3,
    dying: 0.1,
  };

  const τ = MOOD_TAU[mood];

  return {
    sleepMs: 500 + (1 - τ) * 4500,           // 500ms to 5000ms
    aggressionFactor: 0.5 + τ,                // 0.5x to 1.5x
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UCB1 MODULE SELECTOR - 5 Lines
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * UCB1 bandit algorithm for module selection
 * Picks the module with highest upper confidence bound
 */
export function ucb1Select<T extends { pulls: number; rewards: number[] }>(
  arms: T[],
  totalPulls: number
): T & { ucb?: number } {
  return arms.reduce((best: any, arm) => {
    const avgReward = arm.rewards.length > 0
      ? arm.rewards.reduce((a, b) => a + b, 0) / arm.rewards.length
      : 0;
    const exploration = Math.sqrt((2 * Math.log(totalPulls)) / (arm.pulls || 1));
    const ucb = avgReward + exploration;
    return ucb > (best.ucb || 0) ? { ...arm, ucb } : best;
  }, arms[0] as any);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENT PROPERTIES TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Track emergent behaviors that arise from pet interactions
 */
export class EmergenceTracker {
  private patterns: Map<string, { count: number; strength: number }> = new Map();

  record(pattern: string, strength: number): void {
    const existing = this.patterns.get(pattern) || { count: 0, strength: 0 };
    this.patterns.set(pattern, {
      count: existing.count + 1,
      strength: (existing.strength * existing.count + strength) / (existing.count + 1),
    });
  }

  getStrongest(): Array<{ pattern: string; count: number; strength: number }> {
    return Array.from(this.patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export default meta;

// Made with Moe Abdelaziz
