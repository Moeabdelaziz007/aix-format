/**
 * AIX Agent Runtime - Production ReAct Loop
 *
 * Implements 6 critical production insights:
 * 1. Skill Caching (Tesla Resonance) - Check SkillDB FIRST
 * 2. Model Router (85% cost reduction) - Route by mood + complexity
 * 3. Stop Tokens - Prevent hallucinated observations
 * 4. Max Steps Guard - Loop detection + force stop
 * 5. Context Window Management - Rich context from memories + skills + lessons
 * 6. Observable State - Every state change → bus.ts emit
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { emit, BUS_RINGS, createThoughtEvent, createActionEvent, createObservationEvent } from './bus';
import { getFeedbackSkills, getLearnedProcedures, recordSuccessfulProcedure, ProcedureStep } from './learning';
import { PetOrchestrator } from './pets';
import { FailureLearning } from './failure-learning';
import { ResonanceEngine, TaskPerformance } from './resonance-engine';
import { recordTrustTransaction } from './trust-chain';
import { ReadableMemory } from './memory-readable';
import { AgentRuntimeConfig, LLMProvider, ToolRegistry } from './llm-provider';

export type { AgentRuntimeConfig, LLMProvider, ToolRegistry } from './llm-provider';

/**
 * Agent mood from pets.ts
 */
export type AgentMood = 'ecstatic' | 'energized' | 'happy' | 'busy' | 'curious' | 'tired' | 'sleep';

/**
 * Runtime status
 */
export type RuntimeStatus = 'thinking' | 'acting' | 'done' | 'failed';

/**
 * Task definition
 */
export interface Task {
  taskId: string;
  description: string;
  type?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  maxSteps?: number;
  timeout?: number;
}

/**
 * Scratchpad entry for ReAct loop
 */
export interface ScratchpadEntry {
  thought: string;
  action: string;
  observation: string;
}

/**
 * Agent Runtime state
 */
export interface AgentRuntime {
  agentId: string;
  agentName: string;
  taskId: string;
  step: number;
  scratchpad: ScratchpadEntry[];
  mood: AgentMood;
  status: RuntimeStatus;
  startTime: number;
  model?: string;
}

/**
 * Context built from memories, skills, and lessons
 */
export interface RuntimeContext {
  memories: string[];
  skills: any[];
  procedures: any[];
  lessons: string[];
  recentFailures: any[];
  resonance?: any;
}

/**
 * Tool call for action execution
 */
export interface ToolCall {
  tool: string;
  input: any;
}

/**
 * Runtime result
 */
export interface RuntimeResult {
  success: boolean;
  result?: string;
  error?: any;
  steps: number;
  duration: number;
  model: string;
  usedCache: boolean;
}

/**
 * Stop tokens to prevent hallucinated observations
 */
const STOP_TOKENS = ['\nObservation:', '\nFinal Answer:', '\n\nObservation:', '\n\nFinal Answer:'];

/**
 * Default max steps
 */
const DEFAULT_MAX_STEPS = 7;

/**
 * Confidence threshold for cached skill execution
 */
const CACHE_CONFIDENCE_THRESHOLD = 0.85;

/**
 * ReAct prompt builder
 */
function buildReActPrompt(
  task: Task,
  context: RuntimeContext,
  scratchpad: ScratchpadEntry[],
  tools: ToolRegistry
): string {
  const toolList = Object.keys(tools).join(', ');
  const memoriesText = context.memories.slice(0, 5).join('\n');
  const lessonsText = context.lessons.slice(0, 3).join('\n');
  const scratchpadText = scratchpad
    .map(e => `Thought: ${e.thought}\nAction: ${e.action}\nObservation: ${e.observation}`)
    .join('\n---\n');

  return `You are an AI agent solving a task step by step.

Available tools: ${toolList || 'none'}

Memories:
${memoriesText || 'none'}

Lessons learned:
${lessonsText || 'none'}

Task: ${task.description}

${scratchpadText ? `Previous steps:\n${scratchpadText}\n` : ''}
Think step by step. When you have enough information, respond with:
Final Answer: <your answer>

Otherwise respond with:
Thought: <your reasoning>
Action: <tool_name>({ <json input> })`;
}

/**
 * Parse action from LLM output
 */
function parseAction(text: string): ToolCall | null {
  const match = text.match(/Action:\s*(\w+)\(({[\s\S]*?})\)/);
  if (!match) return null;
  try {
    return { tool: match[1], input: JSON.parse(match[2]) };
  } catch {
    return { tool: match[1], input: {} };
  }
}

/**
 * Agent Runtime Engine
 */
export class AgentRuntimeEngine {
  private runtime: AgentRuntime;
  private toolCallHistory: Map<string, number>;
  private context: RuntimeContext | null = null;
  private llm: LLMProvider;
  private tools: ToolRegistry;

  constructor(
    agentId: string,
    agentName: string,
    task: Task,
    config: AgentRuntimeConfig
  ) {
    this.llm = config.llm;
    this.tools = config.tools ?? {};
    this.runtime = {
      agentId,
      agentName,
      taskId: task.taskId,
      step: 0,
      scratchpad: [],
      mood: 'curious',
      status: 'thinking',
      startTime: Date.now(),
    };
    this.toolCallHistory = new Map();
  }

  /**
   * Main entry point: Run ReAct loop for a task
   */
  async run(task: Task): Promise<RuntimeResult> {
    const startTime = Date.now();
    let usedCache = false;

    try {
      // Persist initial state so getRuntimeState() works
      await kv.set(
        KEYS.agentManifest(this.runtime.agentId),
        { taskId: task.taskId, status: 'running', startTime },
        { ex: 3600 }
      );

      await this.emitState('AGENT_STARTED', `Starting task: ${task.description}`);

      // STEP 1: Check SkillDB FIRST (Tesla Resonance)
      const cachedResult = await this.checkSkillCache(task);
      if (cachedResult) {
        usedCache = true;
        await this.emitState('SKILL_CACHE_HIT', `Using cached skill for task`);
        return {
          success: true,
          result: cachedResult,
          steps: 0,
          duration: Date.now() - startTime,
          model: 'cache',
          usedCache: true,
        };
      }

      // STEP 2: Build rich context
      this.context = await this.buildContext(task);
      await this.emitState('CONTEXT_BUILT', `Built context: ${this.context.memories.length} memories`);

      // STEP 3: Select model
      const model = await this.selectModel(task);
      this.runtime.model = model;
      await this.emitState('MODEL_SELECTED', `Selected model: ${model}`);

      // STEP 4: Full ReAct loop
      const result = await this.fullReActLoop(task);

      // STEP 5: Record performance
      await this.recordPerformance(task, true, Date.now() - startTime);

      // STEP 6: Record trust transaction
      await recordTrustTransaction(
        this.runtime.agentId,
        'system',
        this.runtime.agentId,
        0.1,
        `Completed task: ${task.taskId}`
      );

      return {
        success: true,
        result,
        steps: this.runtime.step,
        duration: Date.now() - startTime,
        model,
        usedCache,
      };

    } catch (error) {
      await this.handleFailure(task, error);
      return {
        success: false,
        error,
        steps: this.runtime.step,
        duration: Date.now() - startTime,
        model: this.runtime.model || 'unknown',
        usedCache,
      };
    }
  }

  /**
   * STEP 1: Check SkillDB for cached patterns (Tesla Resonance)
   */
  private async checkSkillCache(task: Task): Promise<string | null> {
    const skills = await getFeedbackSkills(this.runtime.agentId);
    if (skills.length === 0) return null;
    for (const skill of skills) {
      const similarity = this.calculateSimilarity(task.description, skill.prompt);
      if (similarity > CACHE_CONFIDENCE_THRESHOLD && skill.successCount >= 2) {
        return skill.response;
      }
    }
    return null;
  }

  /**
   * STEP 2: Build rich context
   */
  private async buildContext(task: Task): Promise<RuntimeContext> {
    const [memories, skills, procedures, recentFailures] = await Promise.all([
      this.fetchMemories(),
      getFeedbackSkills(this.runtime.agentId),
      getLearnedProcedures(this.runtime.agentId),
      FailureLearning.getRecentFailures(this.runtime.agentId, 5),
    ]);
    const lessons = recentFailures.map(f =>
      `Learned: ${f.attemptedAction} → ${f.error?.message || 'failed'}`
    );
    const resonance = await ResonanceEngine.getResonance(this.runtime.agentId);
    return { memories, skills, procedures, lessons, recentFailures, resonance };
  }

  /**
   * STEP 3: Select model based on mood + task complexity
   */
  private async selectModel(task: Task): Promise<string> {
    const manifest = await kv.get<any>(KEYS.agentManifest(this.runtime.agentId));
    const mood: AgentMood = manifest?.pet?.mood || 'curious';
    this.runtime.mood = mood;

    if (task.complexity === 'simple') return this.llm.model ?? 'gpt-4o-mini';
    if (mood === 'tired' || mood === 'sleep') return 'gpt-4o-mini';
    if (task.complexity === 'complex') return this.llm.model ?? 'gpt-4o';
    if (task.description.length < 100) return 'gpt-4o-mini';
    return this.llm.model ?? 'gpt-4o';
  }

  /**
   * STEP 4: Full ReAct loop
   */
  private async fullReActLoop(task: Task): Promise<string> {
    const maxSteps = task.maxSteps || DEFAULT_MAX_STEPS;
    let finalAnswer = '';

    while (this.runtime.step < maxSteps) {
      this.runtime.step++;
      this.runtime.status = 'thinking';

      // 1. Emit STEP_STARTED
      await emit({
        ring: BUS_RINGS.MIND,
        type: 'STEP_STARTED',
        agentId: this.runtime.agentId,
        agentName: this.runtime.agentName,
        message: `Step ${this.runtime.step} starting`,
        metadata: { step: this.runtime.step, maxSteps }
      });

      const prompt = buildReActPrompt(task, this.context!, this.runtime.scratchpad, this.tools);
      const thought = await this.llm.complete(prompt, STOP_TOKENS);
      await this.emitState('AGENT_THINKING', `Step ${this.runtime.step}: ${thought.slice(0, 80)}`);

      // 2. Emit THOUGHT_GENERATED
      await emit(createThoughtEvent(
        this.runtime.agentId,
        this.runtime.agentName,
        thought,
        this.runtime.step
      ));

      if (thought.toLowerCase().includes('final answer')) {
        finalAnswer = this.extractFinalAnswer(thought);
        this.runtime.status = 'done';
        await this.emitState('AGENT_DONE', `Completed in ${this.runtime.step} steps`);
        
        // Emit REFLECTION_COMPLETE for final step
        await emit({
          ring: BUS_RINGS.MIND,
          type: 'REFLECTION_COMPLETE',
          agentId: this.runtime.agentId,
          agentName: this.runtime.agentName,
          message: `Step ${this.runtime.step} complete`,
          metadata: { step: this.runtime.step, shouldContinue: false }
        });
        break;
      }

      this.runtime.status = 'acting';
      const action = parseAction(thought);

      if (!action) {
        finalAnswer = thought;
        this.runtime.status = 'done';
        
        // Emit REFLECTION_COMPLETE for no-action case
        await emit({
          ring: BUS_RINGS.MIND,
          type: 'REFLECTION_COMPLETE',
          agentId: this.runtime.agentId,
          agentName: this.runtime.agentName,
          message: `Step ${this.runtime.step} complete`,
          metadata: { step: this.runtime.step, shouldContinue: false }
        });
        break;
      }

      await this.emitState('AGENT_ACTING', `Action: ${action.tool}`);

      // 3. Emit ACTION_EXECUTING
      await emit(createActionEvent(
        this.runtime.agentId,
        this.runtime.agentName,
        action.tool,
        action.input,
        this.runtime.step
      ));

      if (this.detectLoop(action)) {
        finalAnswer = `Loop detected at step ${this.runtime.step}. Last observation: ${this.runtime.scratchpad.at(-1)?.observation ?? 'none'}`;
        this.runtime.status = 'done';
        
        // Emit REFLECTION_COMPLETE for loop detection
        await emit({
          ring: BUS_RINGS.MIND,
          type: 'REFLECTION_COMPLETE',
          agentId: this.runtime.agentId,
          agentName: this.runtime.agentName,
          message: `Step ${this.runtime.step} complete`,
          metadata: { step: this.runtime.step, shouldContinue: false }
        });
        break;
      }

      const observation = await this.executeAction(action);
      await this.emitState('AGENT_OBSERVATION', `Observation: ${observation.slice(0, 100)}`);

      // 4. Emit OBSERVATION_RECORDED
      await emit(createObservationEvent(
        this.runtime.agentId,
        this.runtime.agentName,
        observation,
        this.runtime.step
      ));

      this.runtime.scratchpad.push({
        thought,
        action: `${action.tool}(${JSON.stringify(action.input)})`,
        observation,
      });

      if (this.shouldStopEarly(observation)) {
        finalAnswer = observation;
        this.runtime.status = 'done';
        await this.emitState('AGENT_DONE', `Early stop with high confidence`);
        
        // Emit REFLECTION_COMPLETE for early stop
        await emit({
          ring: BUS_RINGS.MIND,
          type: 'REFLECTION_COMPLETE',
          agentId: this.runtime.agentId,
          agentName: this.runtime.agentName,
          message: `Step ${this.runtime.step} complete`,
          metadata: { step: this.runtime.step, shouldContinue: false }
        });
        break;
      }

      // 5. Emit REFLECTION_COMPLETE at end of iteration
      await emit({
        ring: BUS_RINGS.MIND,
        type: 'REFLECTION_COMPLETE',
        agentId: this.runtime.agentId,
        agentName: this.runtime.agentName,
        message: `Step ${this.runtime.step} complete`,
        metadata: { step: this.runtime.step, shouldContinue: true }
      });
    }

    if (this.runtime.step >= maxSteps && !finalAnswer) {
      finalAnswer = `Max steps (${maxSteps}) reached. Last thought: ${this.runtime.scratchpad.at(-1)?.thought ?? 'none'}`;
      await this.emitState('AGENT_MAX_STEPS', `Reached max steps (${maxSteps})`);
    }

    const steps: ProcedureStep[] = this.runtime.scratchpad.map(entry => ({
      tool: entry.action.split('(')[0],
      input: entry.action,
      output: entry.observation,
      success: true,
    }));
    await recordSuccessfulProcedure(this.runtime.agentId, task.description, steps);

    return finalAnswer;
  }

  /**
   * Loop detection
   */
  private detectLoop(action: ToolCall): boolean {
    const key = `${action.tool}:${JSON.stringify(action.input)}`;
    const count = this.toolCallHistory.get(key) || 0;
    this.toolCallHistory.set(key, count + 1);
    return count >= 2;
  }

  /**
   * Early stopping heuristic
   */
  private shouldStopEarly(observation: string): boolean {
    return ['success', 'completed', 'done', 'finished'].some(w =>
      observation.toLowerCase().includes(w)
    );
  }

  /**
   * Execute tool from registry
   */
  private async executeAction(action: ToolCall): Promise<string> {
    const tool = this.tools[action.tool];
    if (!tool) return `Tool "${action.tool}" not found. Available: ${Object.keys(this.tools).join(', ') || 'none'}`;
    try {
      return await tool(action.input);
    } catch (err: any) {
      return `Tool "${action.tool}" threw: ${err?.message ?? String(err)}`;
    }
  }

  /**
   * Extract final answer
   */
  private extractFinalAnswer(thought: string): string {
    const match = thought.match(/final answer[:\s]+(.+)/i);
    return match ? match[1].trim() : thought;
  }

  /**
   * Fetch memories for context
   */
  private async fetchMemories(): Promise<string[]> {
    const memoryTree = await ReadableMemory.getMemoryTree(this.runtime.agentId);
    const factsNode = memoryTree.children?.find((c: any) => c.id === 'facts');
    if (!factsNode?.children) return [];
    return factsNode.children.map((f: any) => f.metadata?.fullFact || f.label);
  }

  /**
   * Jaccard similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  /**
   * Emit state to bus
   */
  private async emitState(type: string, message: string): Promise<void> {
    await emit({
      ring: BUS_RINGS.MIND,
      type: type as any,
      agentId: this.runtime.agentId,
      agentName: this.runtime.agentName,
      message,
      metadata: {
        step: this.runtime.step,
        status: this.runtime.status,
        mood: this.runtime.mood,
        taskId: this.runtime.taskId,
      },
    });
  }

  /**
   * Record performance
   */
  private async recordPerformance(task: Task, success: boolean, duration: number): Promise<void> {
    const performance: TaskPerformance = {
      taskId: task.taskId,
      taskType: task.type || 'general',
      agentId: this.runtime.agentId,
      success,
      duration,
      quality: success ? 0.9 : 0.3,
      timestamp: Date.now(),
    };
    await ResonanceEngine.recordPerformance(performance);
    await ResonanceEngine.trackTaskType(this.runtime.agentId, performance.taskType);
  }

  /**
   * Handle failure
   */
  private async handleFailure(task: Task, error: any): Promise<void> {
    this.runtime.status = 'failed';
    await this.emitState('AGENT_FAILED', `Task failed: ${error?.message || 'Unknown error'}`);
    await FailureLearning.analyzeAndLearn(
      this.runtime.agentId,
      task.taskId,
      error,
      this.runtime.scratchpad.at(-1)?.action || 'unknown',
      false
    );
    await this.recordPerformance(task, false, Date.now() - this.runtime.startTime);
    await recordTrustTransaction(
      this.runtime.agentId,
      'system',
      this.runtime.agentId,
      -0.05,
      `Failed task: ${task.taskId}`
    );
    await PetOrchestrator.settle(this.runtime.agentId);
  }
}

/**
 * Convenience function
 */
export async function runTask(
  agentId: string,
  agentName: string,
  task: Task,
  config: AgentRuntimeConfig
): Promise<RuntimeResult> {
  const runtime = new AgentRuntimeEngine(agentId, agentName, task, config);
  return await runtime.run(task);
}

/**
 * Get runtime state
 */
export async function getRuntimeState(agentId: string, taskId: string): Promise<AgentRuntime | null> {
  return await kv.get<AgentRuntime>(KEYS.agentManifest(agentId));
}

/**
 * List active runtimes
 */
export async function listActiveRuntimes(agentId: string): Promise<AgentRuntime[]> {
  const activeTaskIds = await kv.smembers<string>(KEYS.agentSessions(agentId));
  if (activeTaskIds.length === 0) return [];
  const runtimes = await Promise.all(
    activeTaskIds.map(taskId => kv.get<AgentRuntime>(KEYS.agentManifest(agentId)))
  );
  return runtimes.filter((r): r is AgentRuntime => r !== null && r.status !== 'done' && r.status !== 'failed');
}
