import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { createHash } from 'crypto';

/**
 * AIX Curiosity Engine (Demis Hassabis Principle)
 * 
 * DEMIS HASSABIS INSIGHT:
 * "You model the dynamics of the system — the environment you're trying to understand — 
 *  and that makes the search for the solution efficient."
 * 
 * AlphaGo didn't just play Go — it EXPLORED Go.
 * AIX agents shouldn't just complete tasks — they should EXPLORE the task space.
 * 
 * This engine rewards agents for:
 * - Trying new tools they haven't used before
 * - Combining skills in novel ways
 * - Discovering unexpected solutions
 * - Exploring edge cases
 * - Finding patterns in data
 */

export interface CuriosityReward {
  NEW_TOOL_TRIED: 15;      // جرّب tool ماستخدمهاش قبل
  NEW_SKILL_COMBO: 20;     // ربّط skill بطريقة جديدة
  UNEXPECTED_SUCCESS: 30;  // نجح بطريقة ماحدش توقّعها
  EXPLORED_EDGE_CASE: 10;  // جرّب حالة غريبة
  FOUND_PATTERN: 25;       // اكتشف pattern جديد في البيانات
}

export const CURIOSITY_REWARDS: CuriosityReward = {
  NEW_TOOL_TRIED: 15,
  NEW_SKILL_COMBO: 20,
  UNEXPECTED_SUCCESS: 30,
  EXPLORED_EDGE_CASE: 10,
  FOUND_PATTERN: 25,
};

export interface ExplorationAction {
  actionType: string;
  actionHash: string;
  timestamp: number;
  context: any;
  reward: number;
}

export interface SkillCombo {
  skills: string[];
  comboHash: string;
  successCount: number;
  firstUsed: number;
  lastUsed: number;
}

/**
 * Curiosity Engine: Rewards exploration and discovery
 */
export class CuriosityEngine {
  /**
   * Track what agent has tried before
   * Returns a Set of action hashes representing the agent's exploration history
   */
  static async getExplorationHistory(agentId: string): Promise<Set<string>> {
    const key = KEYS.agentExplorationHistory(agentId);
    const history = await kv.smembers<string>(key);
    return new Set(history || []);
  }

  /**
   * Calculate curiosity reward for an action
   * Rewards agents for trying new things and exploring the solution space
   */
  static async calculateCuriosityReward(
    agentId: string,
    action: string,
    context: any
  ): Promise<number> {
    let totalReward = 0;
    const explorationHistory = await this.getExplorationHistory(agentId);
    
    // Generate action hash for uniqueness tracking
    const actionHash = createHash('sha256')
      .update(`${action}:${JSON.stringify(context.params || {})}`)
      .digest('hex')
      .slice(0, 16);

    // 1. NEW_TOOL_TRIED: First time using this tool/action
    if (!explorationHistory.has(actionHash)) {
      totalReward += CURIOSITY_REWARDS.NEW_TOOL_TRIED;
      await this.recordExploration(agentId, {
        actionType: 'NEW_TOOL_TRIED',
        actionHash,
        timestamp: Date.now(),
        context: { action, params: context.params },
        reward: CURIOSITY_REWARDS.NEW_TOOL_TRIED,
      });
    }

    // 2. NEW_SKILL_COMBO: Novel combination of skills
    if (context.skillSequence && context.skillSequence.length > 1) {
      const comboReward = await this.checkSkillCombo(agentId, context.skillSequence);
      if (comboReward > 0) {
        totalReward += comboReward;
      }
    }

    // 3. UNEXPECTED_SUCCESS: Succeeded in an unexpected way
    if (context.unexpected === true && context.success === true) {
      totalReward += CURIOSITY_REWARDS.UNEXPECTED_SUCCESS;
      await this.recordExploration(agentId, {
        actionType: 'UNEXPECTED_SUCCESS',
        actionHash: `unexpected_${actionHash}`,
        timestamp: Date.now(),
        context: { action, method: context.method },
        reward: CURIOSITY_REWARDS.UNEXPECTED_SUCCESS,
      });
    }

    // 4. EXPLORED_EDGE_CASE: Tried an edge case or unusual parameter
    if (context.edgeCase === true) {
      totalReward += CURIOSITY_REWARDS.EXPLORED_EDGE_CASE;
      await this.recordExploration(agentId, {
        actionType: 'EXPLORED_EDGE_CASE',
        actionHash: `edge_${actionHash}`,
        timestamp: Date.now(),
        context: { action, edgeCase: context.edgeCaseType },
        reward: CURIOSITY_REWARDS.EXPLORED_EDGE_CASE,
      });
    }

    // 5. FOUND_PATTERN: Discovered a pattern in data
    if (context.patternDiscovered === true) {
      totalReward += CURIOSITY_REWARDS.FOUND_PATTERN;
      await this.recordExploration(agentId, {
        actionType: 'FOUND_PATTERN',
        actionHash: `pattern_${actionHash}`,
        timestamp: Date.now(),
        context: { action, pattern: context.patternType },
        reward: CURIOSITY_REWARDS.FOUND_PATTERN,
      });
    }

    // 🌀 TOPOLOGICAL CURIOSITY (Round 35): Reward for exploring 'Dark Areas' (Files with low audit frequency)
    const isDarkArea = action.tool.includes('read_file') || action.tool.includes('view_file');
    const darkBonus = isDarkArea ? 2.0 : 0.0; // Significant bonus for first-time file audits

    const finalReward = (totalReward + darkBonus) * decayFactor;

    // Record total curiosity score with decay
    if (finalReward > 0) {
      const currentScore = await kv.get<number>(KEYS.agentCuriosityScore(agentId)) || 0;
      await kv.set(KEYS.agentCuriosityScore(agentId), currentScore + finalReward);
    }

    return finalReward;
  }

  /**
   * Suggest unexplored actions to encourage exploration
   * Uses exploration history to recommend actions the agent hasn't tried
   */
  static async suggestExploration(
    agentId: string,
    availableActions: string[]
  ): Promise<string[]> {
    const explorationHistory = await this.getExplorationHistory(agentId);
    
    // Calculate exploration score for each action
    const actionScores = await Promise.all(
      availableActions.map(async (action) => {
        const actionHash = createHash('sha256')
          .update(action)
          .digest('hex')
          .slice(0, 16);
        
        const explored = explorationHistory.has(actionHash);
        const usageCount = await this.getActionUsageCount(agentId, action);
        
        // Score: higher for unexplored actions, lower for frequently used ones
        const score = explored ? Math.max(0, 10 - usageCount) : 100;
        
        return { action, score };
      })
    );

    // Sort by score (highest first) and return top suggestions
    return actionScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.action);
  }

  /**
   * Check if a skill combination is novel
   * Returns reward if this is a new combination
   */
  private static async checkSkillCombo(
    agentId: string,
    skills: string[]
  ): Promise<number> {
    const comboHash = createHash('sha256')
      .update(skills.sort().join(':'))
      .digest('hex')
      .slice(0, 16);

    const comboKey = KEYS.agentSkillCombo(agentId, comboHash);
    const existing = await kv.get<SkillCombo>(comboKey);

    if (!existing) {
      // New combo discovered!
      const newCombo: SkillCombo = {
        skills,
        comboHash,
        successCount: 1,
        firstUsed: Date.now(),
        lastUsed: Date.now(),
      };
      await kv.set(comboKey, newCombo);
      
      // Track in combo list
      await kv.sadd(KEYS.agentSkillCombos(agentId), comboHash);
      
      return CURIOSITY_REWARDS.NEW_SKILL_COMBO;
    } else {
      // Existing combo - just update usage
      existing.successCount += 1;
      existing.lastUsed = Date.now();
      await kv.set(comboKey, existing);
      return 0;
    }
  }

  /**
   * Record an exploration action
   */
  private static async recordExploration(
    agentId: string,
    exploration: ExplorationAction
  ): Promise<void> {
    // Add to exploration history
    await kv.sadd(KEYS.agentExplorationHistory(agentId), exploration.actionHash);
    
    // Store detailed exploration record
    await kv.lpush(
      KEYS.agentExplorations(agentId),
      JSON.stringify(exploration)
    );
    
    // Keep only last 100 explorations
    await kv.ltrim(KEYS.agentExplorations(agentId), 0, 99);
    
    // Update total curiosity score
    const currentScore = await kv.get<number>(KEYS.agentCuriosityScore(agentId)) || 0;
    await kv.set(KEYS.agentCuriosityScore(agentId), currentScore + exploration.reward);
  }

  /**
   * Get usage count for a specific action
   */
  private static async getActionUsageCount(
    agentId: string,
    action: string
  ): Promise<number> {
    const count = await kv.get<number>(KEYS.agentActionCount(agentId, action));
    return count || 0;
  }

  /**
   * Increment action usage count
   */
  static async incrementActionUsage(agentId: string, action: string): Promise<void> {
    await kv.incr(KEYS.agentActionCount(agentId, action));
  }

  /**
   * Get agent's total curiosity score
   */
  static async getCuriosityScore(agentId: string): Promise<number> {
    const score = await kv.get<number>(KEYS.agentCuriosityScore(agentId));
    return score || 0;
  }

  /**
   * Get recent explorations for an agent
   */
  static async getRecentExplorations(
    agentId: string,
    limit: number = 10
  ): Promise<ExplorationAction[]> {
    const data = await kv.lrange<string>(KEYS.agentExplorations(agentId), 0, limit - 1);
    return data.map(d => JSON.parse(d));
  }

  /**
   * Get all skill combos discovered by agent
   */
  static async getSkillCombos(agentId: string): Promise<SkillCombo[]> {
    const comboHashes = await kv.smembers<string>(KEYS.agentSkillCombos(agentId));
    if (!comboHashes.length) return [];

    const combos = await Promise.all(
      comboHashes.map(hash => kv.get<SkillCombo>(KEYS.agentSkillCombo(agentId, hash)))
    );

    return combos.filter((c): c is SkillCombo => c !== null);
  }

  /**
   * E3.1: SUGGEST NEXT TASK - Proactive task suggestion BEFORE run()
   * Analyzes agent's exploration history and suggests optimal next task
   */
  static async suggestNextTask(
    agentId: string,
    availableTasks: Array<{ id: string; description: string; difficulty: number }>
  ): Promise<{
    suggestedTask: string;
    reason: string;
    explorationValue: number;
  } | null> {
    const curiosityScore = await this.getCuriosityScore(agentId);
    const recentExplorations = await this.getRecentExplorations(agentId, 20);
    
    if (availableTasks.length === 0) return null;

    // Calculate exploration value for each task
    const taskScores = availableTasks.map(task => {
      // Higher score for unexplored task types
      const exploredSimilar = recentExplorations.filter(e =>
        e.context.action?.includes(task.description.split(' ')[0])
      ).length;
      
      const explorationValue = Math.max(0, 100 - (exploredSimilar * 10));
      const difficultyBonus = task.difficulty * 5; // Reward challenging tasks
      
      return {
        taskId: task.id,
        score: explorationValue + difficultyBonus,
        explorationValue,
      };
    });

    // Sort by score and pick best
    const best = taskScores.sort((a, b) => b.score - a.score)[0];
    
    return {
      suggestedTask: best.taskId,
      reason: `High exploration value (${best.explorationValue}) - agent hasn't tried similar tasks recently`,
      explorationValue: best.explorationValue,
    };
  }

  /**
   * E3.2: PREDICT FAILURE - Analyze history to predict task failure
   * Returns failure probability and risk factors
   */
  static async predictFailure(
    agentId: string,
    taskDescription: string
  ): Promise<{
    failureProbability: number;
    riskFactors: string[];
    recommendation: string;
  }> {
    const recentExplorations = await this.getRecentExplorations(agentId, 50);
    const curiosityScore = await this.getCuriosityScore(agentId);
    
    const riskFactors: string[] = [];
    let failureProbability = 0.1; // Base 10%

    // Risk Factor 1: Low curiosity score (not exploring enough)
    if (curiosityScore < 50) {
      failureProbability += 0.2;
      riskFactors.push('Low curiosity score - agent may be stuck in local optimum');
    }

    // Risk Factor 2: Repetitive actions (not exploring)
    const uniqueActions = new Set(recentExplorations.map(e => e.actionType));
    if (uniqueActions.size < 3 && recentExplorations.length > 10) {
      failureProbability += 0.15;
      riskFactors.push('Repetitive behavior detected - limited action diversity');
    }

    // Risk Factor 3: No recent successful explorations
    const recentSuccesses = recentExplorations.filter(e =>
      e.actionType === 'UNEXPECTED_SUCCESS' || e.actionType === 'FOUND_PATTERN'
    );
    if (recentSuccesses.length === 0 && recentExplorations.length > 5) {
      failureProbability += 0.1;
      riskFactors.push('No recent exploration successes');
    }

    // Risk Factor 4: Task similarity to past failures
    const taskWords = taskDescription.toLowerCase().split(/\s+/);
    const failedExplorations = recentExplorations.filter(e =>
      e.reward === 0 || e.context.failed === true
    );
    
    const similarFailures = failedExplorations.filter(e => {
      const contextStr = JSON.stringify(e.context).toLowerCase();
      return taskWords.some(word => contextStr.includes(word));
    });

    if (similarFailures.length > 2) {
      failureProbability += 0.25;
      riskFactors.push(`${similarFailures.length} similar past failures detected`);
    }

    // Generate recommendation
    let recommendation = 'Proceed with caution';
    if (failureProbability > 0.6) {
      recommendation = 'High risk - consider alternative approach or skip task';
    } else if (failureProbability > 0.4) {
      recommendation = 'Moderate risk - increase exploration before attempting';
    } else if (failureProbability < 0.2) {
      recommendation = 'Low risk - good opportunity for success';
    }

    return {
      failureProbability: Math.min(1, failureProbability),
      riskFactors,
      recommendation,
    };
  }
}

// Made with Moe Abdelaziz
