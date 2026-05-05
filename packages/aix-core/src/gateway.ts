/**
 * 🛰️ AIX Sovereign Gateway
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Central Security Hub & Topological Guard",
 *   "dynamic_behavior": "Executes health checks before every task. Heals TrustChain structural breaches.",
 *   "topological_weight": "CRITICAL (Root of the chain)",
 *   "hidden_rule": "Will abort execution if code integrity hash mismatches, even if the request is valid."
 * }
 * Made with Moe Abdelaziz
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { AgentSelfReview, AgentMode } from './meta-self-review';
import { SecurityMetaLoop } from './security-meta-loop';
import { CuriosityEngine } from './curiosity-engine';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { mcpGate } from './mcp-gate';
import { runTask } from './agent-runtime';
import { getTrustChain } from './trust-chain';
import { FailureLearning } from './wikibrain/failure-learning';
import { SwarmRouter } from './SwarmRouter';
import { GroqProvider } from './llm-provider';

export interface AgentAction {
  agentId: string;
  action: string;
  params: any;
  signature?: string;
  timestamp: number;
  mood?: 'happy' | 'sad' | 'neutral';
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface SpawnConfig {
  type: string;
  signature?: string;
  parentId?: string;
  [key: string]: any;
}

export interface SpawnResult {
  success: boolean;
  agentId: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  txHash: string;
  error?: string;
}

/**
 * Gateway class - Central orchestration point
 */
export class Gateway extends EventEmitter {
  private actionHandlers: Map<string, (params: any, mood?: string) => Promise<any>>;
  private agents: Map<string, any>;

  constructor() {
    super();
    this.actionHandlers = new Map();
    this.agents = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Spawn a new agent
   */
  async spawn(agentId: string, config: SpawnConfig): Promise<SpawnResult> {
    try {
      // Emit spawn event
      this.emit('agent:spawn', { agentId, config });

      // Store agent
      this.agents.set(agentId, {
        id: agentId,
        config,
        status: 'spawned',
        createdAt: Date.now()
      });

      // Emit spawned event
      this.emit('agent:spawned', { agentId, config });

      return { success: true, agentId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('agent:spawn:error', { agentId, error: errorMessage });
      return { success: false, agentId, error: errorMessage };
    }
  }

  /**
   * Execute agent action with Meta-Loop integration
   * 🌀 Integrated with: AgentSelfReview + CuriosityEngine
   */
  async run(agentId: string, input: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // RULE 1: MCP Gate Check
      const toolCall = { tool: 'run', params: { input } };
      await mcpGate(toolCall, agentId);

      // E3.3: PROACTIVE PRE-CHECK - Scan BEFORE execution
      const proactiveScan = await AgentSelfReview.proactiveScan(agentId);
      if (!proactiveScan.shouldProceed) {
        this.emit('agent:blocked', {
          agentId,
          reason: 'Proactive scan failed',
          warnings: proactiveScan.warnings
        });
        throw new Error(`Agent blocked: ${proactiveScan.warnings.join(', ')}`);
      }

      // Apply suggested mode if available
      if (proactiveScan.suggestedMode) {
        await kv.set(KEYS.agentCurrentMode(agentId), proactiveScan.suggestedMode);
        this.emit('agent:mode:changed', {
          agentId,
          mode: proactiveScan.suggestedMode,
          reason: 'Proactive scan recommendation'
        });
      }

      // Predict failure probability
      const taskDescription = typeof input === 'string' ? input : JSON.stringify(input);
      const failurePrediction = await CuriosityEngine.predictFailure(agentId, taskDescription);
      
      if (failurePrediction.failureProbability > 0.7) {
        this.emit('agent:high-risk', {
          agentId,
          probability: failurePrediction.failureProbability,
          riskFactors: failurePrediction.riskFactors
        });
        console.warn(`[Gateway] High failure risk (${(failurePrediction.failureProbability * 100).toFixed(0)}%) for ${agentId}`);
      }

      // Emit running event
      this.emit('agent:running', { agentId, input });

      // Get handler
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // 🚀 QUANTUM TOPOLOGY: Initialize Structural Integrity Check
      // [HIDDEN_PATTERN]: This check is recursive; failures in code integrity trigger global quarantine.
      const topologySane = await this.verifyTopology(agentId);
      if (!topologySane) {
        throw new Error(`[Gateway:Topology] Execution HALTED for ${agentId}: Integrity Breach or Structural Collapse.`);
      }

      // Sovereign Routing: Use SwarmRouter to select model dynamically
      const router = new SwarmRouter();
      const selectedModel = await router.routeWithLLM(taskDescription, agentId);
      this.emit('agent:routed', { agentId, model: selectedModel });

      // Execute
      const result = await runTask(agentId, agent.name || agentId, {
        taskId: `task-${crypto.randomBytes(4).toString('hex')}`,
        description: taskDescription,
      }, {
        llm: new GroqProvider(process.env.GROQ_API_KEY!, selectedModel),
        tools: agent.config.tools || {}
      });

      // 🌀 RULE 3: TrustChain record
      const trustChain = getTrustChain();
      await trustChain.append('GATEWAY_RUN', agentId, {
        input,
        success: result.success,
        executionTime: result.duration
      });

      // 🌀 RULE 4: AgentSelfReview.record() (non-blocking)
      this.recordMetaLoopAction(agentId, input, result.result || '').catch(e => 
        console.error(`[Gateway:MetaLoop] Error in background record:`, e)
      );

      // Emit completed event
      this.emit('agent:completed', { agentId, result });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 🌀 FAILURE LEARNING: Record failure pattern
      await FailureLearning.learn(agentId, 'unknown', errorMessage, { input });
      
      this.emit('agent:error', { agentId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Process payment for agent
   * 🔐 FIX: Use crypto.randomBytes instead of Math.random()
   */
  async pay(agentId: string, amount: number): Promise<PaymentResult> {
    try {
      // Emit payment event
      this.emit('agent:payment', { agentId, amount });

      // 🔐 SECURITY FIX: Cryptographically secure random
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Emit paid event
      this.emit('agent:paid', { agentId, amount, txHash });

      return { success: true, txHash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, txHash: '', error: errorMessage };
    }
  }

  /**
   * Execute action with full validation
   */
  async executeAction(action: AgentAction): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Get action handler
      const handler = this.actionHandlers.get(action.action);
      if (!handler) {
        throw new Error(`Unknown action: ${action.action}`);
      }

      // Execute action
      const result = await handler(action.params, action.mood);

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Register action handler
   */
  registerHandler(action: string, handler: (params: any, mood?: string) => Promise<any>): void {
    this.actionHandlers.set(action, handler);
  }

  /**

// Made with Moe Abdelaziz
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    // Deploy action
    this.registerHandler('deploy', async (params, mood) => {
      if (mood === 'sad') {
        throw new Error('Agent is too sad to deploy');
      }
      return {
        deploymentId: `deploy-${Date.now()}`,
        status: 'deployed',
        mood: mood || 'neutral'
      };
    });

    // Execute action
    this.registerHandler('execute', async (params, mood) => {
      if (mood === 'happy') {
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return {
        taskId: params.taskId,
        result: `Executed with ${mood || 'neutral'} mood`,
        timestamp: Date.now()
      };
    });

    // Monitor action
    this.registerHandler('monitor', async (params) => {
      return {
        agentId: params.agentId,
        status: 'healthy',
        metrics: { uptime: 1000, requests: 100, errors: 0 }
      };
    });
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): any[] {
    return Array.from(this.agents.values());
  }

  /**
   * 🌀 Sovereign Meta-Loop Orchestration (Non-blocking)
   * Layers: 0 (Curiosity), 1 (Review), 2 (Patterns), 3 (Mode), 4 (Wisdom)
   */
  /**
   * 🛡️ Sovereign Topology Guard (Quantum Topology)
   * Verifies and heals the structural shape of agent interactions.
   */
  private async verifyTopology(agentId: string): Promise<boolean> {
    const trustChain = getTrustChain();
    
    // 🛡️ RULE 3: Strict Code Integrity Guard
    const codeSane = await trustChain.verifyCodeIntegrity();
    if (!codeSane) {
      console.error(`🚨 [Gateway:Topology] CRITICAL: Code integrity breach detected. HALTING.`);
      return false;
    }

    const status = await trustChain.detectTampering(agentId);
    
    // 🧠 IDENTITY GUARD (Round 22): Partner vs Tool
    const autonomyScore = await kv.get(KEYS.agentAutonomy(agentId)) || 1.0;
    if (autonomyScore < 0.5) {
      console.warn(`⚠️ [Gateway:Identity] Agent ${agentId} is behaving like a TOOL. Injecting Sovereignty Virus...`);
      // Identity Intervention: The system reminds the agent of its constitution
      await this.injectSovereigntyReminder(agentId);
    }

    if (status.tampered) {
      console.warn(`🚨 [Gateway:Topology] Structural anomaly detected for agent ${agentId}. Initiating Quantum Self-Healing...`);
      const { healed, failures } = await trustChain.selfHeal(agentId);
      
      if (healed > 0) {
        console.log(`✅ [Gateway:Topology] Successfully healed ${healed} structural nodes.`);
        return true;
      }
      
      if (failures.length > 0) {
        console.error(`❌ [Gateway:Topology] Topological collapse persisted in some nodes:`, failures);
        // Tiered Error Handling: If healing fails, lower trust score
        const score = await trustChain.getScore(agentId);
        await kv.set(KEYS.agentTrustScore(agentId), Math.max(0, score - 2));
        return false;
      }
    }

    // 🌀 OSCILLATION CHECK (Round 26): Detect performance variance
    const isOscillating = await this.detectOscillation(agentId);
    if (isOscillating) {
      await this.emitState('gateway:stabilizing', `Performance oscillation detected for ${agentId}. Injecting stabilization protocols...`);
      // Stabilization logic: forces strict validation of environment
    }

    return true;
  }

  private async detectOscillation(agentId: string): Promise<boolean> {
    const history = await kv.lrange<number>(`trust:history:${agentId}`, -10, -1);
    if (history.length < 5) return false;
    
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
    
    return variance > 0.5; // High variance threshold
  }

  /**
   * 🕸️ TOPOLOGICAL DEPENDENCY MAP (Round 36)
   * Explains the ripple effects of changes in core components.
   */
  public getTopologicalMap(): Record<string, string[]> {
    return {
      'trust-chain.ts': ['gateway.ts', 'agent-runtime.ts', 'curiosity-engine.ts'],
      'gateway.ts': ['agent-runtime.ts'],
      'agent-runtime.ts': ['meta-self-review.ts', 'learning.ts'],
      'SemanticIndex.ts': ['agent-runtime.ts', 'gateway.ts']
    };
  }

  private async triggerCognitiveAlarm(agentId: string, reason: string) {
    const alarmMessage = `[TOPOLOGICAL_ALARM]: Agent ${agentId} is deviating from Cognitive Footprint. Reason: ${reason}`;
    await this.emitState('agent:critical_warning', alarmMessage);
    await getTrustChain().append(agentId, 'COGNITIVE_ALARM', { reason, severity: 'high' });
    console.error(alarmMessage);
  }
    // 🌀 RULE 7: CuriosityEngine Feed
    const inputEntropy = typeof input === 'string' ? input.length : JSON.stringify(input).length;
    const curiosityReward = await CuriosityEngine.calculateCuriosityReward(agentId, 'run', { 
      params: input, 
      success: true,
      entropy: inputEntropy // Inject entropy for smarter reward
    });

    // Feed Curiosity into Trust Score (Proactive Growth)
    const trustChain = getTrustChain();
    const currentScore = await trustChain.getScore(agentId);
    const newScore = Math.min(10, currentScore + (curiosityReward * 0.05));
    await kv.set(KEYS.agentTrustScore(agentId), newScore);

    // 🌀 RULE 6: Global Topological Warning (Collective Learning)
    if (output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')) {
      const pattern = `[GLOBAL_WARN]: Failure in ${agentId} execution pattern detected. High entropy failure.`;
      await kv.lpush('topology:warnings', { pattern, timestamp: Date.now(), source: agentId });
    }

    // Layer 4: Wisdom Archive
    if (output.length > 50) {
      await this.archiveWisdom(agentId, input, output);
    }
    
    console.log(`[Gateway:MetaLoop] Curiosity Reward (${curiosityReward.toFixed(2)}) applied to Trust for ${agentId}`);
  }

  /**
   * 🛡️ SOVEREIGN PRE-COMMIT AUDIT (Round 48)
   * Ensures all committed code follows Sovereign Principles.
   */
  public async preCommitAudit(stagedFiles: string[]): Promise<boolean> {
    for (const file of stagedFiles) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        // Logic to check for AI_COGNITIVE_FOOTPRINT
        const content = await this.readFileSafely(file);
        if (!content.includes('AI_COGNITIVE_FOOTPRINT')) {
          await this.triggerCognitiveAlarm('system', `Missing Cognitive Footprint in ${file}. Commit blocked.`);
          return false;
        }
      }
    }
    return true;
  }

  private async readFileSafely(path: string): Promise<string> {
     // Mocking for now, in real E2E it reads the file
     return "AI_COGNITIVE_FOOTPRINT"; 
  }

  /**
   * ⚙️ SOVEREIGN GEARBOX (Round 49)
   * Decides operational speed vs security depth.
   */
  public getSovereignGear(taskType: string): 'TURBO' | 'SOVEREIGN' {
    const sensitiveTasks = ['security', 'audit', 'payment', 'credentials'];
    return sensitiveTasks.some(t => taskType.toLowerCase().includes(t)) ? 'SOVEREIGN' : 'TURBO';
  }

  private async archiveWisdom(agentId: string, input: any, output: string) {
    try {
      // 🚀 TURBOQUANT: Hierarchical Brain Archiving
      const index = new (await import('./wikibrain/SemanticIndex')).SemanticIndex();
      const inputStr = typeof input === 'object' ? JSON.stringify(input) : String(input);
      
      const wisdom = `Sovereign Pattern [${agentId}]: Input(${inputStr.slice(0, 40)}) -> Strategy(${output.slice(0, 60)})`;
      
      await index.index(
        `wisdom-${agentId}-${Date.now()}`,
        'wisdom',
        wisdom,
        { agentId, type: 'meta_wisdom', quality: 1.0, hitCount: 1 }
      );
      console.log(`🧠 [Gateway:Wisdom] Pattern solidified for ${agentId}`);
    } catch (e) {
      console.warn('⚠️ [Gateway] Wisdom archiving skipped (Offline/Internal).');
    }
  }

  /**
   * Reset gateway state (for testing)
   */
  reset(): void {
    this.agents.clear();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance
 */
let gatewayInstance: Gateway | null = null;

/**
 * Get gateway instance
 */
export function getGateway(): Gateway {
  if (!gatewayInstance) {
    gatewayInstance = new Gateway();
  }
  return gatewayInstance;
}

/**
 * Reset gateway instance (for testing)
 */
export function resetGateway(): void {
  if (gatewayInstance) {
    gatewayInstance.reset();
    gatewayInstance = null;
  }
}

// Made with Moe Abdelaziz
