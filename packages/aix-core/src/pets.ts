import { kv, KEYS } from './index';
import { PetConfig } from '@studio-types'; // Assuming we can reach types

/**
 * AIX Pet Orchestrator (v1.3.5)
 * Manages the evolution and state of agent personas.
 * @example
 * await PetOrchestrator.settle("agent-1");
 */
export class PetOrchestrator {
  /**
   * Syncs pet state and mood based on activity.
   * @param {string} agentId - The agent identifier.
   * @param {any} pet - The pet state.
   * @param {any} manifest - The agent manifest.
   * @returns {Promise<void>} Resolves when sync is complete.
   * @example
   * await PetOrchestrator.sync("agent-1", petData, manifest);
   */
  static async sync(agentId: string, pet: any, manifest: any): Promise<void> {
    // 1. Update Mood based on frequency
    const recentInvocations = (await kv.incr(`agent:${agentId}:freq`)) || 1;
    await kv.expire(`agent:${agentId}:freq`, 60); // Reset frequency window every minute
    
    if (recentInvocations > 5) {
      pet.mood = 'energized';
    } else {
      pet.mood = 'busy';
    }
    
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
   * @param {string} agentId - The agent identifier.
   * @returns {Promise<void>} Resolves when settled.
   * @example
   * await PetOrchestrator.settle("agent-1");
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
   * @param {string} agentId - The agent identifier.
   * @returns {Promise<boolean>} True if Sleep Mode was entered.
   * @example
   * const isSleeping = await PetOrchestrator.checkSleepMode("agent-1");
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

