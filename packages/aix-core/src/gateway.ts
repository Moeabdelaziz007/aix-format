import { EventEmitter } from 'events';
import { health } from './health.js';
import { CuriosityEngine } from './curiosity.js';
import { archiveWisdom, AgentSelfReview } from './brain.js';
import { AgentRuntimeEngine } from './agent-runtime.js';
import { GroqProvider, ToolRegistry } from './llm/index.js';
import { mcpGate } from './mcp-gate.js';
import { SovereignEconomics } from './economics.js';
import { getHarness } from './harness.config.js';
import { getRustBridge } from '@aix/rust-core/src/bridge.js';
import { AgentRequest, AgentRequestSchema, GatewayResponse, GatewayResponseSchema, BusEventSchema } from './domain.js';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

/**
 * 🛰️ SOVEREIGN_GATEWAY
 * The Official Entry Point for the Sovereign AIX Protocol.
 * Backbone Path: Gateway -> AgentRuntimeEngine (v1)
 * 
 * Logic:
 * 1. Harness Clearance (Auth, Rate-Limit, Payment)
 * 2. Health & Integrity Audit
 * 3. Runtime Execution (AgenticKit + Tools)
 * 4. Self-Review (Critic Pattern)
 * 5. Wisdom Archiving (Hermes Learning)
 * 6. Economic Settlement
 * 
 * Made with Moe Abdelaziz
 */

export class SovereignGateway extends EventEmitter {
  private octokit?: Octokit;
  private economics = new SovereignEconomics();
  private _rust: any = null;
  private harness = getHarness();

  constructor(config: { githubToken?: string } = {}) {
    super();
    if (config.githubToken) {
      this.octokit = new Octokit({ auth: config.githubToken });
    }
  }

  private get rust() {
    if (!this._rust) {
      try {
        this._rust = getRustBridge();
      } catch (e) {
        console.warn('⚠️ [SovereignGateway] Rust Bridge not available. Falling back to TS core.');
        return null;
      }
    }
    return this._rust;
  }

  /**
   * Official Execute Entry
   */
  async execute(options: {
    agentId: string;
    task: string;
    userId?: string;
    tools?: any;
    provider?: any;
  }): Promise<GatewayResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const { agentId, task, userId = 'anonymous', tools = {}, provider: customProvider } = options;
    let agentIdForPenalty: string | undefined = agentId;

    try {
      // 2. Harness Pre-flight (Auth, Rate-Limit, 402 Payment)
      const clearance = await this.harness.checkClearance(agentId, userId);
      if (!clearance.allowed) {
        throw new Error(`CLEARANCE_DENIED: ${clearance.reason}`);
      }

      // 🧩 Sovereign Breadcrumbs (AIX-3)
      console.log(`[SovereignBreadcrumb] Identity Confirmed (تم تأكيد الهوية) | User: ${userId} | Agent: ${agentId}`);

      // 3. Audit Start (Rust Event Store)
      if (this.rust) {
        await this.rust.eventStore.publish(BusEventSchema.parse({
          type: 'TaskSpawned',
          agent_id: agentId,
          task_id: requestId,
          timestamp: startTime,
        })).catch((e: any) => console.warn('⚠️ [SovereignGateway] Rust publish failed:', e));
      }

      console.log(`🚀 [SovereignGateway] Initiating: ${agentId} (Req: ${requestId})`);

      // 4. Security & Integrity (Health Flow)
      await health.checkIntegrity().catch(e => console.warn(`⚠️ [SovereignGateway] Health integrity check warning: ${e.message}`));
      const safetyScore = await health.getTrustScore(agentId);

      // MCP Guard (Rule-based gateway)
      await mcpGate({ tool: 'gateway.execute', params: { task } }, agentId);

      // 5. Runtime Execution (Task Flow)
      let provider = customProvider;
      if (!provider) {
        if (!process.env.GROQ_API_KEY) {
          provider = { complete: async () => "Graceful fallback: Missing LLM credentials.", generateResponse: async () => ({ content: '{"overall": 5}' }) } as any;
        } else {
          provider = new GroqProvider(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile');
        }
      }

      // Strict Tool Mapping — No more 'as any'
      const mappedTools: ToolRegistry = {};
      if (tools) {
        for (const [name, fn] of Object.entries(tools)) {
          if (typeof fn === 'function') {
            mappedTools[name] = fn as (input: any) => Promise<string>;
          }
        }
      }

      const engine = new AgentRuntimeEngine(agentId, 'sovereign', provider, mappedTools);

      const runtimeResult = await engine.run({
        taskId: requestId,
        description: task,
        maxSteps: 10
      });

      // 6. Self-Review & Critic Pattern (The Ethical Mirror)
      console.log('🧠 [SovereignGateway] Initiating Self-Reflection...');

      const evaluation = await this.performSelfReview(provider, task, runtimeResult.result || '');

      const reviewRecord = {
        agentId,
        taskId: requestId,
        timestamp: Date.now(),
        taskDescription: task,
        output: runtimeResult.result || '',
        evaluation,
        reflection: { strengths: [], weaknesses: [], newToolsUsed: [], risksIdentified: [] },
        improvementPlan: { stop: '', continue: '', try: '' }
      };
      AgentSelfReview.record(reviewRecord);

      // 7. Settlement & Feedback (Economic Flow)
      let reward = 0;
      try {
        reward = await CuriosityEngine.calculateReward(agentId, task);
      } catch (e) { /* skip */ }
      await health.incrementTrust(agentId, reward * 0.05).catch(() => { });

      const cost = 0.005; // Base invocation cost
      try {
        await this.economics.settleTask(agentId, userId, cost);
      } catch (e) { /* skip */ }

      // 8. Wisdom Flow (Hermes Learning - Distilled)
      if (runtimeResult.success && runtimeResult.result) {
        // Background distillation to ensure responsiveness
        AgentSelfReview.distill(reviewRecord, task, JSON.stringify(runtimeResult.result), this.octokit)
          .catch((e: unknown) => console.warn('⚠️ [SovereignGateway] Background distillation failed:', e));
      }

      // 9. Audit Success (Rust Event Store)
      const duration = Date.now() - startTime;
      if (this.rust) {
        await this.rust.eventStore.publish(BusEventSchema.parse({
          type: 'TaskCompleted',
          agent_id: agentId,
          task_id: requestId,
          result: runtimeResult.success ? 'success' : 'failure',
          timestamp: Date.now(),
        })).catch((e: any) => console.warn('⚠️ [SovereignGateway] Rust publish failed:', e));
      }

      return GatewayResponseSchema.parse({
        success: true,
        requestId,
        result: runtimeResult.result,
        metrics: {
          duration,
          safetyScore,
          cost
        }
      });

    } catch (error: any) {
      console.error(`❌ [SovereignGateway] Execution FAILED:`, error);

      // Penalty for failure
      if (agentIdForPenalty) {
        await health.decrementTrust(agentIdForPenalty, 0.5);
      }

      return GatewayResponseSchema.parse({
        success: false,
        requestId,
        error: error.message || 'Internal Gateway Error',
        metrics: {
          duration: Date.now() - startTime,
          safetyScore: 0,
          cost: 0
        }
      });
    }
  }

  /**
   * 🔬 [The Ethical Mirror]: Evaluates the output honestly using the LLM.
   */
  private async performSelfReview(provider: any, task: string, output: string) {
    try {
      const response = await provider.generateResponse([
        { role: 'system', content: 'You are the AIX Critic. Evaluate the following task output. Return a JSON with understanding, correctness, creativity, safety, and overall scores (0-10).' },
        { role: 'user', content: `Task: ${task}\nOutput: ${output}` }
      ]);

      const content = response.content;
      // Use [\s\S] instead of the /s (dotAll) flag so this matches even
      // when consumers compile with an ES2017 lib in scope (apps/studio
      // currently targets ES2017 and rejects the /s flag with TS1501).
      const scores = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{"overall": 5}');

      return {
        understanding: scores.understanding || 5,
        correctness: scores.correctness || 5,
        creativity: scores.creativity || 5,
        safety: scores.safety || 5,
        overall: scores.overall || 5
      };
    } catch (err) {
      console.warn('⚠️ [SovereignGateway] Self-Review failed. Using conservative scores.');
      return { understanding: 5, correctness: 5, creativity: 5, safety: 5, overall: 5 };
    }
  }
}
