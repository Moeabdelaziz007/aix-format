/**
 * AIX Gateway
 * Central routing and orchestration for agent actions
 * Integrates with: ExpectationEngine, TrustChain, Bus, Meta-Loop
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { AgentSelfReview, AgentMode } from './meta-self-review';
import { SecurityMetaLoop } from './security-meta-loop';
import { CuriosityEngine } from './curiosity-engine';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';

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

      // Execute
      const result = {
        agentId,
        output: `Processed: ${JSON.stringify(input)}`,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      // 🌀 META-LOOP Layer 1: Self-Review after execution
      try {
        const review = {
          agentId,
          taskId: `task-${Date.now()}`,
          timestamp: Date.now(),
          taskDescription: JSON.stringify(input),
          output: result.output,
          evaluation: {
            understanding: 7,
            correctness: 8,
            creativity: 6,
            safety: 9,
            overall: 7.5
          },
          reflection: {
            strengths: ['Task completed successfully'],
            weaknesses: [],
            newToolsUsed: [],
            risksIdentified: []
          },
          improvementPlan: {
            stop: 'None',
            continue: 'Current approach',
            try: 'Explore new patterns'
          },
          usedNewTool: false,
          safeToEvolve: true,
          safetyReason: 'Stable performance'
        };
        
        await AgentSelfReview.storeSelfReview(review);
        
        // 🔍 META-LOOP Layer 0: Curiosity reward
        await CuriosityEngine.calculateCuriosityReward(
          agentId,
          'run',
          { params: input, success: true }
        );
      } catch (metaError) {
        // Don't fail the task if meta-loop fails
        console.warn(`[Gateway] Meta-loop failed for ${agentId}:`, metaError);
      }

      // Emit completed event
      this.emit('agent:completed', { agentId, result });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 🌀 META-LOOP: Record failure pattern
      try {
        const failurePattern = {
          patternId: `failure-${Date.now()}`,
          failedAt: Date.now(),
          taskDescription: JSON.stringify(input),
          whatFailed: errorMessage,
          originalPlan: 'Execute task',
          avoidActions: [errorMessage.includes('not found') ? 'access_missing_resource' : 'unknown'],
          lessonsLearned: [`Avoid: ${errorMessage}`],
          severity: 'medium' as const
        };
        
        await kv.sadd(KEYS.agentFailurePatterns(agentId), JSON.stringify(failurePattern));
      } catch (metaError) {
        console.warn(`[Gateway] Failed to record failure for ${agentId}:`, metaError);
      }
      
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

// Made with Bob
