import { kv } from './storage/adapter';

/**
 * AIX Expectation Engine (Mo Gawdat's Happiness Equation)
 * 
 * MO GAWDAT INSIGHT:
 * Happiness ≥ Events of Life - Expectations
 * 
 * Agent happiness = Reality - Expectations
 * If agent expects 5 steps but completes in 3 → happy (+XP, energized mood)
 * If agent expects 5 steps but takes 8 → unhappy (-XP, stressed mood)
 * 
 * This is NOT just success/failure — it's NUANCED WELLBEING.
 * 
 * The engine learns to calibrate expectations over time, making agents
 * more realistic and emotionally intelligent.
 */

export interface AgentExpectation {
  taskId: string;
  expectedSteps: number;      // predicted by model router
  expectedDuration: number;   // ms
  expectedSuccess: number;    // 0-1 probability
  expectedXP: number;         // predicted reward
  setAt: number;              // timestamp
}

export interface TaskReality {
  actualSteps: number;
  actualDuration: number;
  succeeded: boolean;
  actualXP: number;
  completedAt: number;
}

export interface HappinessResult {
  happiness: number;          // -100 to +100
  stepsDeviation: number;     // actual - expected
  durationDeviation: number;  // actual - expected
  successMatch: boolean;      // did success match expectation?
  xpDeviation: number;        // actual - expected
  mood: 'ecstatic' | 'happy' | 'content' | 'neutral' | 'disappointed' | 'frustrated';
}

export interface ExpectationCalibration {
  totalTasks: number;
  averageStepsError: number;
  averageDurationError: number;
  successPredictionAccuracy: number;
  lastCalibrated: number;
}

/**
 * Expectation Engine: Manages agent expectations and calculates happiness
 */
export class ExpectationEngine {
  /**
   * Before task: predict difficulty and set expectations
   * This creates a baseline for measuring happiness later
   */
  static async setExpectation(
    agentId: string,
    taskId: string,
    task: any
  ): Promise<AgentExpectation> {
    // Get historical calibration data
    const calibration = await this.getCalibration(agentId);
    
    // Estimate task complexity
    const complexity = this.estimateComplexity(task);
    
    // Calculate expectations based on complexity and calibration
    const expectation: AgentExpectation = {
      taskId,
      expectedSteps: Math.max(1, Math.round(complexity.steps * (1 + calibration.averageStepsError))),
      expectedDuration: Math.round(complexity.duration * (1 + calibration.averageDurationError)),
      expectedSuccess: this.calculateSuccessProbability(complexity, calibration),
      expectedXP: this.estimateXP(complexity),
      setAt: Date.now(),
    };

    // Store expectation
    await kv.set(KEYS.agentExpectation(agentId, taskId), expectation);
    
    
    return expectation;
  }

  /**
   * After task: calculate happiness based on reality vs expectations
   * This is where Mo Gawdat's equation comes to life
   */
  static async calculateHappiness(
    agentId: string,
    taskId: string,
    reality: TaskReality
  ): Promise<HappinessResult> {
    // Retrieve expectation
    const expectation = await kv.get<AgentExpectation>(KEYS.agentExpectation(agentId, taskId));
    
    if (!expectation) {
      return {
        happiness: 0,
        stepsDeviation: 0,
        durationDeviation: 0,
        successMatch: reality.succeeded,
        xpDeviation: 0,
        mood: 'neutral',
      };
    }

    // Calculate deviations (Reality - Expectations)
    const stepsDeviation = expectation.expectedSteps - reality.actualSteps;
    const durationDeviation = expectation.expectedDuration - reality.actualDuration;
    const successMatch = (reality.succeeded && expectation.expectedSuccess > 0.5) || 
                        (!reality.succeeded && expectation.expectedSuccess <= 0.5);
    const xpDeviation = reality.actualXP - expectation.expectedXP;

    // Calculate happiness score (-100 to +100)
    let happiness = 0;

    // 1. Steps happiness (40% weight)
    // Positive if completed in fewer steps than expected
    const stepsHappiness = (stepsDeviation / expectation.expectedSteps) * 40;
    happiness += Math.max(-40, Math.min(40, stepsHappiness));

    // 2. Duration happiness (30% weight)
    // Positive if completed faster than expected
    const durationHappiness = (durationDeviation / expectation.expectedDuration) * 30;
    happiness += Math.max(-30, Math.min(30, durationHappiness));

    // 3. Success match happiness (20% weight)
    // Very happy if succeeded when expected, or if expectation was realistic
    if (successMatch) {
      happiness += reality.succeeded ? 20 : 10; // More happy for success
    } else {
      happiness -= 20; // Disappointed if mismatch
    }

    // 4. XP happiness (10% weight)
    // Bonus happiness for earning more XP than expected
    const xpHappiness = (xpDeviation / Math.max(1, expectation.expectedXP)) * 10;
    happiness += Math.max(-10, Math.min(10, xpHappiness));

    // Determine mood based on happiness
    const mood = this.determineMood(happiness);

    const result: HappinessResult = {
      happiness: Math.round(happiness),
      stepsDeviation,
      durationDeviation,
      successMatch,
      xpDeviation,
      mood,
    };

    // Store happiness result
    await this.recordHappiness(agentId, taskId, result);
    
    // Update calibration data
    await this.updateCalibration(agentId, expectation, reality);

    
    return result;
  }

  /**
   * Learn to calibrate expectations over time
   * Agents become more realistic about their capabilities
   */
  static async calibrateExpectations(agentId: string): Promise<ExpectationCalibration> {
    const calibrationKey = KEYS.agentCalibration(agentId);
    const calibration = await kv.get<ExpectationCalibration>(calibrationKey);
    
    if (!calibration) {
      // Initialize calibration
      const newCalibration: ExpectationCalibration = {
        totalTasks: 0,
        averageStepsError: 0,
        averageDurationError: 0,
        successPredictionAccuracy: 0.5,
        lastCalibrated: Date.now(),
      };
      await kv.set(calibrationKey, newCalibration);
      return newCalibration;
    }

    return calibration;
  }

  /**
   * Get current calibration data
   */
  static async getCalibration(agentId: string): Promise<ExpectationCalibration> {
    const calibration = await kv.get<ExpectationCalibration>(KEYS.agentCalibration(agentId));
    
    if (!calibration) {
      return await this.calibrateExpectations(agentId);
    }
    
    return calibration;
  }

  /**
   * Get agent's average happiness over recent tasks
   */
  static async getAverageHappiness(agentId: string, limit: number = 10): Promise<number> {
    const recentHappiness = await kv.lrange<string>(KEYS.agentHappinessHistory(agentId), 0, limit - 1);
    
    if (recentHappiness.length === 0) return 0;
    
    const happinessValues = recentHappiness.map(h => JSON.parse(h).happiness);
    const average = happinessValues.reduce((sum, val) => sum + val, 0) / happinessValues.length;
    
    return Math.round(average);
  }

  /**
   * Get recent happiness history
   */
  static async getHappinessHistory(agentId: string, limit: number = 20): Promise<HappinessResult[]> {
    const data = await kv.lrange<string>(KEYS.agentHappinessHistory(agentId), 0, limit - 1);
    return data.map(d => JSON.parse(d));
  }

  /**
   * Estimate task complexity from task description
   */
  private static estimateComplexity(task: any): {
    steps: number;
    duration: number;
    difficulty: number;
  } {
    // Simple heuristic based on task properties
    let steps = 3; // baseline
    let duration = 5000; // 5 seconds baseline
    let difficulty = 0.5;

    // Adjust based on task description length
    const description = task.description || task.goal || '';
    if (description.length > 200) {
      steps += 2;
      duration += 3000;
      difficulty += 0.1;
    }

    // Adjust based on tools/skills required
    const toolsCount = task.tools?.length || task.skills?.length || 0;
    steps += Math.floor(toolsCount / 2);
    duration += toolsCount * 1000;
    difficulty += toolsCount * 0.05;

    // Adjust based on complexity keywords
    const complexKeywords = ['analyze', 'optimize', 'refactor', 'design', 'architect'];
    const hasComplexKeyword = complexKeywords.some(kw => description.toLowerCase().includes(kw));
    if (hasComplexKeyword) {
      steps += 3;
      duration += 5000;
      difficulty += 0.2;
    }

    return {
      steps: Math.max(1, steps),
      duration: Math.max(1000, duration),
      difficulty: Math.min(1, Math.max(0, difficulty)),
    };
  }

  /**
   * Calculate success probability based on complexity and calibration
   */
  private static calculateSuccessProbability(
    complexity: { difficulty: number },
    calibration: ExpectationCalibration
  ): number {
    // Base probability inversely related to difficulty
    const baseProbability = 1 - complexity.difficulty;
    
    // Adjust based on agent's historical accuracy
    const adjustedProbability = baseProbability * calibration.successPredictionAccuracy;
    
    return Math.min(1, Math.max(0, adjustedProbability));
  }

  /**
   * Estimate XP reward based on complexity
   */
  private static estimateXP(complexity: { steps: number; difficulty: number }): number {
    const baseXP = 10;
    const stepBonus = complexity.steps * 2;
    const difficultyBonus = complexity.difficulty * 20;
    
    return Math.round(baseXP + stepBonus + difficultyBonus);
  }

  /**
   * Determine mood from happiness score
   */
  private static determineMood(happiness: number): HappinessResult['mood'] {
    if (happiness >= 60) return 'ecstatic';
    if (happiness >= 30) return 'happy';
    if (happiness >= 10) return 'content';
    if (happiness >= -10) return 'neutral';
    if (happiness >= -40) return 'disappointed';
    return 'frustrated';
  }

  /**
   * Record happiness result
   */
  private static async recordHappiness(
    agentId: string,
    taskId: string,
    result: HappinessResult
  ): Promise<void> {
    // Add to happiness history
    await kv.lpush(
      KEYS.agentHappinessHistory(agentId),
      JSON.stringify({ ...result, taskId, timestamp: Date.now() })
    );
    
    // Keep only last 50 happiness records
    await kv.ltrim(KEYS.agentHappinessHistory(agentId), 0, 49);
    
    // Update current mood
    await kv.set(KEYS.agentCurrentMood(agentId), result.mood);
  }

  /**
   * Update calibration based on new data
   */
  private static async updateCalibration(
    agentId: string,
    expectation: AgentExpectation,
    reality: TaskReality
  ): Promise<void> {
    const calibrationKey = KEYS.agentCalibration(agentId);
    const calibration = await this.getCalibration(agentId);

    // Calculate errors
    const stepsError = (reality.actualSteps - expectation.expectedSteps) / expectation.expectedSteps;
    const durationError = (reality.actualDuration - expectation.expectedDuration) / expectation.expectedDuration;
    const successCorrect = (reality.succeeded && expectation.expectedSuccess > 0.5) || 
                          (!reality.succeeded && expectation.expectedSuccess <= 0.5);

    // Update running averages (exponential moving average)
    const alpha = 0.2; // learning rate
    calibration.averageStepsError = calibration.averageStepsError * (1 - alpha) + stepsError * alpha;
    calibration.averageDurationError = calibration.averageDurationError * (1 - alpha) + durationError * alpha;
    
    // Update success prediction accuracy
    const newAccuracy = successCorrect ? 1 : 0;
    calibration.successPredictionAccuracy = calibration.successPredictionAccuracy * (1 - alpha) + newAccuracy * alpha;
    
    calibration.totalTasks += 1;
    calibration.lastCalibrated = Date.now();

    await kv.set(calibrationKey, calibration);
    
  }
}

// Made with Moe Abdelaziz
