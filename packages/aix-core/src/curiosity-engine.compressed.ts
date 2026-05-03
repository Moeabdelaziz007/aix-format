import { kv } from './storage/adapter';
import { createHash } from 'crypto';

/**
 * AIX Curiosity Engine (Demis Hassabis - AlphaGo Exploration Principle)
 * Rewards agents for trying new tools, novel combinations, and discovering patterns
 */

const REWARDS = {
  NEW_TOOL_TRIED: 15,
  NEW_SKILL_COMBO: 20,
  UNEXPECTED_SUCCESS: 30,
  EXPLORED_EDGE_CASE: 10,
  FOUND_PATTERN: 25,
} as const;

type RewardType = keyof typeof REWARDS;

interface ExplorationAction {
  actionType: RewardType;
  actionHash: string;
  timestamp: number;
  context: any;
  reward: number;
}

interface SkillCombo {
  skills: string[];
  comboHash: string;
  successCount: number;
  firstUsed: number;
  lastUsed: number;
}

// Utility: Generate hash (DRY principle)
const hash = (data: string) => createHash('sha256').update(data).digest('hex').slice(0, 16);

export class CuriosityEngine {
  // Get exploration history
  static async getExplorationHistory(agentId: string): Promise<Set<string>> {
    return new Set(await kv.smembers<string>(KEYS.agentExplorationHistory(agentId)) || []);
  }

  // Calculate curiosity reward (array-driven instead of 5 if-blocks)
  static async calculateCuriosityReward(agentId: string, action: string, context: any): Promise<number> {
    const history = await this.getExplorationHistory(agentId);
    const actionHash = hash(`${action}:${JSON.stringify(context.params || {})}`);
    
    // Define reward conditions (data-driven)
    const checks: Array<{type: RewardType, condition: boolean, hash?: string, ctx?: any}> = [
      { type: 'NEW_TOOL_TRIED', condition: !history.has(actionHash), hash: actionHash, ctx: {action, params: context.params} },
      { type: 'UNEXPECTED_SUCCESS', condition: context.unexpected && context.success, hash: `unexpected_${actionHash}`, ctx: {action, method: context.method} },
      { type: 'EXPLORED_EDGE_CASE', condition: context.edgeCase, hash: `edge_${actionHash}`, ctx: {action, edgeCase: context.edgeCaseType} },
      { type: 'FOUND_PATTERN', condition: context.patternDiscovered, hash: `pattern_${actionHash}`, ctx: {action, pattern: context.patternType} },
    ];

    // Process all checks
    let total = 0;
    for (const {type, condition, hash: h, ctx} of checks) {
      if (condition) {
        total += REWARDS[type];
        await this.recordExploration(agentId, {actionType: type, actionHash: h!, timestamp: Date.now(), context: ctx, reward: REWARDS[type]});
      }
    }

    // Check skill combo separately (needs async)
    if (context.skillSequence?.length > 1) {
      const comboReward = await this.checkSkillCombo(agentId, context.skillSequence);
      if (comboReward > 0) {
        total += comboReward;
      }
    }

    return total;
  }

  // Suggest unexplored actions (composition-based)
  static async suggestExploration(agentId: string, availableActions: string[]): Promise<string[]> {
    const history = await this.getExplorationHistory(agentId);
    
    const scores = await Promise.all(
      availableActions.map(async action => ({
        action,
        score: history.has(hash(action)) 
          ? Math.max(0, 10 - (await kv.get<number>(KEYS.agentActionCount(agentId, action)) || 0))
          : 100
      }))
    );

    return scores.sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.action);
  }

  // Check skill combo (simplified)
  private static async checkSkillCombo(agentId: string, skills: string[]): Promise<number> {
    const comboHash = hash(skills.sort().join(':'));
    const key = KEYS.agentSkillCombo(agentId, comboHash);
    const existing = await kv.get<SkillCombo>(key);

    if (!existing) {
      await kv.set(key, {skills, comboHash, successCount: 1, firstUsed: Date.now(), lastUsed: Date.now()});
      await kv.sadd(KEYS.agentSkillCombos(agentId), comboHash);
      return REWARDS.NEW_SKILL_COMBO;
    }
    
    await kv.set(key, {...existing, successCount: existing.successCount + 1, lastUsed: Date.now()});
    return 0;
  }

  // Record exploration (batched kv operations)
  private static async recordExploration(agentId: string, exp: ExplorationAction): Promise<void> {
    const [currentScore] = await Promise.all([
      kv.get<number>(KEYS.agentCuriosityScore(agentId)),
      kv.sadd(KEYS.agentExplorationHistory(agentId), exp.actionHash),
      kv.lpush(KEYS.agentExplorations(agentId), JSON.stringify(exp)),
      kv.ltrim(KEYS.agentExplorations(agentId), 0, 99),
    ]);
    await kv.set(KEYS.agentCuriosityScore(agentId), (currentScore || 0) + exp.reward);
  }

  // Simple getters (one-liners)
  static incrementActionUsage = (agentId: string, action: string) => kv.incr(KEYS.agentActionCount(agentId, action));
  static getCuriosityScore = async (agentId: string) => await kv.get<number>(KEYS.agentCuriosityScore(agentId)) || 0;
  
  static async getRecentExplorations(agentId: string, limit = 10): Promise<ExplorationAction[]> {
    return (await kv.lrange<string>(KEYS.agentExplorations(agentId), 0, limit - 1)).map(d => JSON.parse(d));
  }

  static async getSkillCombos(agentId: string): Promise<SkillCombo[]> {
    const hashes = await kv.smembers<string>(KEYS.agentSkillCombos(agentId)) || [];
    const combos = await Promise.all(hashes.map(h => kv.get<SkillCombo>(KEYS.agentSkillCombo(agentId, h))));
    return combos.filter((c): c is SkillCombo => c !== null);
  }
}

// Made with Bob