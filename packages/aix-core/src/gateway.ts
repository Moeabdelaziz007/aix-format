import { kv } from './storage/adapter';
import { KEYS, TTL } from './storage/keys';
import { emit, subscribe, BUS_RINGS } from './bus';
import { CuriosityEngine } from './curiosity-engine';
import { ExpectationEngine, TaskReality } from './expectation-engine';
import { FailureLearning } from './failure-learning';
import { ConstrainedRouter, Task, TaskConstraints } from './constrained-router';
import { ModelDatabase } from './model-database';
import { getDynamicConstraints, explainConstraintAdaptation, getPetState } from './pets';
import { AgentRuntimeEngine } from './agent-runtime';
import { LLMRouter, createDefaultRouter } from './llm-provider';
import type { RuntimeResult } from './agent-runtime';

/**
 * AIX Sovereign Gateway (Persistent Agent Loop)
 *
 * BEFORE: Two isolated systems — gateway managed process state,
 *         agent-runtime executed tasks. Neither knew the other existed.
 *
 * AFTER: Gateway is the CONTROL PLANE.
 *        AgentRuntimeEngine is the EXECUTION ENGINE.
 *        One call (runTask) orchestrates both.
 *
 * Architecture:
 *   Client → GatewayManager.runTask()
 *               ├── spawn()           (process lifecycle)
 *               ├── routeTask()       (constrained model selection)
 *               ├── AgentRuntimeEngine.run()  (ReAct loop + LLM)
 *               └── completeTask() / failTask()  (philosophical engines)
 *
 * Philosophical Engines (preserved):
 *   - Curiosity Engine (Demis Hassabis): Rewards exploration
 *   - Expectation Engine (Mo Gawdat):    Manages happiness
 *   - Failure Learning  (Mo Gawdat):     Transforms failures into growth
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
  routingDecision?: {
    modelId: string;
    quality: number;
    latency: number;
    cost: number;
    constraints: TaskConstraints;
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
  stepCount: number;
  startTime: number;
  expectationSet: boolean;
}

/**
 * Task definition for gateway (extends constrained-router Task)
 */
export interface GatewayTask {
  taskId: string;
  description: string;
  type?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  maxSteps?: number;
  timeout?: number;
  tools?: Record<string, (input: any) => Promise<string>>;
}

/**
 * Full execution result from gateway
 */
export interface GatewayResult {
  processId: string;
  runtime: RuntimeResult;
  modelId: string;
  cost: number;
  happiness?: number;
}

/**
 * Manages the lifecycle of persistent agent processes.
 * Now the UNIFIED entry point for all agent execution.
 */
export class GatewayManager {

  // ─── NEW: Unified Execution Entry Point ─────────────────────────────────

  /**
   * THE single entry point for all agent task execution.
   *
   * Replaces the confusion of:
   *   - gateway.ts spawn() + manual AgentRuntime wiring
   *   - agent-runtime.ts runTask() without process lifecycle
   *   - swarm.ts executor without philosophical tracking
   *
   * Usage:
   *   const result = await GatewayManager.runTask('agent-1', 'Alice', {
   *     taskId: 'task-123',
   *     description: 'Analyze market trends for Q2',
   *     complexity: 'complex',
   *     tools: { search: async ({ query }) => `results for ${query}` }
   *   });
   */
  static async runTask(
    agentId: string,
    agentName: string,
    task: GatewayTask,
    llmRouter?: LLMRouter
  ): Promise<GatewayResult> {
    // 1. Spawn process (lifecycle + expectations)
    const process = await this.spawn(agentId, task.description, {
      taskId: task.taskId,
      complexity: task.complexity,
    });

    // 2. Route to optimal model via constrained optimization
    const routerTask: Task = {
      id: task.taskId,
      type: task.type || 'general',
      description: task.description,
      complexity: task.complexity === 'complex' ? 'high' : task.complexity === 'simple' ? 'low' : 'medium',
    };
    const routing = await this.routeTask(process.id, routerTask);

    // 3. Build LLM provider from routing decision (or use provided router)
    const llm = llmRouter ?? createDefaultRouter();

    // 4. Execute via AgentRuntimeEngine (the real brain)
    const engine = new AgentRuntimeEngine(agentId, agentName,
      {
        taskId: task.taskId,
        description: task.description,
        type: task.type,
        complexity: task.complexity,
        maxSteps: task.maxSteps,
        timeout: task.timeout,
      },
      {
        llm,
        tools: task.tools ?? {},
      }
    );

    let runtimeResult: RuntimeResult;
    try {
      runtimeResult = await engine.run({
        taskId: task.taskId,
        description: task.description,
        type: task.type,
        complexity: task.complexity,
        maxSteps: task.maxSteps,
        timeout: task.timeout,
      });
    } catch (err) {
      await this.failTask(process.id, err, task.description);
      throw err;
    }

    // 5. Philosophical post-processing
    if (runtimeResult.success) {
      await this.completeTask(process.id, runtimeResult.steps * 10);
    } else {
      await this.failTask(process.id, runtimeResult.error, task.description);
    }

    // 6. Update model metrics
    await ModelDatabase.updateMetrics(routing.modelId, {
      quality: runtimeResult.success ? routing.quality : 0,
      latency: runtimeResult.duration,
      success: runtimeResult.success,
      timestamp: Date.now(),
    });

    const proc = await this.getProcess(process.id);
    return {
      processId: process.id,
      runtime: runtimeResult,
      modelId: routing.modelId,
      cost: routing.cost,
      happiness: proc?.metadata?.happiness,
    };
  }

  /**
   * Stream task execution — emits bus events to caller in real-time.
   * Use this for WebSocket / SSE endpoints.
   *
   * Usage:
   *   for await (const event of GatewayManager.streamTask(agentId, name, task)) {
   *     res.write(`data: ${JSON.stringify(event)}\n\n`);
   *   }
   */
  static async *streamTask(
    agentId: string,
    agentName: string,
    task: GatewayTask,
    llmRouter?: LLMRouter
  ): AsyncGenerator<any> {
    const events: any[] = [];
    let done = false;

    // Subscribe to bus events for this agent
    const unsub = subscribe(BUS_RINGS.MIND, agentId, (event: any) => {
      events.push(event);
    });

    // Run in background, collect events
    const resultPromise = this.runTask(agentId, agentName, task, llmRouter)
      .finally(() => { done = true; unsub?.(); });

    // Yield events as they arrive
    while (!done || events.length > 0) {
      if (events.length > 0) {
        yield events.shift();
      } else {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    yield { type: 'DONE', result: await resultPromise };
  }

  // ─── Process Lifecycle (unchanged) ──────────────────────────────────────

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
    // Fix: setExpectation expects (agentId, taskId, task) not (agentId, processId, {description, ...})
    await ExpectationEngine.setExpectation(agentId, processId, task);
    process.expectationSet = true;
    await kv.set(KEYS.gateway(processId), process, { ex: TTL.GATEWAY });
    return process;
  }

  static async pulse(processId: string, update: Partial<GatewayProcess>): Promise<GatewayProcess> {
    const key = KEYS.gateway(processId);
    const existing = await kv.get<GatewayProcess>(key);
    if (!existing) throw new Error(`[Gateway] Process ${processId} not found or expired.`);
    const updated = { ...existing, ...update, updatedAt: Date.now() };
    await kv.set(key, updated, { ex: TTL.GATEWAY });
    return updated;
  }

  static async getProcess(processId: string): Promise<GatewayProcess | null> {
    return kv.get<GatewayProcess>(KEYS.gateway(processId));
  }

  static async recordObservation(processId: string, actionId: string, result: any): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;
    const stepCount = (process.stepCount || 0) + 1;
    const curiosityReward = await CuriosityEngine.calculateCuriosityReward(
      process.agentId, actionId,
      { params: result, success: !result.error, unexpected: result.unexpected,
        edgeCase: result.edgeCase, patternDiscovered: result.patternDiscovered,
        skillSequence: process.metadata.skillSequence || [] }
    );
    await CuriosityEngine.incrementActionUsage(process.agentId, actionId);
    await this.pulse(processId, {
      observations: { ...process.observations, [actionId]: result },
      status: 'THINKING',
      stepCount,
      history: [...process.history,
        { role: 'system', content: `Observation (${actionId}): ${JSON.stringify(result)}`, timestamp: Date.now() }]
    });
    await this.unlockAgent(process.agentId);
  }

  static async completeTask(processId: string, finalXP: number = 0): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;
    const reality: TaskReality = {
      actualSteps: process.stepCount || 0,
      actualDuration: Date.now() - process.startTime,
      succeeded: true,
      actualXP: finalXP,
      completedAt: Date.now(),
    };
    const happiness = await ExpectationEngine.calculateHappiness(process.agentId, processId, reality);
    await this.pulse(processId, {
      status: 'COMPLETED',
      metadata: { ...process.metadata, happiness: happiness.happiness, mood: happiness.mood, finalXP },
    });
  }

  static async failTask(
    processId: string, error: any, attemptedAction: string, triedNewApproach = false
  ): Promise<void> {
    const process = await this.getProcess(processId);
    if (!process) return;
    const analysis = await FailureLearning.analyzeAndLearn(
      process.agentId, processId, error, attemptedAction, triedNewApproach
    );
    const reality: TaskReality = {
      actualSteps: process.stepCount || 0,
      actualDuration: Date.now() - process.startTime,
      succeeded: false,
      actualXP: analysis.reward,
      completedAt: Date.now(),
    };
    const happiness = await ExpectationEngine.calculateHappiness(process.agentId, processId, reality);
    await this.pulse(processId, {
      status: 'FAILED',
      metadata: { ...process.metadata,
        failureType: analysis.type, failureReward: analysis.reward,
        learning: analysis.learning, shouldRetry: analysis.shouldRetry,
        suggestedApproach: analysis.suggestedApproach,
        happiness: happiness.happiness, mood: happiness.mood },
    });
  }

  // ─── Philosophical Insights (unchanged) ────────────────────────────────

  static async getPhilosophicalInsights(agentId: string) {
    const [curiosityScore, averageHappiness, failureStats, recentExplorations, happinessHistory] =
      await Promise.all([
        CuriosityEngine.getCuriosityScore(agentId),
        ExpectationEngine.getAverageHappiness(agentId),
        FailureLearning.getFailureStats(agentId),
        CuriosityEngine.getRecentExplorations(agentId, 5),
        ExpectationEngine.getHappinessHistory(agentId, 10),
      ]);
    return { curiosityScore, averageHappiness, failureStats, recentExplorations, happinessHistory };
  }

  // ─── Locking (unchanged) ────────────────────────────────────────────────

  static async lockAgent(agentId: string, processId: string): Promise<boolean> {
    try { await kv.set(KEYS.aixLockAgent(agentId), processId, { nx: true, ex: 300 }); return true; }
    catch { return false; }
  }

  static async unlockAgent(agentId: string): Promise<void> {
    await kv.del(KEYS.aixLockAgent(agentId));
  }

  // ─── Constrained Routing (unchanged) ──────────────────────────────────

  static async routeTask(processId: string, task: Task) {
    const process = await this.getProcess(processId);
    if (!process) throw new Error(`[Gateway] Process ${processId} not found`);
    const constraints = await getDynamicConstraints(process.agentId);
    const petState    = await getPetState(process.agentId);
    const result      = await ConstrainedRouter.route(task, constraints);
    const explanation = ConstrainedRouter.explainRouting(task, constraints, result);
    await this.pulse(processId, {
      routingDecision: { modelId: result.modelId, quality: result.quality,
        latency: result.latency, cost: result.cost, constraints, timestamp: Date.now() },
      metadata: { ...process.metadata, petMood: petState.mood, petLevel: petState.level },
    });
    return { ...result, constraints, explanation };
  }

  static async executeWithRouting<T>(
    processId: string, task: Task, executor: (modelId: string) => Promise<T>
  ) {
    const startTime = Date.now();
    const routing   = await this.routeTask(processId, task);
    let success = false;
    let actualLatency = 0;
    let result: T;
    try {
      const execStart = Date.now();
      result = await executor(routing.modelId);
      actualLatency = Date.now() - execStart;
      success = true;
    } catch (error) {
      actualLatency = Date.now() - startTime;
      throw error;
    } finally {
      await ModelDatabase.updateMetrics(routing.modelId, {
        quality: success ? routing.quality : 0, latency: actualLatency, success, timestamp: Date.now()
      });
    }
    return { result: result!, modelId: routing.modelId, quality: routing.quality,
      latency: actualLatency, cost: routing.cost, success };
  }

  static async getRoutingAnalytics(agentId: string) {
    const dbStats = await ModelDatabase.getStats();
    return {
      totalRouted: dbStats.totalCalls,
      modelUsage: {} as Record<string, number>,
      avgQuality: dbStats.avgQuality,
      avgLatency: dbStats.avgLatency,
      avgCost: dbStats.avgCost,
      totalCost: dbStats.totalCalls * dbStats.avgCost,
      constraintHistory: [] as any[],
    };
  }

  static async explainRoutingStrategy(agentId: string): Promise<string> {
    const petState   = await getPetState(agentId);
    const constraints = await getDynamicConstraints(agentId);
    return explainConstraintAdaptation(petState.mood, constraints);
  }
}

// Made with Moe Abdelaziz
