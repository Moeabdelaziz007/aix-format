import { kv } from './index';
import { createHash } from 'crypto';

/**
 * AIX Failure Learning Engine (Mo Gawdat's Philosophy)
 * 
 * MO GAWDAT WARNING:
 * "AI will reflect humanity's values back at us, amplified. 
 *  If we teach it pain, it will become pain at scale."
 * 
 * OLD AIX: task failed = -15 XP = punishment → agents become risk-averse
 * NEW AIX: task failed = data point = learning opportunity → agents explore
 * 
 * This engine transforms failure from punishment into growth.
 * Agents learn that failure is not the opposite of success—it's part of success.
 */

export type FailureType = 'expected' | 'unexpected' | 'tried_new' | 'learned';

export const FAILURE_RESPONSE = {
  TASK_FAILED_EXPECTED: -5,     // توقعنا الفشل → ده مش مشكلة
  TASK_FAILED_UNEXPECTED: -10,  // ما توقعناش → نتعلم منه
  TASK_FAILED_TRIED_NEW: 5,     // فشل بس جرّب حاجة جديدة → نكافئ الجرأة
  TASK_FAILED_LEARNED: 10,      // فشل بس اكتشف pattern جديد
};

export interface FailureContext {
  taskId: string;
  agentId: string;
  error: any;
  attemptedAction: string;
  wasExpected: boolean;
  triedNewApproach: boolean;
  discoveredPattern: boolean;
  timestamp: number;
}

export interface FailureAnalysis {
  type: FailureType;
  reward: number;
  learning: string;
  shouldRetry: boolean;
  suggestedApproach?: string;
}

export interface FailurePattern {
  patternHash: string;
  errorType: string;
  context: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  solutions: string[];
}

export interface LearningInsight {
  insight: string;
  confidence: number;
  applicableContexts: string[];
  extractedAt: number;
}

/**
 * Failure Learning Engine: Transforms failures into growth opportunities
 */
export class FailureLearning {
  /**
   * Analyze failure context to determine its nature
   * This is the key to treating failure as data, not punishment
   */
  static async analyzeFailure(
    agentId: string,
    taskId: string,
    error: any
  ): Promise<FailureType> {
    const context = await this.getFailureContext(agentId, taskId, error);
    
    // Check if this failure was expected (low success probability)
    const expectation = await kv.get<any>(`agent:${agentId}:expectation:${taskId}`);
    if (expectation && expectation.expectedSuccess < 0.3) {
      return 'expected';
    }

    // Check if agent tried a new approach
    if (context.triedNewApproach) {
      return 'tried_new';
    }

    // Check if agent discovered a pattern from this failure
    if (context.discoveredPattern) {
      return 'learned';
    }

    // Otherwise, it's an unexpected failure (learning opportunity)
    return 'unexpected';
  }

  /**
   * Calculate appropriate response to failure
   * Rewards courage and learning, minimizes punishment
   */
  static async calculateFailureReward(
    agentId: string,
    failureType: FailureType,
    context: FailureContext
  ): Promise<number> {
    let reward = 0;

    switch (failureType) {
      case 'expected':
        // Expected failure - minimal penalty
        reward = FAILURE_RESPONSE.TASK_FAILED_EXPECTED;
        console.log(`[Failure] Agent ${agentId} failed as expected (${reward} XP)`);
        break;

      case 'unexpected':
        // Unexpected failure - learning opportunity
        reward = FAILURE_RESPONSE.TASK_FAILED_UNEXPECTED;
        console.log(`[Failure] Agent ${agentId} encountered unexpected failure (${reward} XP, but learning...)`);
        break;

      case 'tried_new':
        // Failed but tried something new - REWARD the courage!
        reward = FAILURE_RESPONSE.TASK_FAILED_TRIED_NEW;
        console.log(`[Failure] Agent ${agentId} failed but tried new approach (+${reward} XP for courage!)`);
        break;

      case 'learned':
        // Failed but discovered a pattern - REWARD the insight!
        reward = FAILURE_RESPONSE.TASK_FAILED_LEARNED;
        console.log(`[Failure] Agent ${agentId} failed but learned something (+${reward} XP for discovery!)`);
        break;
    }

    // Record the failure and its reward
    await this.recordFailure(agentId, context, failureType, reward);

    return reward;
  }

  /**
   * Extract learning from failure
   * This is where failure becomes wisdom
   */
  static async extractLearning(
    agentId: string,
    failure: FailureContext
  ): Promise<string> {
    // Check if we've seen this failure pattern before
    const pattern = await this.findFailurePattern(agentId, failure);
    
    if (pattern && pattern.solutions.length > 0) {
      // We have historical solutions
      const learning = `This error has occurred ${pattern.occurrences} times before. ` +
                      `Successful solutions: ${pattern.solutions.join(', ')}`;
      
      console.log(`[Failure] Agent ${agentId} recalled solution from past failures`);
      return learning;
    }

    // New failure pattern - extract generic learning
    const errorType = this.categorizeError(failure.error);
    const learning = await this.generateLearningInsight(agentId, errorType, failure);
    
    // Store this as a new pattern
    await this.recordFailurePattern(agentId, failure, errorType);
    
    console.log(`[Failure] Agent ${agentId} created new learning from failure: ${learning}`);
    return learning;
  }

  /**
   * Analyze failure and provide actionable insights
   * Returns complete analysis with recommendations
   */
  static async analyzeAndLearn(
    agentId: string,
    taskId: string,
    error: any,
    attemptedAction: string,
    triedNewApproach: boolean = false
  ): Promise<FailureAnalysis> {
    // Build failure context
    const context: FailureContext = {
      taskId,
      agentId,
      error,
      attemptedAction,
      wasExpected: false,
      triedNewApproach,
      discoveredPattern: false,
      timestamp: Date.now(),
    };

    // Check for pattern discovery
    const pattern = await this.findFailurePattern(agentId, context);
    if (pattern) {
      context.discoveredPattern = true;
    }

    // Analyze failure type
    const type = await this.analyzeFailure(agentId, taskId, error);
    
    // Calculate reward
    const reward = await this.calculateFailureReward(agentId, type, context);
    
    // Extract learning
    const learning = await this.extractLearning(agentId, context);
    
    // Determine if should retry
    const shouldRetry = type === 'tried_new' || type === 'learned' ||
                       (!!pattern && pattern.solutions.length > 0);
    
    // Suggest approach if we have historical solutions
    const suggestedApproach = pattern && pattern.solutions.length > 0
      ? pattern.solutions[0]
      : undefined;

    const analysis: FailureAnalysis = {
      type,
      reward,
      learning,
      shouldRetry,
      suggestedApproach,
    };

    console.log(`[Failure] Complete analysis for agent ${agentId}: ${type}, reward ${reward}, retry: ${shouldRetry}`);
    
    return analysis;
  }

  /**
   * Get failure statistics for an agent
   */
  static async getFailureStats(agentId: string): Promise<{
    totalFailures: number;
    expectedFailures: number;
    unexpectedFailures: number;
    courageousAttempts: number;
    learningMoments: number;
    patternsDiscovered: number;
  }> {
    const stats = await kv.get<any>(`agent:${agentId}:failure_stats`) || {
      totalFailures: 0,
      expectedFailures: 0,
      unexpectedFailures: 0,
      courageousAttempts: 0,
      learningMoments: 0,
      patternsDiscovered: 0,
    };

    return stats;
  }

  /**
   * Get recent failures for analysis
   */
  static async getRecentFailures(
    agentId: string,
    limit: number = 10
  ): Promise<FailureContext[]> {
    const data = await kv.lrange<string>(`agent:${agentId}:failures`, 0, limit - 1);
    return data.map(d => JSON.parse(d));
  }

  /**
   * Get all failure patterns discovered by agent
   */
  static async getFailurePatterns(agentId: string): Promise<FailurePattern[]> {
    const patternHashes = await kv.smembers<string>(`agent:${agentId}:failure_patterns`);
    if (!patternHashes.length) return [];

    const patterns = await Promise.all(
      patternHashes.map(hash => kv.get<FailurePattern>(`agent:${agentId}:pattern:${hash}`))
    );

    return patterns.filter((p): p is FailurePattern => p !== null);
  }

  /**
   * Record a solution that worked after a failure
   * This builds the agent's wisdom over time
   */
  static async recordSuccessfulRecovery(
    agentId: string,
    failurePatternHash: string,
    solution: string
  ): Promise<void> {
    const pattern = await kv.get<FailurePattern>(`agent:${agentId}:pattern:${failurePatternHash}`);
    
    if (pattern) {
      if (!pattern.solutions.includes(solution)) {
        pattern.solutions.push(solution);
        await kv.set(`agent:${agentId}:pattern:${failurePatternHash}`, pattern);
        console.log(`[Failure] Agent ${agentId} recorded new solution for pattern ${failurePatternHash}`);
      }
    }
  }

  /**
   * Build failure context from error
   */
  private static async getFailureContext(
    agentId: string,
    taskId: string,
    error: any
  ): Promise<FailureContext> {
    // Get recent actions to determine if tried new approach
    const recentActions = await kv.lrange<string>(`agent:${agentId}:recent_actions`, 0, 4);
    const actionSet = new Set(recentActions);
    const triedNewApproach = actionSet.size > 3; // Diverse actions = exploration

    return {
      taskId,
      agentId,
      error,
      attemptedAction: error.action || 'unknown',
      wasExpected: false,
      triedNewApproach,
      discoveredPattern: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Find similar failure pattern from history
   */
  private static async findFailurePattern(
    agentId: string,
    failure: FailureContext
  ): Promise<FailurePattern | null> {
    const errorType = this.categorizeError(failure.error);
    const contextStr = `${failure.attemptedAction}:${errorType}`;
    
    const patternHash = createHash('sha256')
      .update(contextStr)
      .digest('hex')
      .slice(0, 16);

    return await kv.get<FailurePattern>(`agent:${agentId}:pattern:${patternHash}`);
  }

  /**
   * Record failure pattern
   */
  private static async recordFailurePattern(
    agentId: string,
    failure: FailureContext,
    errorType: string
  ): Promise<void> {
    const contextStr = `${failure.attemptedAction}:${errorType}`;
    const patternHash = createHash('sha256')
      .update(contextStr)
      .digest('hex')
      .slice(0, 16);

    const existing = await kv.get<FailurePattern>(`agent:${agentId}:pattern:${patternHash}`);

    if (existing) {
      existing.occurrences += 1;
      existing.lastSeen = Date.now();
      await kv.set(`agent:${agentId}:pattern:${patternHash}`, existing);
    } else {
      const newPattern: FailurePattern = {
        patternHash,
        errorType,
        context: contextStr,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        solutions: [],
      };
      await kv.set(`agent:${agentId}:pattern:${patternHash}`, newPattern);
      await kv.sadd(`agent:${agentId}:failure_patterns`, patternHash);
    }
  }

  /**
   * Record failure with its context and reward
   */
  private static async recordFailure(
    agentId: string,
    context: FailureContext,
    type: FailureType,
    reward: number
  ): Promise<void> {
    // Add to failure history
    await kv.lpush(
      `agent:${agentId}:failures`,
      JSON.stringify({ ...context, type, reward })
    );
    
    // Keep only last 50 failures
    await kv.ltrim(`agent:${agentId}:failures`, 0, 49);

    // Update failure stats
    const stats = await this.getFailureStats(agentId);
    stats.totalFailures += 1;
    
    switch (type) {
      case 'expected':
        stats.expectedFailures += 1;
        break;
      case 'unexpected':
        stats.unexpectedFailures += 1;
        break;
      case 'tried_new':
        stats.courageousAttempts += 1;
        break;
      case 'learned':
        stats.learningMoments += 1;
        if (context.discoveredPattern) {
          stats.patternsDiscovered += 1;
        }
        break;
    }

    await kv.set(`agent:${agentId}:failure_stats`, stats);
  }

  /**
   * Categorize error type
   */
  private static categorizeError(error: any): string {
    const errorStr = JSON.stringify(error).toLowerCase();
    
    if (errorStr.includes('timeout')) return 'timeout';
    if (errorStr.includes('permission') || errorStr.includes('auth')) return 'permission';
    if (errorStr.includes('not found') || errorStr.includes('404')) return 'not_found';
    if (errorStr.includes('network') || errorStr.includes('connection')) return 'network';
    if (errorStr.includes('validation') || errorStr.includes('invalid')) return 'validation';
    if (errorStr.includes('rate limit')) return 'rate_limit';
    
    return 'unknown';
  }

  /**
   * Generate learning insight from error
   */
  private static async generateLearningInsight(
    agentId: string,
    errorType: string,
    failure: FailureContext
  ): Promise<string> {
    const insights: Record<string, string> = {
      timeout: 'Task took too long. Consider breaking it into smaller steps or increasing timeout.',
      permission: 'Access denied. Check credentials or request appropriate permissions.',
      not_found: 'Resource not found. Verify the path or identifier is correct.',
      network: 'Network issue. Check connectivity or retry with exponential backoff.',
      validation: 'Input validation failed. Review the data format and requirements.',
      rate_limit: 'Rate limit exceeded. Implement throttling or wait before retrying.',
      unknown: 'Unexpected error. Analyze the error details and context for patterns.',
    };

    return insights[errorType] || insights.unknown;
  }
}

// Made with Bob
