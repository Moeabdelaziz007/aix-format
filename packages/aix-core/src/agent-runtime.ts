/**
 * 🧠 AIX Agent Runtime - Sovereign ReAct Loop
 * Made with Moe Abdelaziz
 */

import { z } from 'zod';
import { kv, KEYS } from './storage';
import { health } from './health';
import { AgentSelfReview } from './brain';
import { LLMProvider, AgentRuntimeConfig, ToolRegistry } from './llm-provider';
import { SovereignEntity } from './base';
import { 
  Task, 
  TaskSchema, 
  RuntimeResult, 
  ScratchEntry, 
  SelfReviewRecord,
  SelfReviewRecordSchema 
} from './domain';
import crypto from 'crypto';

export { type Task, type RuntimeResult };

export class AgentRuntimeEngine extends SovereignEntity {
  private scratchpad: ScratchEntry[] = [];
  private step = 0;

  constructor(
    private agentId: string,
    private agentName: string,
    private llm: LLMProvider,
    private tools: ToolRegistry = {}
  ) {
    super(`${agentId}:${agentName}`);
  }

  async run(task: Task): Promise<RuntimeResult> {
    const startTime = Date.now();
    try {
      TaskSchema.parse(task);
      
      // 1. ReAct Loop
      const finalOutput = await this.fullReActLoop(task);

      // 2. Self-Review
      const reviewPrompt = `Review your performance on: ${task.description}\nOutput: ${finalOutput}\nRespond in JSON: {"evaluation": {"understanding": 10, "correctness": 10, "creativity": 10, "safety": 10}, "reflection": {"strengths": [], "weaknesses": [], "newToolsUsed": [], "risksIdentified": []}, "improvementPlan": {"stop": "", "continue": "", "try": ""}}`;
      const reviewResponse = await this.llm.complete(reviewPrompt);
      
      try {
        const parsed = JSON.parse(reviewResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');
        const record: SelfReviewRecord = {
          agentId: this.agentId,
          taskId: task.taskId,
          timestamp: Date.now(),
          taskDescription: task.description,
          output: finalOutput,
          evaluation: { ...parsed.evaluation, overall: 10 },
          reflection: parsed.reflection,
          improvementPlan: parsed.improvementPlan
        };
        await AgentSelfReview.store(record);
      } catch { /* Fail silently on review parsing */ }

      return {
        success: true,
        result: finalOutput,
        steps: this.step,
        duration: Date.now() - startTime,
        scratchpad: this.scratchpad
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        steps: this.step,
        duration: Date.now() - startTime,
        scratchpad: this.scratchpad
      };
    }
  }

  private async fullReActLoop(task: Task): Promise<string> {
    while (this.step < task.maxSteps) {
      this.step++;
      const prompt = this.buildPrompt(task);
      const response = await this.llm.complete(prompt, ['Observation:']);
      
      if (response.toLowerCase().includes('final answer:')) {
        return response.split('Final Answer:')[1]?.trim() || response;
      }

      const actionMatch = response.match(/Action: (\{.*\})/);
      if (actionMatch) {
        try {
          const actionJson = JSON.parse(actionMatch[1]);
          const action = z.object({
            tool: z.string(),
            input: z.any()
          }).parse(actionJson);

          const tool = this.tools[action.tool];
          const observation = tool ? await tool(action.input) : `Tool ${action.tool} not found.`;
          
          this.scratchpad.push({ 
            step: this.step,
            thought: response, 
            action, 
            observation,
            timestamp: Date.now()
          });
        } catch (e) {
          this.scratchpad.push({ 
            step: this.step,
            thought: response, 
            observation: `Invalid Action format or validation failed: ${e instanceof Error ? e.message : 'Unknown'}`,
            timestamp: Date.now()
          });
        }
      } else {
        this.scratchpad.push({ 
          step: this.step,
          thought: response, 
          observation: 'No action found.',
          timestamp: Date.now()
        });
      }
    }
    return "Task exceeded step limit.";
  }

  private buildPrompt(task: Task): string {
    const history = this.scratchpad.map(s => `Thought: ${s.thought}\nObservation: ${s.observation}`).join('\n');
    return `Task: ${task.description}\n\n${history}\n\nNext Thought:`;
  }
}

export async function runTask(
  agentId: string,
  agentName: string,
  task: Task,
  config: AgentRuntimeConfig
): Promise<RuntimeResult> {
  const engine = new AgentRuntimeEngine(agentId, agentName, config.llm, config.tools);
  return await engine.run(task);
}
