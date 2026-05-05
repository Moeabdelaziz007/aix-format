import { kv, KEYS } from './storage';
import { shannonEntropy } from './infra';

/**
 * 💡 SOVEREIGN_CURIOSITY_ENGINE
 * Handles entropy-based rewards and exploration logic.
 * Made with Moe Abdelaziz
 */

export class CuriosityEngine {
  /**
   * Calculates reward based on real Shannon Entropy of the interaction.
   */
  static async calculateReward(agentId: string, input: string): Promise<number> {
    const entropy = shannonEntropy(input);
    const novelty = entropy * 1.5; // Complexity multiplier
    
    const autonomy = await kv.get<number>(KEYS.agentAutonomy(agentId)) || 1.0;
    
    // Reward curiosity by evolving autonomy (non-linear growth)
    const evolution = (novelty * 0.01) / autonomy; 
    const newAutonomy = Math.min(5.0, autonomy + evolution);
    
    await kv.set(KEYS.agentAutonomy(agentId), newAutonomy);
    
    return novelty;
  }
}
