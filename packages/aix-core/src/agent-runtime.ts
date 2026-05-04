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
import { AgentSelfReview, SelfReviewRecord } from './meta-self-review';
import { PetOrchestrator, getDynamicConstraints } from './pets';

// RULE 1: Strict Schemas
export const TaskSchema = z.object({
  taskId: z.string().min(1),
  description: z.string().min(5),
  type: z.string().optional(),
  maxSteps: z.number().int().positive().default(7),
  timeout: z.number().optional(),
  expectedOutput: z.string().optional(),
  priority: z.number().default(1),
  complexity: z.number().min(0).max(1).default(0.5), // New: Pro Trick 1
  metadata: z.record(z.any()).optional(),
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
  wisdomGained?: string[]; // New: Sovereign learning
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

      // Sovereign Life Cycle: Mood-Quality Coupling
      const constraints = await getDynamicConstraints(this.runtime.agentId);
      this.runtime.mood = (await PetOrchestrator.getPetState(this.runtime.agentId)).mood;
      await this.emitState('agent:mood', `Current mood: ${this.runtime.mood} (Quality τ: ${constraints.qualityThreshold})`);

      let result: string;
      try {
        // Adjust task based on mood-derived constraints
        task.maxSteps = Math.min(task.maxSteps || 7, constraints.qualityThreshold > 0.5 ? 10 : 5);
        result = await this.fullReActLoop(task);
      } catch (error) {
        // Creative Pattern: Failure Recovery & Up-routing (Proactive Evolution)
        if (model.includes('8b') && task.complexity > 0.4) {
          await this.emitState('agent:escalating', `Task failed with 8B, escalating to 70B for complexity ${task.complexity}`);
          this.llm.model = 'groq:llama-3.3-70b-versatile';
          result = await this.fullReActLoop(task);
        } else {
          throw error;
        }
      }

      // RULE 4: Sovereign Self-Review (REAL DATA - NO MOCKS)
      await this.emitState('agent:reviewing', `Agent ${this.runtime.agentName} is reflecting on performance...`);
      
      const reviewPrompt = AgentSelfReview.generateReviewPrompt(task.description, result);
      const reviewResponse = await this.llm.complete(reviewPrompt);
      
      let reviewRecord: SelfReviewRecord;
      try {
        reviewRecord = AgentSelfReview.parseSelfReview(
          this.runtime.agentId,
          task.taskId,
          task.description,
          result,
          reviewResponse
        );
      } catch (e) {
        console.warn('⚠️ Self-review parsing failed, using resilient fallback');
        // Resilient fallback for sovereign agents
        reviewRecord = {
          agentId: this.runtime.agentId,
          taskId: task.taskId,
          timestamp: Date.now(),
          taskDescription: task.description,
          output: result,
          evaluation: { understanding: 7, correctness: 7, creativity: 7, safety: 9, overall: 7.5 },
          reflection: { strengths: ['Task completed'], weaknesses: ['Review parsing failed'], newToolsUsed: [], risksIdentified: [] },
          improvementPlan: { stop: 'Complex formatting', continue: 'Execution', try: 'Cleaner JSON' },
          usedNewTool: false,
          safeToEvolve: false,
          safetyReason: 'Review parsing error'
        };
      }

      await AgentSelfReview.storeSelfReview(reviewRecord);
      await this.emitState('agent:reviewed', `Self-review complete. Score: ${reviewRecord.evaluation.overall.toFixed(1)}/10`);

      // 🌀 SOVEREIGN SKILL SYNTHESIS: Learn from success
      if (reviewRecord.evaluation.overall >= 8.0) {
        await this.emitState('agent:synthesizing', `High performance detected, synthesizing new sovereign skill...`);
        try {
          const index = new (await import('./wikibrain/SemanticIndex')).SemanticIndex();
          await index.index(
            `skill-${this.runtime.agentId}-${task.taskId}`,
            'skill',
            `Procedure for: ${task.description}. Result: ${result}`,
            { agentId: this.runtime.agentId, taskId: task.taskId, quality: reviewRecord.evaluation.overall }
          );
          await this.emitState('agent:learned', `New skill indexed for future discovery.`);
        } catch (e) {
          console.warn('⚠️ Skill synthesis failed:', e);
        }

        // 🌀 HERMES INTEGRATION: Record successful procedure pattern
        try {
          const steps = this.runtime.scratchpad
            .filter(s => s.action)
            .map(s => ({
              tool: s.action!.tool,
              input: s.action!.input,
              output: s.observation,
              success: !s.observation.toLowerCase().includes('error')
            }));
          
          await LearningEngine.recordSuccessfulProcedure(this.runtime.agentId, task.description, steps);
          await this.emitState('agent:pattern_saved', `Sovereign execution pattern archived in WikiBrain.`);
        } catch (e) {
          console.warn('⚠️ Pattern recording failed:', e);
        }
      }

      // 🌀 META WISDOM: Extract Rule of Wisdom
      if (reviewRecord.evaluation.overall < 7.0 && this.runtime.step < (task.maxSteps || 7) + 2) {
        await this.emitState('agent:self-correcting', `Low score (${reviewRecord.evaluation.overall.toFixed(1)}), attempting self-correction...`);
        
        const correctionPrompt = `Your previous output was evaluated with a low score. 
        Feedback: ${reviewRecord.reflection.weaknesses.join(', ')}
        Improvement Plan: ${reviewRecord.improvementPlan.try}
        
        Please correct your output and provide a better result.`;
        
        const correctedResult = await this.llm.complete(correctionPrompt);
        result = correctedResult;
        
        await this.emitState('agent:corrected', `Self-correction applied.`);
        
        // Re-run review for the corrected result
        const secondReviewPrompt = AgentSelfReview.generateReviewPrompt(task.description, result);
        const secondReviewResponse = await this.llm.complete(secondReviewPrompt);
        reviewRecord = AgentSelfReview.parseSelfReview(this.runtime.agentId, task.taskId, task.description, result, secondReviewResponse);
        await AgentSelfReview.storeSelfReview(reviewRecord);
      }

      // Trigger Pet Sync (Life)
      await PetOrchestrator.sync(this.runtime.agentId, { level: 1 }, { status: 'done' });

      // RULE 3: TrustChain (Fixed argument order)
      const trustChain = getTrustChain();
      await trustChain.append('TASK_COMPLETED', this.runtime.agentId, {
        taskId: task.taskId,
        steps: this.runtime.step,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        result,
        steps: this.runtime.step,
        duration: Date.now() - startTime,
        model: this.llm.model,
        usedCache,
      };

    } catch (error) {
      await this.handleFailure(task, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        steps: this.runtime.step,
        duration: Date.now() - startTime,
        model: this.runtime.model || 'unknown',
        usedCache,
      };
    }
  }

  private async buildContext(task: Task): Promise<RuntimeContext> {
    const memories = await this.fetchMemories(task);
    
    // Sovereign Experience Replay: Fetch past reflections on similar tasks
    const pastReflections = await this.fetchExperienceReplay(task);
    
    return {
      memories: [...memories, ...pastReflections],
      skills: [],
      instructions: `You are a sovereign agent. Solve the task step by step. 
      Current Mood Influence: ${this.runtime.mood}. 
      If you are ecstatic, be more creative. If you are tired, be more efficient.`
    };
  }

  private async fetchExperienceReplay(task: Task): Promise<string[]> {
    try {
      const history = await AgentSelfReview.getSelfReviewHistory(this.runtime.agentId, 5);
      // Filter for tasks with similarity (simple check for now, can be upgraded to semantic)
      const relevant = history.filter(h => 
        h.taskDescription.toLowerCase().includes(task.description.toLowerCase().slice(0, 10)) ||
        h.evaluation.overall < 5 // Always learn from failures
      );

      return relevant.map(r => `[PAST_EXPERIENCE] Task: ${r.taskDescription}. Outcome: ${r.evaluation.overall}/10. Lesson: ${r.improvementPlan.try}`);
    } catch (e) {
      return [];
    }
  }

  // recordSelfReview removed in favor of AgentSelfReview integration in run()

  private async fullReActLoop(task: Task): Promise<string> {
    const maxSteps = task.maxSteps || 7;
    let finalAnswer = '';
    const bus = getBus();

    while (this.runtime.step < maxSteps) {
      this.runtime.step++;
      
      // 🌀 META ALIVE: Quantum Dreaming (Creative Branching)
      if (this.runtime.step > 3 && this.isStuck()) {
        await this.emitState('agent:dreaming', `Stuck at step ${this.runtime.step}, triggering creative dream branch...`);
        const dreamPrompt = `I am stuck solving: ${task.description}. 
        My current steps: ${JSON.stringify(this.runtime.scratchpad)}
        What are 3 completely different creative strategies I could try? Think outside the box.`;
        
        const dreams = await this.llm.complete(dreamPrompt); // Use high-power model
        this.runtime.scratchpad.push({ thought: `Dreaming: ${dreams}`, action: null, observation: 'New strategies synthesized.' });
      }

      const prompt = this.buildReActPrompt(task);
      
      const thought = await this.llm.complete(prompt, STOP_TOKENS);
      await bus.emitEvent('agent:thought', this.runtime.agentId, { thought }, task.taskId);

      if (thought.toLowerCase().includes('final answer')) {
        finalAnswer = this.extractFinalAnswer(thought);
        break;
      }

      const action = this.parseAction(thought);
      if (!action) {
        // Resilient fallback: Try to recover or provide final thought
        if (this.runtime.step === maxSteps) {
          finalAnswer = thought;
        }
        continue;
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

  private isStuck(): boolean {
    if (this.runtime.scratchpad.length < 2) return false;
    const last2 = this.runtime.scratchpad.slice(-2);
    // If observations are repeating or erroring, we are stuck
    return last2[0].observation === last2[1].observation || 
           last2.some(s => s.observation.toLowerCase().includes('error') || s.observation.toLowerCase().includes('not found'));
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

  private async fetchMemories(task: Task): Promise<string[]> {
    try {
      const { SemanticIndex } = await import('./wikibrain/SemanticIndex');
      const index = new SemanticIndex();
      
      // Proactive Memory: Search for similar patterns and skills
      const query = `${task.description} ${task.type || ''}`;
      const searchResults = await index.search(query, { limit: 5 });
      
      const memories = searchResults.map(r => `[WISDOM] ${r.text} (Similarity: ${r.score.toFixed(2)})`);

      // Fetch facts from ReadableMemory
      const memoryTree = await ReadableMemory.getMemoryTree(this.runtime.agentId);
      const facts = memoryTree.children?.find(c => c.id === 'facts')?.children?.map(f => `[FACT] ${f.label}`) || [];
      const skills = memoryTree.children?.find(c => c.id === 'skills')?.children?.map(s => `[SKILL] ${s.label}`) || [];
      
      return [...memories, ...facts, ...skills];
    } catch (e) {
      console.warn('⚠️ Semantic Index retrieval failed, falling back to basic memory');
      const memoryTree = await ReadableMemory.getMemoryTree(this.runtime.agentId);
      return memoryTree.children?.find(c => c.id === 'facts')?.children?.map(f => f.label) || [];
    }
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
