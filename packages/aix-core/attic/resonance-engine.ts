/**
 * RESONANCE ENGINE - Nikola Tesla's Frequency Matching
 * 
 * "If you want to find the secrets of the universe, 
 *  think in terms of energy, frequency and vibration."
 * 
 * Every agent has a NATURAL FREQUENCY - tasks they excel at.
 * When you match task frequency to agent frequency → performance amplifies.
 * 
 * This is NOT capability matching - it's RESONANCE matching.
 * Capability: "I can do it"
 * Resonance: "I was BORN to do it"
 */

import { kv } from './storage/adapter';

export interface AgentResonance {
  agentId: string;
  frequencies: Record<string, number>;  // task_type → resonance_score (0-1)
  peakFrequency: string;                // The ONE thing this agent excels at
  harmonics: string[];                  // Related tasks that also resonate
  amplification: number;                // Performance multiplier at peak (1.5-3x)
  lastUpdated: number;
}

export interface TaskPerformance {
  taskId: string;
  taskType: string;
  agentId: string;
  success: boolean;
  duration: number;        // milliseconds
  quality: number;         // 0-1 score
  timestamp: number;
}

export class ResonanceEngine {
  private static readonly PERFORMANCE_KEY = 'resonance:performance';
  private static readonly RESONANCE_KEY = 'resonance:agents';
  private static readonly MIN_SAMPLES = 3;  // Minimum tasks to compute resonance
  private static readonly DECAY_FACTOR = 0.95;  // Recent performance weighted more

  /**
   * Record task performance for resonance calculation
   */
  static async recordPerformance(performance: TaskPerformance): Promise<void> {
    const key = `${this.PERFORMANCE_KEY}:${performance.agentId}:${performance.taskType}`;
    
    await kv.lpush(key, JSON.stringify(performance));
    
    // Keep last 100 performances per agent-task pair
    await kv.ltrim(key, 0, 99);
    
    // Trigger resonance recomputation
    await this.computeResonance(performance.agentId);
  }

  /**
   * Compute agent's natural frequency from task history
   */
  static async computeResonance(agentId: string): Promise<AgentResonance> {
    const taskTypes = await this.getAgentTaskTypes(agentId);
    const frequencies: Record<string, number> = {};
    
    for (const taskType of taskTypes) {
      const resonance = await this.calculateTaskResonance(agentId, taskType);
      if (resonance > 0) {
        frequencies[taskType] = resonance;
      }
    }

    // Find peak frequency (highest resonance)
    let peakFrequency = '';
    let maxResonance = 0;
    
    for (const [taskType, resonance] of Object.entries(frequencies)) {
      if (resonance > maxResonance) {
        maxResonance = resonance;
        peakFrequency = taskType;
      }
    }

    // Find harmonics (similar frequencies within 20% of peak)
    const harmonics = Object.entries(frequencies)
      .filter(([type, res]) => type !== peakFrequency && res >= maxResonance * 0.8)
      .map(([type]) => type);
    // Amplification: 1.5x to 3x based on peak resonance
    const amplification = 1.5 + (maxResonance * 1.5);

    const resonance: AgentResonance = {
      agentId,
      frequencies,
      peakFrequency,
      harmonics,
      amplification,
      lastUpdated: Date.now()
    };

    // Store computed resonance
    await kv.set(`${this.RESONANCE_KEY}:${agentId}`, resonance);
    
    return resonance;
  }

  /**
   * Calculate resonance for specific task type
   * Formula: (success_rate × 0.3) + (speed × 0.2) + (consistency × 0.2) + (recency × 0.3)
   */
  private static async calculateTaskResonance(agentId: string, taskType: string): Promise<number> {
    const key = `${this.PERFORMANCE_KEY}:${agentId}:${taskType}`;
    const performances = await kv.lrange<string>(key, 0, -1);
    
    if (performances.length < this.MIN_SAMPLES) {
      return 0;
    }

    const parsed = performances.map(p => JSON.parse(p) as TaskPerformance);
    
    // 1. Success Rate (0-1)
    const successCount = parsed.filter(p => p.success).length;
    const successRate = successCount / parsed.length;
    
    // 2. Speed Score (0-1) - faster is better, normalized against 10 second baseline
    const avgDuration = parsed.reduce((sum, p) => sum + p.duration, 0) / parsed.length;
    const speedScore = Math.max(0, Math.min(1, 1 - (avgDuration / 10000)));
    
    // 3. Consistency Score (0-1) - based on quality variance
    const avgQuality = parsed.reduce((sum, p) => sum + p.quality, 0) / parsed.length;
    const qualityVariance = parsed.reduce((sum, p) => sum + Math.pow(p.quality - avgQuality, 2), 0) / parsed.length;
    const consistencyScore = Math.max(0, 1 - qualityVariance);
    
    // 4. Recency Score (0-1) - recent activity is better
    const latestTimestamp = Math.max(...parsed.map(p => p.timestamp));
    const hoursSinceLatest = (Date.now() - latestTimestamp) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, Math.min(1, 1 - (hoursSinceLatest / 168))); // 7 days = 0
    
    // Calculate weighted resonance
    const resonance = 
      (successRate * 0.3) +
      (speedScore * 0.2) +
      (consistencyScore * 0.2) +
      (recencyScore * 0.3);
    
    return resonance;
  }

  /**
   * Get all task types an agent has performed
   */
  private static async getAgentTaskTypes(agentId: string): Promise<string[]> {
    // Scan for all performance keys for this agent
    // In production, maintain a set of task types per agent
    const taskTypesKey = KEYS.agentResonanceTaskTypes(agentId);
    return await kv.smembers<string>(taskTypesKey);
  }

  /**
   * Get agent's resonance profile
   */
  static async getResonance(agentId: string): Promise<AgentResonance | null> {
    return await kv.get<AgentResonance>(`${this.RESONANCE_KEY}:${agentId}`);
  }

  /**
   * Find best agent for a task based on resonance
   */
  static async findResonantAgent(agentIds: string[], taskType: string): Promise<{
    agentId: string;
    resonance: AgentResonance;
    score: number;
  } | null> {
    if (agentIds.length === 0) return null;

    const candidates = await Promise.all(
      agentIds.map(async (agentId) => {
        const resonance = await this.getResonance(agentId);
        if (!resonance) return null;

        const score = resonance.frequencies[taskType] || 0;
        return { agentId, resonance, score };
      })
    );

    const valid = candidates.filter((c): c is NonNullable<typeof c> => c !== null && c.score > 0);
    
    if (valid.length === 0) return null;

    // Sort by score (highest first)
    valid.sort((a, b) => b.score - a.score);


    return valid[0];
  }

  /**
   * Track task type for an agent (call when recording performance)
   */
  static async trackTaskType(agentId: string, taskType: string): Promise<void> {
    const taskTypesKey = KEYS.agentResonanceTaskTypes(agentId);
    await kv.sadd(taskTypesKey, taskType);
  }

  /**
   * Get resonance leaderboard for a task type
   */
  static async getLeaderboard(taskType: string, agentIds: string[], limit: number = 10): Promise<Array<{
    agentId: string;
    score: number;
    amplification: number;
  }>> {
    const scores = await Promise.all(
      agentIds.map(async (agentId) => {
        const resonance = await this.getResonance(agentId);
        if (!resonance) return null;

        const score = resonance.frequencies[taskType] || 0;
        return {
          agentId,
          score,
          amplification: resonance.amplification
        };
      })
    );

    return scores
      .filter((s): s is NonNullable<typeof s> => s !== null && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

