/**
 * 🛰️ AIX Sovereign Gateway
 * Central Orchestrator for Autonomous Agent Execution.
 * Made with Moe Abdelaziz
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { kv, KEYS } from './storage';
import { health } from './health';
import { archiveWisdom } from './brain';
import { CuriosityEngine } from './curiosity';
import { mcpGate } from './mcp-gate';
import { runTask } from './agent-runtime';
import { SwarmRouter } from './swarm';
import { GroqProvider } from './llm-provider';
import { Langfuse } from 'langfuse';
import { Octokit } from '@octokit/rest';

export interface SpawnConfig {
  type: string;
  tools?: Record<string, any>;
  [key: string]: any;
}

export class Gateway extends EventEmitter {
  private actionHandlers = new Map<string, (params: any, mood?: string) => Promise<any>>();
  private agents = new Map<string, any>();
  private langfuse?: Langfuse;
  private octokit?: Octokit;

  constructor() {
    super();
    this.registerDefaultHandlers();
    
    if (process.env.LANGFUSE_PUBLIC_KEY) {
      this.langfuse = new Langfuse({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
      });
    }

    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    }
  }

  async spawn(agentId: string, config: SpawnConfig) {
    this.agents.set(agentId, { id: agentId, config, createdAt: Date.now() });
    this.emit('agent:spawned', { agentId });
    return { success: true, agentId };
  }

  async run(agentId: string, input: any): Promise<any> {
    const startTime = Date.now();
    const taskDescription = typeof input === 'string' ? input : JSON.stringify(input);

    // 1. Conditional Evolution Throttle (6h)
    const lastRun = await kv.get<number>(KEYS.agentLastActivity(agentId)) || 0;
    const hoursSince = (Date.now() - lastRun) / 3600000;
    if (hoursSince < 6 && !input?.forced) {
      return { success: true, skipped: true, reason: 'Cool-down period active' };
    }
    await kv.set(KEYS.agentLastActivity(agentId), Date.now());

    const trace = this.langfuse?.trace({ name: `agent-run-${agentId}`, userId: agentId });

    try {
      // 2. Sovereign Safety & Health Checks
      await mcpGate({ tool: 'run', params: { input } }, agentId);
      
      if (await health.detectOscillation(agentId)) {
        this.emit('gateway:stabilizing', { agentId });
      }

      if (!(await health.verifyCodeIntegrity())) {
        throw new Error("CRITICAL: Code integrity breach detected.");
      }

      // 3. Dynamic Routing & Execution
      const router = new SwarmRouter();
      const model = await router.getDecisionModel(taskDescription);
      
      const result = await runTask(agentId, agentId, {
        taskId: `task-${crypto.randomBytes(4).toString('hex')}`,
        description: taskDescription,
      }, {
        llm: new GroqProvider(process.env.GROQ_API_KEY!, model),
        tools: this.agents.get(agentId)?.config.tools || {}
      });

      // 4. Meta-Loop: Learning & Curiosity
      const reward = await CuriosityEngine.calculateReward(agentId, taskDescription);
      await health.incrementTrust(agentId, reward * 0.05);

      if (result.success && result.result?.length > 50) {
        await archiveWisdom(agentId, input, result.result, this.octokit);
      }

      this.emit('agent:completed', { agentId, result });
      trace?.update({ output: result });
      return result;

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      trace?.update({ output: { error: msg }, level: 'ERROR' });
      this.emit('agent:error', { agentId, error: msg });
      throw error;
    }
  }

  private registerDefaultHandlers() {
    this.registerHandler('monitor', async (params) => {
      const score = await health.getTrustScore(params.agentId);
      return { status: score > 5 ? 'healthy' : 'degraded', score };
    });
  }

  registerHandler(action: string, handler: (params: any, mood?: string) => Promise<any>) {
    this.actionHandlers.set(action, handler);
  }

  reset() {
    this.agents.clear();
    this.removeAllListeners();
  }
}

let instance: Gateway | null = null;
export function getGateway() { return instance || (instance = new Gateway()); }
export function resetGateway() { instance?.reset(); instance = null; }
