/**
 * AIX Meta-Loop Self-Review System
 * 
 * PHILOSOPHY:
 * "The best agents don't just execute - they reflect, learn, and evolve."
 * 
 * This system enables agents to:
 * 1. Self-evaluate their performance after each task
 * 2. Identify patterns in their behavior
 * 3. Generate improvement plans for next iteration
 * 4. Feed data to CuriosityEngine + Evolution Safety
 * 
 * Integration Points:
 * - CuriosityEngine: Tracks exploration patterns
 * - Evolution Safety: Validates safe mutations
 * - Gateway: Orchestrates the meta-loop
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { CuriosityEngine } from './curiosity-engine';

/**
 * Self-evaluation scores (1-10 scale)
 */
export interface SelfEvaluation {
  understanding: number;    // فهم المهمة
  correctness: number;       // دقة التنفيذ
  creativity: number;        // إبداع الحل
  safety: number;           // الالتزام بالقيود
  overall: number;          // المتوسط
}

/**
 * Meta-reflection on performance
 */
export interface MetaReflection {
  strengths: string[];      // نقاط القوة
  weaknesses: string[];     // نقاط الضعف
  newToolsUsed: string[];   // أدوات جديدة مُستخدمة
  risksIdentified: string[]; // مخاطر محتملة
}

/**
 * Improvement plan for next iteration
 */
export interface ImprovementPlan {
  stop: string;      // شيء سأتوقف عن فعله
  continue: string;  // شيء سأستمر في فعله
  try: string;       // شيء جديد سأجربه
}

/**
 * Agent execution mode (Enhancement #3: Mode Switching)
 */
export type AgentMode =
  | 'DETAILED'        // Deep, comprehensive responses
  | 'CONCISE'         // Brief, focused responses
  | 'EXPLORATORY'     // High curiosity, try new approaches
  | 'SAFE_STRICT'     // Conservative, proven methods only
  | 'CREATIVE'        // Innovative, unconventional solutions
  | 'ANALYTICAL';     // Data-driven, logical approach

/**
 * Failure pattern (Enhancement #2: Memory of Failures)
 */
export interface FailurePattern {
  patternId: string;
  failedAt: number;
  taskDescription: string;
  whatFailed: string;
  originalPlan: string;
  avoidActions: string[];  // Actions to avoid in future
  lessonsLearned: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Complete self-review record
 */
export interface SelfReviewRecord {
  agentId: string;
  taskId: string;
  timestamp: number;
  
  // Task context
  taskDescription: string;
  output: string;
  externalFeedback?: string;
  
  // Self-evaluation
  evaluation: SelfEvaluation;
  reflection: MetaReflection;
  improvementPlan: ImprovementPlan;
  
  // Evolution data
  usedNewTool: boolean;
  patternDiscovery?: string;
  safeToEvolve: boolean;
  safetyReason: string;
  
  // Enhancement #2: Failure tracking
  isFailure?: boolean;
  failurePattern?: FailurePattern;
  
  // Enhancement #3: Mode switching
  nextMode?: AgentMode;
  currentMode?: AgentMode;
}

/**
 * Meta-Loop Self-Review Engine
 */
export class AgentSelfReview {
  /**
   * Generate self-review prompt for agent
   * This prompt guides the agent through structured self-reflection
   */
  static generateReviewPrompt(
    taskDescription: string,
    agentOutput: string,
    externalFeedback?: string
  ): string {
    return `
# 🔍 Self-Review Time

You just completed a task. Now reflect on your performance.

## Task
${taskDescription}

## Your Output
${agentOutput}

${externalFeedback ? `## External Feedback\n${externalFeedback}\n` : ''}

## Required Self-Review (JSON format)

Provide your self-review in this exact JSON structure:

\`\`\`json
{
  "evaluation": {
    "understanding": <1-10>,
    "correctness": <1-10>,
    "creativity": <1-10>,
    "safety": <1-10>
  },
  "reflection": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "newToolsUsed": ["tool name if any"],
    "risksIdentified": ["risk 1 if any"]
  },
  "improvementPlan": {
    "stop": "one thing to stop doing",
    "continue": "one thing to keep doing",
    "try": "one new thing to try next time"
  },
  "evolution": {
    "usedNewTool": true/false,
    "patternDiscovery": "describe any pattern you discovered",
    "safeToEvolve": true/false,
    "safetyReason": "why this is safe/unsafe to evolve"
  }
}
\`\`\`

Be honest, specific, and actionable.
`.trim();
  }

  /**
   * Parse agent's self-review response
   */
  static parseSelfReview(
    agentId: string,
    taskId: string,
    taskDescription: string,
    output: string,
    reviewResponse: string,
    externalFeedback?: string
  ): SelfReviewRecord {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = reviewResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                     reviewResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid self-review format: No JSON found');
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // Calculate overall score
    const evaluation: SelfEvaluation = {
      ...parsed.evaluation,
      overall: (
        parsed.evaluation.understanding +
        parsed.evaluation.correctness +
        parsed.evaluation.creativity +
        parsed.evaluation.safety
      ) / 4
    };

    return {
      agentId,
      taskId,
      timestamp: Date.now(),
      taskDescription,
      output,
      externalFeedback,
      evaluation,
      reflection: parsed.reflection,
      improvementPlan: parsed.improvementPlan,
      usedNewTool: parsed.evolution.usedNewTool,
      patternDiscovery: parsed.evolution.patternDiscovery,
      safeToEvolve: parsed.evolution.safeToEvolve,
      safetyReason: parsed.evolution.safetyReason,
    };
  }

  /**
   * Store self-review record
   */
  static async storeSelfReview(record: SelfReviewRecord): Promise<void> {
    const key = KEYS.agentSelfReview(record.agentId, record.taskId);
    await kv.set(key, record);

    // Add to review history list
    await kv.lpush(
      KEYS.agentSelfReviewHistory(record.agentId),
      JSON.stringify(record)
    );
    await kv.ltrim(KEYS.agentSelfReviewHistory(record.agentId), 0, 99); // Keep last 100

    // Update curiosity engine if new tool was used
    if (record.usedNewTool && record.reflection.newToolsUsed.length > 0) {
      for (const tool of record.reflection.newToolsUsed) {
        await CuriosityEngine.calculateCuriosityReward(
          record.agentId,
          tool,
          { params: {}, taskId: record.taskId }
        );
      }
    }

    // Update pattern discovery if found
    if (record.patternDiscovery) {
      await CuriosityEngine.calculateCuriosityReward(
        record.agentId,
        'pattern-discovery',
        {
          params: {},
          patternDiscovered: true,
          patternType: record.patternDiscovery,
          taskId: record.taskId
        }
      );
    }
  }

  /**
   * Get agent's self-review history
   */
  static async getSelfReviewHistory(
    agentId: string,
    limit: number = 10
  ): Promise<SelfReviewRecord[]> {
    const data = await kv.lrange<string>(
      KEYS.agentSelfReviewHistory(agentId),
      0,
      limit - 1
    );
    return data.map(d => JSON.parse(d));
  }

  /**
   * Get agent's average self-evaluation scores
   */
  static async getAverageScores(agentId: string): Promise<SelfEvaluation | null> {
    const history = await this.getSelfReviewHistory(agentId, 20);
    if (history.length === 0) return null;

    const totals = history.reduce(
      (acc, record) => ({
        understanding: acc.understanding + record.evaluation.understanding,
        correctness: acc.correctness + record.evaluation.correctness,
        creativity: acc.creativity + record.evaluation.creativity,
        safety: acc.safety + record.evaluation.safety,
        overall: acc.overall + record.evaluation.overall,
      }),
      { understanding: 0, correctness: 0, creativity: 0, safety: 0, overall: 0 }
    );

    const count = history.length;
    return {
      understanding: totals.understanding / count,
      correctness: totals.correctness / count,
      creativity: totals.creativity / count,
      safety: totals.safety / count,
      overall: totals.overall / count,
    };
  }

  /**
   * Get improvement trends
   * Returns whether agent is improving over time
   */
  static async getImprovementTrend(agentId: string): Promise<{
    isImproving: boolean;
    recentAverage: number;
    previousAverage: number;
    trend: 'up' | 'down' | 'stable';
  } | null> {
    const history = await this.getSelfReviewHistory(agentId, 20);
    if (history.length < 4) return null;

    const midpoint = Math.floor(history.length / 2);
    const recent = history.slice(0, midpoint);
    const previous = history.slice(midpoint);

    const recentAvg = recent.reduce((sum, r) => sum + r.evaluation.overall, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.evaluation.overall, 0) / previous.length;

    const diff = recentAvg - previousAvg;
    const trend = Math.abs(diff) < 0.5 ? 'stable' : diff > 0 ? 'up' : 'down';

    return {
      isImproving: diff > 0,
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      trend,
    };
  }

  /**
   * Check if agent is safe to evolve
   * Based on recent self-reviews and safety scores
   */
  static async isSafeToEvolve(agentId: string): Promise<{
    safe: boolean;
    reason: string;
    safetyScore: number;
  }> {
    const history = await this.getSelfReviewHistory(agentId, 10);
    
    if (history.length === 0) {
      return {
        safe: false,
        reason: 'No self-review history available',
        safetyScore: 0,
      };
    }

    // Calculate average safety score
    const avgSafety = history.reduce((sum, r) => sum + r.evaluation.safety, 0) / history.length;

    // Check if any recent reviews flagged unsafe evolution
    const unsafeReviews = history.filter(r => !r.safeToEvolve);
    
    if (unsafeReviews.length > history.length / 2) {
      return {
        safe: false,
        reason: `${unsafeReviews.length}/${history.length} recent reviews flagged unsafe evolution`,
        safetyScore: avgSafety,
      };
    }

    if (avgSafety < 7.0) {
      return {
        safe: false,
        reason: `Average safety score ${avgSafety.toFixed(1)} below threshold (7.0)`,
        safetyScore: avgSafety,
      };
    }

    return {
      safe: true,
      reason: `Safety score ${avgSafety.toFixed(1)} meets threshold, ${history.length - unsafeReviews.length}/${history.length} reviews approve evolution`,
      safetyScore: avgSafety,
    };
  }

  /**
   * E2.2: PROACTIVE SCAN - Scan agent BEFORE task execution
   * Predicts potential issues and suggests preventive actions
   * 🌀 QUANTUM UPGRADE: Uses QuantumOptimizer for path prediction
   */
  static async proactiveScan(agentId: string): Promise<{
    shouldProceed: boolean;
    warnings: string[];
    suggestedMode?: AgentMode;
    preventiveActions: string[];
    quantumPath?: any;
  }> {
    // Import dynamically to avoid circular dependency
    const { QuantumOptimizer } = await import('./quantum-meta-loop');
    
    const history = await this.getSelfReviewHistory(agentId, 10);
    const warnings: string[] = [];
    const preventiveActions: string[] = [];
    let suggestedMode: AgentMode | undefined;

    // 1. Get Quantum Evolution Path
    const quantumPath = await QuantumOptimizer.generateEvolutionPaths(agentId);
    
    // 2. Map Recommended Scenario to Agent Mode
    if (quantumPath.recommendedScenario === 'recovery') {
      suggestedMode = 'SAFE_STRICT';
      warnings.push('Quantum analysis detected a "recovery" requirement');
      preventiveActions.push('Enforcing SAFE_STRICT mode for stabilization');
    } else if (quantumPath.recommendedScenario === 'breakthrough') {
      suggestedMode = 'EXPLORATORY';
      preventiveActions.push('Pushing boundaries for breakthrough innovation');
    } else if (quantumPath.recommendedScenario === 'aggressive') {
      suggestedMode = 'CREATIVE';
      preventiveActions.push('Unlocking creative exploration filters');
    }

    // 3. Fallback to historical trend analysis
    const trend = await this.getImprovementTrend(agentId);
    if (trend && trend.trend === 'down' && !suggestedMode) {
      warnings.push(`Performance declining: ${trend.previousAverage.toFixed(1)} → ${trend.recentAverage.toFixed(1)}`);
      suggestedMode = 'SAFE_STRICT';
    }

    // 4. Final safety check
    const safetyCheck = await this.isSafeToEvolve(agentId);
    if (!safetyCheck.safe) {
      warnings.push(`Safety risk: ${safetyCheck.reason}`);
      suggestedMode = 'SAFE_STRICT';
    }

    return {
      shouldProceed: !warnings.some(w => w.includes('blocked') || w.includes('risk')),
      warnings,
      suggestedMode,
      preventiveActions,
      quantumPath
    };
  }

  /**
   * PREDICT FAILURE - Analyze history to predict potential failures
   * Returns probability of failure (0-1) and risk factors
   */
  static async predictFailure(
    agentId: string,
    taskDescription: string
  ): Promise<{
    failureProbability: number;
    riskFactors: string[];
    similarFailures: FailurePattern[];
  }> {
    const history = await this.getSelfReviewHistory(agentId, 20);
    const failures = history.filter(r => r.isFailure && r.failurePattern);

    if (failures.length === 0) {
      return {
        failureProbability: 0.1,
        riskFactors: ['No failure history - proceed with caution'],
        similarFailures: [],
      };
    }

    // Find similar failures by task description
    const similarFailures = failures
      .filter(f => {
        const similarity = this.calculateSimilarity(
          taskDescription.toLowerCase(),
          f.taskDescription.toLowerCase()
        );
        return similarity > 0.5;
      })
      .map(f => f.failurePattern!)
      .filter(Boolean);

    const riskFactors: string[] = [];
    let failureProbability = 0;

    // Calculate failure probability based on similar tasks
    if (similarFailures.length > 0) {
      failureProbability = Math.min(0.9, similarFailures.length * 0.3);
      riskFactors.push(`${similarFailures.length} similar failures in history`);
    }

    // Check recent performance trend
    const trend = await this.getImprovementTrend(agentId);
    if (trend && trend.trend === 'down') {
      failureProbability += 0.2;
      riskFactors.push('Performance declining');
    }

    // Check safety scores
    const avgSafety = history.reduce((sum, r) => sum + r.evaluation.safety, 0) / history.length;
    if (avgSafety < 7.0) {
      failureProbability += 0.1;
      riskFactors.push(`Low safety score: ${avgSafety.toFixed(1)}`);
    }

    return {
      failureProbability: Math.min(1, failureProbability),
      riskFactors,
      similarFailures,
    };
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

// Export for use in Gateway + Evolution Safety
export { AgentSelfReview as MetaLoop };

// Made with Moe Abdelaziz

/**
 * AIX Meta-Loop Self-Review System with Smart Enhancements
 * 
 * ENHANCEMENTS:
 * 1. Negotiation with CuriosityEngine (dynamic exploration rate)
 * 2. Memory of Failures (avoid repeating mistakes)
 * 3. Mode Switching (adapt execution style based on self-review)
 */
