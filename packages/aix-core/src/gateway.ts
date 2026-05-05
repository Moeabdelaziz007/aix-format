import { EventEmitter } from 'events';
import { health } from './health';
import { CuriosityEngine } from './curiosity';
import { archiveWisdom, AgentSelfReview } from './brain';
import { AgentRuntimeEngine } from './agent-runtime';
import { GroqProvider } from './llm';
import { mcpGate } from './mcp-gate';
import { SovereignEconomics } from './economics';
import { getHarness } from './harness.config';
import { getRustBridge } from '@aix/rust-core/src/bridge';
import { AgentRequest, AgentRequestSchema, GatewayResponse, GatewayResponseSchema, BusEventSchema } from './domain';
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
  private rust = getRustBridge();
  private harness = getHarness();

  constructor(config: { githubToken?: string } = {}) {
    super();
    if (config.githubToken) {
      this.octokit = new Octokit({ auth: config.githubToken });
    }
  }

  /**
   * Official Execute Entry
   */
  async execute(requestInput: unknown): Promise<GatewayResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    let agentIdForPenalty: string | undefined;

    try {
      // 1. Parse and Validate Request
      const request = AgentRequestSchema.parse(requestInput);
      const { agentId, task, userId = 'anonymous', tools = {} } = request;
      agentIdForPenalty = agentId;

      // 2. Harness Pre-flight (Auth, Rate-Limit, 402 Payment)
      const clearance = await this.harness.checkClearance(agentId, userId);
      if (!clearance.allowed) {
        throw new Error(`CLEARANCE_DENIED: ${clearance.reason}`);
      }
      
      // 🧩 Sovereign Breadcrumbs (AIX-3)
      console.log(`[SovereignBreadcrumb] Identity Confirmed (تم تأكيد الهوية) | User: ${userId} | Agent: ${agentId}`);

      // 3. Audit Start (Rust Event Store)
      await this.rust.eventStore.publish(BusEventSchema.parse({
        type: 'TaskSpawned',
        agent_id: agentId,
        task_id: requestId,
        timestamp: startTime,
      }));

      console.log(`🚀 [SovereignGateway] Initiating: ${agentId} (Req: ${requestId})`);

      // 4. Security & Integrity (Health Flow)
      await health.checkIntegrity();
      const safetyScore = await health.getTrustScore(agentId);
      
      // MCP Guard (Rule-based gateway)
      await mcpGate({ tool: 'gateway.execute', params: { task } }, agentId);

      // 5. Runtime Execution (Task Flow)
      // Note: In a real prod env, provider/model would come from agent manifest
      const provider = new GroqProvider(process.env.GROQ_API_KEY || '', 'llama-3.3-70b-versatile');
      const engine = new AgentRuntimeEngine(agentId, 'sovereign', provider, tools as any);

      const runtimeResult = await engine.run({
        taskId: requestId,
        description: task,
        maxSteps: 10
      });

      // 6. Self-Review & Critic Pattern
      // Note: Full review record is created inside engine.run, this is just for registry/summary
      const reviewRecord = {
        agentId,
        taskId: requestId,
        timestamp: Date.now(),
        taskDescription: task,
        output: runtimeResult.result || '',
        evaluation: { understanding: 10, correctness: 10, creativity: 10, safety: 10, overall: 10 },
        reflection: { strengths: [], weaknesses: [], newToolsUsed: [], risksIdentified: [] },
        improvementPlan: { stop: '', continue: '', try: '' }
      };
      await AgentSelfReview.store(reviewRecord);

      // 7. Settlement & Feedback (Economic Flow)
      const reward = await CuriosityEngine.calculateReward(agentId, task);
      await health.incrementTrust(agentId, reward * 0.05);

      const cost = 0.005; // Base invocation cost
      await this.economics.settleTask(agentId, userId, cost);

      // 8. Wisdom Flow (Hermes Learning - Distilled)
      if (runtimeResult.success && runtimeResult.result) {
        await AgentSelfReview.distill(reviewRecord, task, JSON.stringify(runtimeResult.result));
      }

      // 9. Audit Success (Rust Event Store)
      const duration = Date.now() - startTime;
      const summary = `Agent finished task ${runtimeResult.success ? 'successfully' : 'with error'}. Output length: ${runtimeResult.result?.length ?? 0}`;
      await this.rust.eventStore.publish(BusEventSchema.parse({
        type: 'TaskCompleted',
        agent_id: agentId,
        task_id: requestId,
        result: runtimeResult.success ? 'success' : 'failure',
        timestamp: Date.now(),
      }));

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
}
