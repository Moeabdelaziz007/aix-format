import { kv, KEYS } from './index';
import { PetConfig } from '@studio-types'; // Assuming we can reach types
import { ExpectationEngine } from './expectation-engine';
import { CuriosityEngine } from './curiosity-engine';

/**
 * AIX Pet Orchestrator (v1.4.0 - Philosophical Enhancement)
 * Manages the evolution and state of agent personas.
 *
 * Enhanced with Philosophical Engines:
 * - Task success/failure (existing) - 40%
 * - Happiness from expectations (Mo Gawdat) - 30%
 * - Curiosity satisfaction (Demis Hassabis) - 30%
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
    const recentInvocations = (await kv.incr(`agent:${agentId}:freq`)) || 1;
    await kv.expire(`agent:${agentId}:freq`, 60); // Reset frequency window every minute
    
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

    console.log(`[Pet] Agent ${agentId} mood: ${pet.mood} (activity: ${activityMood}, happiness: ${happinessMood}, curiosity: ${curiosityMood})`);
    
    // 2. Progression (Simple Leveling)
    const currentExp = (await kv.incr(`agent:${agentId}:exp`)) || 1;
    const levelThreshold = pet.level * 10;
    
    if (currentExp >= levelThreshold) {
      pet.level += 1;
      await kv.set(`agent:${agentId}:exp`, 0); // Reset for next level
      
      // Reward with accessory at Level 5
      if (pet.level === 5) {
        pet.accessories = [...(pet.accessories || []), 'lightning_bolt'];
      }
      
      console.log(`[Pet] Agent ${agentId} evolved to Level ${pet.level}!`);
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
    await kv.set(`agent:${agentId}:last_activity`, Date.now());

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
    const lastActivity = await kv.get<number>(`agent:${agentId}:last_activity`) || 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (Date.now() - lastActivity > sevenDays) {
      const manifest = await kv.get<any>(KEYS.registry(agentId));
      if (manifest && manifest.pet && manifest.pet.mood !== 'sleep') {
        manifest.pet.mood = 'sleep';
        manifest.status = 'hibernated';
        await kv.set(KEYS.registry(agentId), manifest);
        console.log(`[Pet] Agent ${agentId} entered Sleep Mode 💤`);
      }
      return true;
    }
    return false;
  }
}

