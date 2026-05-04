/**
 * 🐾 AIX PET APPS ARCHITECTURE v1.0
 * Mini Apps System for AIX Pets
 * 
 * Every pet has:
 *   ├── mood engine  (ecstatic → τ=0.9)
 *   ├── skill runner (cron-based)
 *   ├── bus.emit() results
 *   └── UI widget   (mini app)
 * 
 * File: packages/aix-core/src/pet-apps.ts
 */

import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/** Pet mood states → τ mapping */
export type PetMood = 'ecstatic' | 'happy' | 'neutral' | 'tired' | 'dying';

export interface MoodState {
  mood: PetMood;
  τ: number;           // quality threshold 0.0 - 1.0
  energy: number;      // 0.0 - 1.0
  lastFed: number;     // timestamp
  streak: number;      // consecutive successful runs
}

/** Bus event structure — ALL communication goes through this */
export interface PetBusEvent {
  topic: string;
  payload: unknown;
  petId: string;
  petName: string;
  timestamp: number;
  signature?: string;  // PoW hash for trust chain
  τ: number;          // mood at time of emission
}

/** Skill definition — what each pet can do */
export interface PetSkill {
  id: string;
  name: string;
  description: string;
  cronExpression: string;     // cron-like schedule
  intervalMs: number;         // fallback: milliseconds
  busTopic: string;           // where results are emitted
  execute: (ctx: SkillContext) => Promise<SkillResult>;
}

/** Context passed to every skill execution */
export interface SkillContext {
  petId: string;
  petName: string;
  mood: MoodState;
  iteration: number;
  memory: Record<string, unknown>;  // pet's local memory
  bus: {
    emit: (topic: string, payload: unknown) => void;
  };
}

/** Result from skill execution */
export interface SkillResult {
  success: boolean;
  data: unknown;
  moodImpact: number;     // -0.1 to +0.1
  energyCost: number;     // 0.0 to 0.5
  metadata: Record<string, unknown>;
}

/** UI Widget definition for mini-app rendering */
export interface PetWidget {
  id: string;
  type: 'chart' | 'list' | 'card' | 'alert' | 'log';
  title: string;
  dataSource: string;     // bus topic to subscribe
  refreshInterval: number;
  render: (data: unknown[]) => unknown;  // returns React-compatible structure
}

/** Complete pet definition */
export interface PetDefinition {
  id: string;
  emoji: string;
  name: string;
  description: string;
  skills: PetSkill[];
  widgets: PetWidget[];
  defaultMood: MoodState;
}

/** Runtime pet instance */
export interface PetInstance {
  definition: PetDefinition;
  mood: MoodState;
  memory: Record<string, unknown>;
  iteration: number;
  timers: NodeJS.Timeout[];
  lastRun: number;
  totalRuns: number;
  successRuns: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class MoodEngine {
  private static readonly MOOD_MAP: Record<PetMood, number> = {
    ecstatic: 0.9,
    happy: 0.7,
    neutral: 0.5,
    tired: 0.3,
    dying: 0.1,
  };

  /** τ floor: ALWAYS enforce τ ≥ 0.1 to prevent death spiral */
  static computeτ(mood: PetMood, streak: number): number {
    const base = this.MOOD_MAP[mood];
    const streakBonus = Math.min(streak * 0.02, 0.1); // max +0.1 from streak
    return Math.max(0.1, base + streakBonus);
  }

  static updateMood(current: MoodState, success: boolean, energyCost: number): MoodState {
    let newEnergy = Math.max(0, current.energy - energyCost);

    // Auto-feed: energy regenerates slowly
    const timeSinceFed = Date.now() - current.lastFed;
    if (timeSinceFed > 3600000) { // 1 hour
      newEnergy = Math.min(1, newEnergy + 0.1);
    }

    let newMood: PetMood = current.mood;
    let newStreak = success ? current.streak + 1 : 0;

    if (newEnergy > 0.8 && newStreak >= 3) newMood = 'ecstatic';
    else if (newEnergy > 0.6 && newStreak >= 1) newMood = 'happy';
    else if (newEnergy > 0.4) newMood = 'neutral';
    else if (newEnergy > 0.2) newMood = 'tired';
    else newMood = 'dying';

    return {
      mood: newMood,
      τ: this.computeτ(newMood, newStreak),
      energy: newEnergy,
      lastFed: current.lastFed,
      streak: newStreak,
    };
  }

  static feed(pet: PetInstance): void {
    pet.mood.energy = Math.min(1, pet.mood.energy + 0.3);
    pet.mood.lastFed = Date.now();
    pet.mood = this.updateMood(pet.mood, true, 0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST CHAIN INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class PetTrustChain {
  static signEvent(event: PetBusEvent, secretKey: string): string {
    const payload = `${event.petId}:${event.topic}:${event.timestamp}:${JSON.stringify(event.payload)}`;
    return createHash('sha256').update(payload + secretKey).digest('hex');
  }

  static verifyEvent(event: PetBusEvent, secretKey: string): boolean {
    if (!event.signature) return false;
    const expected = this.signEvent(event, secretKey);
    return event.signature === expected;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL RUNNER — Cron-based execution engine
// ═══════════════════════════════════════════════════════════════════════════════

export class SkillRunner extends EventEmitter {
  private timers = new Map<string, NodeJS.Timeout>();
  private running = new Set<string>();

  schedule(pet: PetInstance, skill: PetSkill, busEmit: (e: PetBusEvent) => void): void {
    const timerId = `${pet.definition.id}:${skill.id}`;

    if (this.timers.has(timerId)) {
      clearInterval(this.timers.get(timerId)!);
    }

    const interval = skill.intervalMs;

    const timer = setInterval(async () => {
      if (this.running.has(timerId)) return; // prevent overlap
      if (pet.mood.energy < 0.1) {
        this.emit('pet:exhausted', { petId: pet.definition.id, skill: skill.id });
        return;
      }

      this.running.add(timerId);
      const startTime = Date.now();

      try {
        const ctx: SkillContext = {
          petId: pet.definition.id,
          petName: pet.definition.name,
          mood: { ...pet.mood },
          iteration: pet.iteration,
          memory: pet.memory,
          bus: {
            emit: (topic: string, payload: unknown) => {
              busEmit({
                topic,
                payload,
                petId: pet.definition.id,
                petName: pet.definition.name,
                timestamp: Date.now(),
                τ: pet.mood.τ,
              });
            },
          },
        };

        this.emit('skill:start', { petId: pet.definition.id, skill: skill.id });

        const result = await skill.execute(ctx);

        // Update pet state
        pet.mood = MoodEngine.updateMood(pet.mood, result.success, result.energyCost);
        pet.iteration++;
        pet.lastRun = Date.now();
        pet.totalRuns++;
        if (result.success) pet.successRuns++;

        // Emit result to bus
        const event: PetBusEvent = {
          topic: skill.busTopic,
          payload: {
            skillId: skill.id,
            skillName: skill.name,
            result: result.data,
            success: result.success,
            duration: Date.now() - startTime,
            iteration: pet.iteration,
          },
          petId: pet.definition.id,
          petName: pet.definition.name,
          timestamp: Date.now(),
          τ: pet.mood.τ,
        };

        // Sign for trust chain
        event.signature = PetTrustChain.signEvent(event, `${pet.definition.id}-secret`);
        busEmit(event);

        this.emit('skill:complete', { 
          petId: pet.definition.id, 
          skill: skill.id, 
          success: result.success,
          mood: pet.mood.mood,
        });

      } catch (err) {
        pet.mood = MoodEngine.updateMood(pet.mood, false, 0.2);
        this.emit('skill:error', { 
          petId: pet.definition.id, 
          skill: skill.id, 
          error: (err as Error).message 
        });
      } finally {
        this.running.delete(timerId);
      }
    }, interval);

    this.timers.set(timerId, timer);
  }

  stop(petId?: string): void {
    if (petId) {
      for (const [id, timer] of this.timers) {
        if (id.startsWith(petId)) {
          clearInterval(timer);
          this.timers.delete(id);
        }
      }
    } else {
      for (const timer of this.timers.values()) {
        clearInterval(timer);
      }
      this.timers.clear();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE 5 PETS — SKILL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Skills and widgets implementation continues in next message due to length...
// (The complete implementation from your feedback will be added)

export default class PetAppsCoordinator extends EventEmitter {
  // Implementation continues...
}

// Made with Moe Abdelaziz
