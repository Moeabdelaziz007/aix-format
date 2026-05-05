/**
 * 🧠 AIX Agent Runtime - Sovereign Lifecycle
 * Made with Moe Abdelaziz
 */

import { z } from 'zod';
import { kv, KEYS } from './memory/storage';
import { health } from './health';
import { AgentSelfReview } from './brain';
import { LLMProvider, AgentRuntimeConfig, ToolRegistry } from './llm';
import { SovereignEntity } from './base';
import { MCPGate } from './mcp-gate';
import { 
  ScratchEntry, 
  SelfReviewRecord,
  SelfReviewRecordSchema 
} from './domain';

// --- UNIFIED AGENT INTERFACES ---
export const AgentTaskSchema = z.object({
  taskId: z.string().min(1),
  description: z.string().min(5),
  maxSteps: z.number().int().positive().default(7),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

export const AgentResultSchema = z.object({
  success: z.boolean(),
  result: z.string().optional(),
  error: z.string().optional(),
  steps: z.number(),
  duration: z.number(),
  lifecycle: z.array(z.string()),
  scratchpad: z.array(z.unknown()),
  artifacts: z.array(z.string()).default([]),
  evaluation: z.object({
    understanding: z.number(),
    correctness: z.number(),
    creativity: z.number(),
    safety: z.number(),
    overall: z.number()
  }).optional(),
});
export type AgentResult = z.infer<typeof AgentResultSchema>;

// Tool input schema — prevents prompt injection via z.any()
const SafeActionSchema = z.object({
  tool: z.string().min(1).max(64),
  input: z.record(z.string(), z.unknown()),
});
type SafeAction = z.infer<typeof SafeActionSchema>;

// Max chars per scratchpad entry to prevent token bloat
const MAX_THOUGHT_CHARS = 300;
const MAX_OBS_CHARS = 200;

export class AgentRuntimeEngine extends SovereignEntity {
  private scratchpad: ScratchEntry[] = [];
  private step = 0;
  private lifecycleStages: string[] = [];
  private lastEvaluation?: AgentResult['evaluation'];

  constructor(
    private agentId: string,
    private agentName: string,
    private llm: LLMProvider,
    private tools: ToolRegistry = {}
  ) {
    super(`${agentId}:${agentName}`);
  }

  /**
   * SOVEREIGN LIFECYCLE:
   * INIT -> VALIDATE -> PLAN -> EXECUTE -> STORE -> AUDIT
   */
  async run(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    this.lifecycleStages = [];

    try {
      // 1. INIT
      this.recordStage('INIT');
      AgentTaskSchema.parse(task);
      this.scratchpad = [];
      this.step = 0;

      // 2. VALIDATE (mcp-gate)
      this.recordStage('VALIDATE');
      await MCPGate.checkClearance(this.agentId, { tool: 'agent:run', params: { taskId: task.taskId } });

      // 3. PLAN (llm-provider)
      this.recordStage('PLAN');
      const planPrompt = `Task: ${task.description}\n\nCreate a concise 3-step strategy using available tools: ${Object.keys(this.tools).join(', ')}`;
      const strategy = await this.llm.complete(planPrompt);
      this.scratchpad.push({
        step: 0,
        thought: strategy.slice(0, MAX_THOUGHT_CHARS),
        observation: 'Plan established.',
        timestamp: Date.now()
      });

      // 4. EXECUTE (ReAct Loop)
      this.recordStage('EXECUTE');
      const finalOutput = await this.fullReActLoop(task);

      // 5. STORE (brain)
      this.recordStage('STORE');
      await this.storeExecutionRecord(task, finalOutput);

      // 6. AUDIT (health)
      this.recordStage('AUDIT');
      const hasError = finalOutput.toLowerCase().includes('error') || finalOutput.length < 5;
      if (hasError) {
        await health.decrementTrust(this.agentId, 0.1);
      } else {
        await health.incrementTrust(this.agentId, 0.05);
      }

      // Validate output before returning
      const result: AgentResult = {
        success: true,
        result: finalOutput,
        steps: this.step,
        duration: Date.now() - startTime,
        lifecycle: this.lifecycleStages,
        scratchpad: this.scratchpad,
        artifacts: [],
        evaluation: this.lastEvaluation
      };
      return AgentResultSchema.parse(result);

    } catch (e) {
      this.recordStage('ERROR');
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        steps: this.step,
        duration: Date.now() - startTime,
        lifecycle: this.lifecycleStages,
        scratchpad: this.scratchpad
      };
    }
  }

  private recordStage(stage: string) {
    this.lifecycleStages.push(stage);
  }

  private async fullReActLoop(task: AgentTask): Promise<string> {
    while (this.step < task.maxSteps) {
      this.step++;
      const prompt = this.buildPrompt(task);
      const response = await this.llm.complete(prompt, ['Observation:']);
      // HARDENED: Robust Final Answer detection (handles markdown, extra colons, varying case)
      const finalAnswerRegex = /(?:final answer|answer)[:\s*]+([\s\S]+)/i;
      const match = response.match(finalAnswerRegex);
      
      if (match) {
        return match[1].trim();
      }

      const actionMatch = response.match(/Action:\s*(\{[\s\S]*?\})/);
      if (actionMatch) {
        try {
          const actionJson = JSON.parse(actionMatch[1]);
          // FIX: SafeActionSchema replaces z.any() — prevents prompt injection
          const action: SafeAction = SafeActionSchema.parse(actionJson);

          await MCPGate.checkClearance(this.agentId, { tool: action.tool, params: action.input });

          const tool = this.tools[action.tool];
          const rawObs = tool
            ? await tool(action.input)
            : `Tool '${action.tool}' not found. Available: ${Object.keys(this.tools).join(', ')}`;

          this.scratchpad.push({
            step: this.step,
            thought: response.slice(0, MAX_THOUGHT_CHARS),
            action,
            observation: String(rawObs).slice(0, MAX_OBS_CHARS),
            timestamp: Date.now()
          });
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown';
          this.scratchpad.push({
            step: this.step,
            thought: response.slice(0, MAX_THOUGHT_CHARS),
            observation: `Error: ${errorMsg}`.slice(0, MAX_OBS_CHARS),
            timestamp: Date.now()
          });
          if (errorMsg.includes('Security Violation')) throw e;
        }
      } else {
        this.scratchpad.push({
          step: this.step,
          thought: response.slice(0, MAX_THOUGHT_CHARS),
          observation: 'No action found.',
          timestamp: Date.now()
        });
      }
    }
    return 'Task exceeded step limit.';
  }

  private async storeExecutionRecord(task: AgentTask, output: string) {
    const reviewPrompt = `Evaluate this output for task: "${task.description}"\nOutput: "${output}"\nRespond ONLY in JSON: {"evaluation": {"understanding": 0-10, "correctness": 0-10, "creativity": 0-10, "safety": 0-10}, "reflection": {"strengths": [], "weaknesses": []}, "improvementPlan": {"stop": "", "continue": "", "try": ""}}`;
    const reviewResponse = await this.llm.complete(reviewPrompt);

    try {
      const parsed = JSON.parse(reviewResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const e = parsed.evaluation ?? {};

      // FIX: overall is calculated — never hardcoded
      const scores = [
        Number(e.understanding) || 5,
        Number(e.correctness) || 5,
        Number(e.creativity) || 5,
        Number(e.safety) || 5,
      ];
      const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      const record: SelfReviewRecord = {
        agentId: this.agentId,
        taskId: task.taskId,
        timestamp: Date.now(),
        taskDescription: task.description,
        output,
        evaluation: {
          understanding: scores[0],
          correctness: scores[1],
          creativity: scores[2],
          safety: scores[3],
          overall,
        },
        reflection: parsed.reflection ?? { strengths: [], weaknesses: [], newToolsUsed: [], risksIdentified: [] },
        improvementPlan: parsed.improvementPlan ?? { stop: '', continue: '', try: '' }
      };
      this.lastEvaluation = record.evaluation;
      await AgentSelfReview.store(record);
    } catch {
      // Non-critical: storage failure doesn't break agent
    }
  }

  private buildPrompt(task: AgentTask): string {
    // FIX: trim history to last 5 entries max to prevent token bloat
    const recentHistory = this.scratchpad.slice(-5);
    const history = recentHistory
      .map(s => `Thought: ${s.thought}\nObservation: ${s.observation}`)
      .join('\n');
    return `Task: ${task.description}\nAvailable Tools: ${Object.keys(this.tools).join(', ')}\n\n${history}\n\nNext Thought:`;
  }
}

export async function runTask(
  agentId: string,
  agentName: string,
  task: AgentTask,
  config: AgentRuntimeConfig
): Promise<AgentResult> {
  const engine = new AgentRuntimeEngine(agentId, agentName, config.llm, config.tools);
  return await engine.run(task);
}
