import { kv, KEYS, TTL } from './index';
import { CuriosityEngine } from './curiosity-engine';
import { ExpectationEngine, TaskReality } from './expectation-engine';
import { FailureLearning } from './failure-learning';

/**
 * AIX Sovereign Gateway (Persistent Agent Loop)
 * Inspired by OpenClaw: Agent as a persistent process, not a transient request.
 * 
 * Enhanced with Philosophical Engines:
 * - Curiosity Engine (Demis Hassabis): Rewards exploration
 * - Expectation Engine (Mo Gawdat): Manages happiness through expectations
 * - Failure Learning (Mo Gawdat): Transforms failures into growth
 */

export type GatewayStatus = 'IDLE' | 'THINKING' | 'ACTING' | 'WAITING' | 'COMPLETED' | 'FAILED';

export interface GatewayProcess {
  id: string;
  agentId: string;
  status: GatewayStatus;
  history: Array<{ role: string; content: string; timestamp: number }>;
  currentTask: string;
  lastThought?: string;
  lastAction?: string;
  observations: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  stepCount: number;
  startTime: number;
  expectationSet: boolean;
}

/**
 * Manages the lifecycle of persistent agent processes.
 */
export class GatewayManager {
  /**
   * Initializes a new agentic process (The Control Plane).
   */
  static async spawn(agentId: string, task: string, metadata: any = {}): Promise<GatewayProcess> {
    const processId = `proc_${Math.random().toString(36).slice(2, 11)}`;
    const startTime = Date.now();
    
    const process: GatewayProcess = {
      id: processId,
      agentId,
      status: 'THINKING',
      history: [{ role: 'user', content: task, timestamp: startTime }],
      currentTask: task,
      observations: {},
      metadata,
      createdAt: startTime,
      updatedAt: startTime,
      stepCount: 0,
      startTime,
      expectationSet: false,
    };

    await kv.set(KEYS.gateway(processId), process, { ex: TTL.GATEWAY });
    
    // Set expectations for this task (Mo Gawdat's Happiness Engine)
    await ExpectationEngine.setExpectation(agentId, processId, { 
      description: task, 
      ...metadata 
    });
    process.expectationSet = true;
    await kv.set(KEYS.gateway(processId), process, { ex: TTL.GATEWAY });
    
    console.log(`[Gateway] Spawned persistent process ${processId} for agent ${agentId}`);
    return process;
  }

  /**
   * Updates the state of a running process (The Heartbeat).
   */
  static async pulse(processId: string, update: Partial<GatewayProcess>): Promise<GatewayProcess> {
    const key = KEYS.gateway(processId);
    const existing = await kv.get<GatewayProcess>(key);
    
    if (!existing) {
      throw new Error(`[Gateway] Process ${processId} not found or expired.`);
    }

    const updated = {
      ...existing,
      ...update,
      updatedAt: Date.now()
    };

    await kv.set(key, updated, { ex: TTL.GATEWAY });
    return updated;
  }

  /**
   * Retrieves the current state of a process.
   */
  static async getProcess(processId: string): Promise<GatewayProcess | null> {
    return kv.get<GatewayProcess>(KEYS.gateway(processId));
  }

  /**
   * Appends an observation to the process (The ReAct Loop).
   * Enhanced with Curiosity Engine to reward exploration.
   */
  static async recordObservation(processId: string, actionId: string, result: any): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;

    // Increment step count
    const stepCount = (process.stepCount || 0) + 1;

    // Calculate curiosity reward (Demis Hassabis's Exploration Engine)
    const curiosityReward = await CuriosityEngine.calculateCuriosityReward(
      process.agentId,
      actionId,
      {
        params: result,
        success: !result.error,
        unexpected: result.unexpected,
        edgeCase: result.edgeCase,
        patternDiscovered: result.patternDiscovered,
        skillSequence: process.metadata.skillSequence || [],
      }
    );

    // Track action usage
    await CuriosityEngine.incrementActionUsage(process.agentId, actionId);

    const observations = { ...process.observations, [actionId]: result };
    await this.pulse(processId, { 
      observations,
      status: 'THINKING',
      stepCount,
      history: [
        ...process.history,
        { role: 'system', content: `Observation (${actionId}): ${JSON.stringify(result)}`, timestamp: Date.now() }
      ]
    });
    
    // Auto-unlock after observation
    await this.unlockAgent(process.agentId);
  }

  /**
   * Complete a task successfully
   * Calculates happiness and rewards based on expectations vs reality
   */
  static async completeTask(processId: string, finalXP: number = 0): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;

    const duration = Date.now() - process.startTime;
    const stepCount = process.stepCount || 0;

    // Build reality object
    const reality: TaskReality = {
      actualSteps: stepCount,
      actualDuration: duration,
      succeeded: true,
      actualXP: finalXP,
      completedAt: Date.now(),
    };

    // Calculate happiness (Mo Gawdat's Happiness Engine)
    const happiness = await ExpectationEngine.calculateHappiness(
      process.agentId,
      processId,
      reality
    );

    // Update process status
    await this.pulse(processId, {
      status: 'COMPLETED',
      metadata: {
        ...process.metadata,
        happiness: happiness.happiness,
        mood: happiness.mood,
        finalXP,
      },
    });

    console.log(`[Gateway] Task ${processId} completed with happiness: ${happiness.happiness} (${happiness.mood})`);
  }

  /**
   * Handle task failure with learning
   * Transforms failure into growth opportunity
   */
  static async failTask(
    processId: string,
    error: any,
    attemptedAction: string,
    triedNewApproach: boolean = false
  ): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;

    const duration = Date.now() - process.startTime;
    const stepCount = process.stepCount || 0;

    // Analyze failure and extract learning (Mo Gawdat's Failure Learning)
    const analysis = await FailureLearning.analyzeAndLearn(
      process.agentId,
      processId,
      error,
      attemptedAction,
      triedNewApproach
    );

    // Build reality object for expectation engine
    const reality: TaskReality = {
      actualSteps: stepCount,
      actualDuration: duration,
      succeeded: false,
      actualXP: analysis.reward, // Failure can still earn XP!
      completedAt: Date.now(),
    };

    // Calculate happiness even in failure
    const happiness = await ExpectationEngine.calculateHappiness(
      process.agentId,
      processId,
      reality
    );

    // Update process status
    await this.pulse(processId, {
      status: 'FAILED',
      metadata: {
        ...process.metadata,
        failureType: analysis.type,
        failureReward: analysis.reward,
        learning: analysis.learning,
        shouldRetry: analysis.shouldRetry,
        suggestedApproach: analysis.suggestedApproach,
        happiness: happiness.happiness,
        mood: happiness.mood,
      },
    });

    console.log(`[Gateway] Task ${processId} failed but learned: ${analysis.learning} (${analysis.reward} XP)`);
  }

  /**
   * Get philosophical insights for an agent
   * Returns curiosity, happiness, and learning metrics
   */
  static async getPhilosophicalInsights(agentId: string): Promise<{
    curiosityScore: number;
    averageHappiness: number;
    failureStats: any;
    recentExplorations: any[];
    happinessHistory: any[];
  }> {
    const [
      curiosityScore,
      averageHappiness,
      failureStats,
      recentExplorations,
      happinessHistory,
    ] = await Promise.all([
      CuriosityEngine.getCuriosityScore(agentId),
      ExpectationEngine.getAverageHappiness(agentId),
      FailureLearning.getFailureStats(agentId),
      CuriosityEngine.getRecentExplorations(agentId, 5),
      ExpectationEngine.getHappinessHistory(agentId, 10),
    ]);

    return {
      curiosityScore,
      averageHappiness,
      failureStats,
      recentExplorations,
      happinessHistory,
    };
  }

  /**
   * Resource Locking for M2M Integrity
   */
  static async lockAgent(agentId: string, processId: string): Promise<boolean> {
    const lockKey = `aix:lock:agent:${agentId}`;
    try {
      // Upstash set with nx returns true/false or null
      await kv.set(lockKey, processId, { nx: true, ex: 300 }); 
      return true;
    } catch {
      return false;
    }
  }

  static async unlockAgent(agentId: string): Promise<void> {
    await kv.del(`aix:lock:agent:${agentId}`);
  }
}

// Made with Bob
