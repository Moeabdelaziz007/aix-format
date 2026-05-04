/**
 * AIX Agent Runtime - Sovereign ReAct Loop
 * Made with Moe Abdelaziz
 */

import { z } from 'zod';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { getBus } from './bus';
import { getTrustChain } from './trust-chain';
import { ReadableMemory } from './memory-readable';
import { AgentRuntimeConfig, LLMProvider, ToolRegistry } from './llm-provider';
import { CircuitBreakers } from '@/lib/security-core';
import { searchTavily } from './tools/search-tavily';

// RULE 1: Strict Schemas
export const TaskSchema = z.object({
  taskId: z.string().min(1),
  description: z.string().min(5),
  type: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
  maxSteps: z.number().int().positive().default(7),
  timeout: z.number().optional(),
});

export const ToolCallSchema = z.object({
  tool: z.string(),
  input: z.any(),
});

export type Task = z.infer<typeof TaskSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;

export interface AgentRuntime {
  agentId: string;
  agentName: string;
  taskId: string;
  step: number;
  scratchpad: any[];
  mood: string;
  status: 'thinking' | 'running' | 'done' | 'failed';
  startTime: number;
  model?: string;
}

export interface RuntimeContext {
  memories: string[];
  skills: any[];
  instructions: string;
}

export interface RuntimeResult {
  success: boolean;
  result?: string;
  error?: any;
  steps: number;
  duration: number;
  model: string;
  usedCache: boolean;
}

const STOP_TOKENS = ['Observation:', 'Thought:'];

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
    TaskSchema.parse(task);
    
    this.llm = config.llm;
    this.tools = config.tools ?? {};

    // Auto-register Pro Stack Tools
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey && !this.tools.search) {
      this.tools.search = async (input: any) => {
        const query = typeof input === 'string' ? input : (input.query || JSON.stringify(input));
        return await searchTavily(query, tavilyKey);
      };
    }

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

  async run(task: Task): Promise<RuntimeResult> {
    const startTime = Date.now();
    let usedCache = false;

    try {
      TaskSchema.parse(task);
      
      await kv.set(
        KEYS.agentManifest(this.runtime.agentId),
        { taskId: task.taskId, status: 'running', startTime },
        { ex: 3600 }
      );

      await this.emitState('agent:started', `Starting task: ${task.description}`);

      this.context = await this.buildContext(task);
      const model = this.llm.model || 'unknown-model';
      this.runtime.model = model;

      const result = await this.fullReActLoop(task);

      // RULE 4: Self Review
      await this.recordSelfReview(task, result);

      // RULE 3: TrustChain
      const trustChain = getTrustChain();
      await trustChain.append(this.runtime.agentId, 'TASK_COMPLETED', {
        taskId: task.taskId,
        steps: this.runtime.step,
        duration: Date.now() - startTime
      });

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

  private async buildContext(task: Task): Promise<RuntimeContext> {
    const memories = await this.fetchMemories();
    return {
      memories,
      skills: [],
      instructions: "You are a sovereign agent. Solve the task step by step."
    };
  }

  private async recordSelfReview(task: Task, result: string): Promise<void> {
    const reviewData = {
      agentId: this.runtime.agentId,
      taskId: task.taskId,
      outcome: result,
      steps: this.runtime.step,
      timestamp: Date.now(),
      self_score: 0.9
    };
    await kv.lpush(KEYS.agentSelfReviewHistory(this.runtime.agentId), JSON.stringify(reviewData));
  }

  private async fullReActLoop(task: Task): Promise<string> {
    const maxSteps = task.maxSteps || 7;
    let finalAnswer = '';
    const bus = getBus();

    while (this.runtime.step < maxSteps) {
      this.runtime.step++;
      const prompt = this.buildReActPrompt(task);
      
      const thought = await this.llm.complete(prompt, STOP_TOKENS);
      await bus.emitEvent('agent:thought', this.runtime.agentId, { thought }, task.taskId);

      if (thought.toLowerCase().includes('final answer')) {
        finalAnswer = this.extractFinalAnswer(thought);
        break;
      }

      const action = this.parseAction(thought);
      if (!action) {
        finalAnswer = thought;
        break;
      }

      ToolCallSchema.parse(action);
      await bus.emitEvent('agent:action', this.runtime.agentId, { action }, task.taskId);

      const observation = await this.executeAction(action);
      await bus.emitEvent('agent:observation', this.runtime.agentId, { observation }, task.taskId);
      
      this.runtime.scratchpad.push({ thought, action, observation });

      if (this.shouldStopEarly(observation)) {
        finalAnswer = observation;
        break;
      }
    }

    return finalAnswer || "Task incomplete within step limit.";
  }

  private buildReActPrompt(task: Task): string {
    return `Task: ${task.description}\nContext: ${this.context?.memories.join('. ')}\n\nAvailable Tools: ${Object.keys(this.tools).join(', ')}\n\nSteps:\n${this.runtime.scratchpad.map(s => `Thought: ${s.thought}\nAction: ${JSON.stringify(s.action)}\nObservation: ${s.observation}`).join('\n')}\nThought: `;
  }

  private parseAction(thought: string): ToolCall | null {
    const match = thought.match(/Action:\s*(\{.*\})/s);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  private shouldStopEarly(observation: string): boolean {
    return ['success', 'completed', 'done', 'finished'].some(w =>
      observation.toLowerCase().includes(w)
    );
  }

  private async executeAction(action: ToolCall): Promise<string> {
    const tool = this.tools[action.tool];
    if (!tool) return `Tool "${action.tool}" not found.`;
    try {
      return await tool(action.input);
    } catch (err: any) {
      return `Error: ${err?.message ?? String(err)}`;
    }
  }

  private extractFinalAnswer(thought: string): string {
    const match = thought.match(/final answer[:\s]+(.+)/i);
    return match ? match[1].trim() : thought;
  }

  private async fetchMemories(): Promise<string[]> {
    const memoryTree = await ReadableMemory.getMemoryTree(this.runtime.agentId);
    return memoryTree.children?.find(c => c.id === 'facts')?.children?.map(f => f.label) || [];
  }

  private async emitState(type: string, message: string): Promise<void> {
    const bus = getBus();
    await bus.emitEvent(type, this.runtime.agentId, { message }, this.runtime.taskId);
  }

  private async handleFailure(task: Task, error: any): Promise<void> {
    this.runtime.status = 'failed';
    await this.emitState('agent:error', `Task failed: ${error?.message || 'Unknown error'}`);
  }
}

export async function runTask(
  agentId: string,
  agentName: string,
  task: Task,
  config: AgentRuntimeConfig
): Promise<RuntimeResult> {
  const runtime = new AgentRuntimeEngine(agentId, agentName, task, config);
  return await runtime.run(task);
}

// Made with Moe Abdelaziz
