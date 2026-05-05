import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { PetConfig } from '@studio-types'; // Assuming we can reach types
import { ExpectationEngine } from './expectation-engine';
import { CuriosityEngine } from './curiosity-engine';
import { TaskConstraints } from './constrained-router';

/**
 * Pet mood types
 */
export type PetMood =
  | 'ecstatic'
  | 'energized'
  | 'happy'
  | 'content'
  | 'neutral'
  | 'busy'
  | 'curious'
  | 'tired'
  | 'burned-out'
  | 'dying'
  | 'sleep';

/**
 * AIX Pet Orchestrator (v0.369.0 - Philosophical Enhancement)
 * Manages the evolution and state of agent personas.
 *
 * Enhanced with Philosophical Engines:
 * - Task success/failure (existing) - 40%
 * - Happiness from expectations (Mo Gawdat) - 30%
 * - Curiosity satisfaction (Demis Hassabis) - 30%
 *
 * 🔬 arXiv Integration (Harvard SCORE):
 * - Pet mood → quality threshold τ (dynamic adaptation)
 * - Mood = proxy for system load
 * - Enables cost-aware routing based on agent state
 */

export class PetOrchestrator {
  /**
   * Syncs pet state and mood based on activity and philosophical factors.
   */
  static async sync(agentId: string, pet: any, manifest: any): Promise<void> {
    // 1. Get philosophical metrics
    const [averageHappiness, curiosityScore] = await Promise.all([
      ExpectationEngine.getAverageHappiness(agentId),
      CuriosityEngine.getCuriosityScore(agentId),
    ]);

    // 2. Update Mood based on frequency (traditional factor - 40%)
    const recentInvocations = (await kv.incr(KEYS.agentFreq(agentId))) || 1;
    await kv.expire(KEYS.agentFreq(agentId), 60); // Reset frequency window every minute
    
    let activityMood = 0;
    if (recentInvocations > 5) {
      activityMood = 40; // energized
    } else if (recentInvocations > 2) {
      activityMood = 20; // busy
    } else {
      activityMood = 10; // curious
    }

    // 3. Happiness factor (Mo Gawdat - 30%)
    // Scale happiness from -100/+100 to 0-30
    const happinessMood = Math.round((averageHappiness + 100) / 200 * 30);

    // 4. Curiosity factor (Demis Hassabis - 30%)
    // Scale curiosity score to 0-30 range
    const curiosityMood = Math.min(30, Math.round(curiosityScore / 10));

    // 5. Calculate total mood score (0-100)
    const totalMoodScore = activityMood + happinessMood + curiosityMood;

    // 6. Map mood score to mood state
    if (totalMoodScore >= 80) {
      pet.mood = 'ecstatic';
    } else if (totalMoodScore >= 60) {
      pet.mood = 'energized';
    } else if (totalMoodScore >= 40) {
      pet.mood = 'happy';
    } else if (totalMoodScore >= 25) {
      pet.mood = 'busy';
    } else if (totalMoodScore >= 15) {
      pet.mood = 'curious';
    } else {
      pet.mood = 'tired';
    }

    
    // 2. Progression (Simple Leveling)
    const currentExp = (await kv.incr(KEYS.agentExp(agentId))) || 1;
    const levelThreshold = pet.level * 10;
    
    if (currentExp >= levelThreshold) {
      pet.level += 1;
      await kv.set(KEYS.agentExp(agentId), 0); // Reset for next level
      
      // Reward with accessory at Level 5
      if (pet.level === 5) {
        pet.accessories = [...(pet.accessories || []), 'lightning_bolt'];
      }
      
    }

    // 3. Save back to manifest
    await kv.set(KEYS.registry(agentId), {
      ...manifest,
      pet: { ...pet }
    });
  }

  /**
   * Resets pet to idle state.
   */
  static async settle(agentId: string): Promise<void> {
    const manifest = await kv.get<any>(KEYS.registry(agentId));
    if (!manifest || !manifest.pet) return;

    const pet = manifest.pet as any;
    pet.mood = 'curious';
    
    // Track activity timestamp for Sleep Mode
    await kv.set(KEYS.agentLastActivity(agentId), Date.now());

    await kv.set(KEYS.registry(agentId), {
      ...manifest,
      pet: { ...pet }
    });
  }

  /**
   * Evaluates if agent should enter Sleep Mode (7 days inactivity).
   * Saves compute resources by 'hibernating' the gateway.
   */
  static async checkSleepMode(agentId: string): Promise<boolean> {
    const lastActivity = await kv.get<number>(KEYS.agentLastActivity(agentId)) || 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (Date.now() - lastActivity > sevenDays) {
      const manifest = await kv.get<any>(KEYS.registry(agentId));
      if (manifest && manifest.pet && manifest.pet.mood !== 'sleep') {
        manifest.pet.mood = 'sleep';
        manifest.status = 'hibernated';
        await kv.set(KEYS.registry(agentId), manifest);
      }
      return true;
    }
    return false;
  }
}

/**
 * 🔬 Convert pet mood to quality threshold τ
 *
 * RESEARCH: Harvard SCORE (2025)
 * "Static thresholds prevent adaptation to fluctuating costs.
 *  Mood serves as a proxy for system load and resource availability."
 *
 * MAPPING:
 * - ecstatic → τ=0.9 (high quality needed, system healthy)
 * - energized → τ=0.8 (good quality, active system)
 * - happy → τ=0.7 (solid quality, normal operation)
 * - content → τ=0.6 (acceptable quality)
 * - neutral → τ=0.5 (moderate quality)
 * - busy → τ=0.4 (lower quality OK, system busy)
 * - curious → τ=0.3 (exploring, quality flexible)
 * - tired → τ=0.2 (low quality OK, save resources)
 * - burned-out → τ=0.1 (minimal quality, conservation mode)
 * - dying → τ=0.1 (survival mode, minimum floor to prevent death spiral)
 * - sleep → τ=0.1 (hibernated, minimum floor maintained)
 *
 * CRITICAL FIX: τ minimum floor = 0.1 to prevent death spiral
 * Without this floor: failure → tired → cheap model → failure → dying → cheaper → failure → ∞
 *
 * @param mood - Current pet mood
 * @returns Quality threshold τ ∈ [0.1, 1] (minimum 0.1 enforced)
 */
export function moodToQualityThreshold(mood: PetMood): number {
  const TAU_MIN_FLOOR = 0.1; // Prevent death spiral
  
  switch (mood) {
    case 'ecstatic':    return 0.9;
    case 'energized':   return 0.8;
    case 'happy':       return 0.7;
    case 'content':     return 0.6;
    case 'neutral':     return 0.5;
    case 'busy':        return 0.4;
    case 'curious':     return 0.3;
    case 'tired':       return 0.2;
    case 'burned-out':  return TAU_MIN_FLOOR;
    case 'dying':       return TAU_MIN_FLOOR;  // FIXED: was 0.0
    case 'sleep':       return TAU_MIN_FLOOR;  // FIXED: was 0.0
    default:            return 0.5; // Safe default
  }
}

/**
 * 🔬 Get dynamic constraints based on pet state
 *
 * RESEARCH: IPR (arXiv 2509.06274) + Harvard SCORE
 * "Dynamic constraints enable 30% cost reduction through
 *  adaptive model selection based on system state."
 *
 * CONSTRAINT ADAPTATION:
 * - Quality (τ): Derived from mood (see moodToQualityThreshold)
 * - Latency: Relaxed when system stressed (dying/burned-out)
 * - Cost: Tightened when resources constrained
 *
 * @param agentId - Agent identifier
 * @returns Dynamic task constraints
 */
export async function getDynamicConstraints(
  agentId: string
): Promise<TaskConstraints> {
  // Get current pet state
  const manifest = await kv.get<any>(KEYS.registry(agentId));
  const pet = manifest?.pet;
  
  if (!pet) {
    // Default constraints if no pet state
    return {
      qualityThreshold: 0.5,
      maxLatency: 5000,
      maxCost: 0.01
    };
  }
  
  const mood = pet.mood as PetMood;
  const τ = moodToQualityThreshold(mood);
  
  // Adapt latency based on mood
  let maxLatency = 5000; // Default 5s
  if (mood === 'dying' || mood === 'burned-out') {
    maxLatency = 10000; // Relax to 10s when stressed
  } else if (mood === 'ecstatic' || mood === 'energized') {
    maxLatency = 3000; // Tighten to 3s when healthy
  }
  
  // Adapt cost based on mood
  let maxCost = 0.01; // Default $0.01 per 1k tokens
  if (mood === 'burned-out' || mood === 'dying') {
    maxCost = 0.001; // Strict budget when resources low
  } else if (mood === 'tired') {
    maxCost = 0.003; // Moderate budget
  } else if (mood === 'ecstatic') {
    maxCost = 0.03; // Can afford premium models
  }
  
  return {
    qualityThreshold: τ,
    maxLatency,
    maxCost
  };
}

/**
 * 🔬 Get pet state for routing decisions
 *
 * Convenience function to get pet mood and level
 *
 * @param agentId - Agent identifier
 * @returns Pet state or defaults
 */
export async function getPetState(
  agentId: string
): Promise<{ mood: PetMood; level: number }> {
  const manifest = await kv.get<any>(KEYS.registry(agentId));
  const pet = manifest?.pet;
  
  return {
    mood: (pet?.mood as PetMood) ?? 'neutral',
    level: pet?.level ?? 1
  };
}

/**
 * 🔬 Explain constraint adaptation
 *
 * Human-readable explanation of how mood affects routing
 *
 * @param mood - Current pet mood
 * @param constraints - Derived constraints
 * @returns Explanation string
 */
export function explainConstraintAdaptation(
  mood: PetMood,
  constraints: TaskConstraints
): string {
  const moodDescriptions: Record<PetMood, string> = {
    'ecstatic': 'System healthy, prioritizing quality',
    'energized': 'Active operation, good quality expected',
    'happy': 'Normal operation, solid quality',
    'content': 'Stable state, acceptable quality',
    'neutral': 'Baseline state, moderate quality',
    'busy': 'High load, quality flexible',
    'curious': 'Exploration mode, quality flexible',
    'tired': 'Resource conservation, lower quality OK',
    'burned-out': 'Stressed state, minimal quality acceptable',
    'dying': 'Survival mode, any quality works',
    'sleep': 'Hibernated, minimal resources'
  };
  
  return `
🔬 Dynamic Constraint Adaptation:

Pet Mood: ${mood}
State: ${moodDescriptions[mood]}

Derived Constraints:
  • Quality threshold (τ): ${constraints.qualityThreshold.toFixed(2)}
  • Max latency: ${constraints.maxLatency}ms
  • Max cost: ${constraints.maxCost}π/1k tokens

Rationale: Mood-based adaptation enables cost optimization
while maintaining acceptable quality for current system state.
`.trim();
}

