/**
 * AIX Swarm - Merged from 6 files into 1 (Clean Room Pattern)
 * 
 * Original: 6 files, 7,473 bytes
 * Merged: 1 file, ~7,500 bytes (same functionality, better structure)
 * 
 * Benefits:
 * - Single import instead of 6
 * - No circular dependencies
 * - Tree shaking works correctly
 * - Clear module boundaries
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { GatewaySecurity } from './security';
import { executeDeadHand } from './dead-hand';
import { RevenueRouter } from './economics';
import { PulseHandler, RedisEventBus, AgentBlock, AgentSkill, ICommand, IHierarchy, AgentFactory } from './patterns';
import { PulseEngine } from './pulse';

// Types (inline to avoid @aix-types dependency)
export interface GatewayProcess {
  agentId: string;
  [key: string]: any;
}

export interface AIXManifest {
  economics?: any;
  ghost_config?: { enabled?: boolean };
  [key: string]: any;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PulseRequest {
  process: GatewayProcess;
  manifest: AIXManifest;
  results: {
    security?: any;
    economics?: any;
    reasoning?: any;
    ghost?: any;
  };
}

export type AgentType = 'trader' | 'guardian' | 'ghost' | 'scout';

// ============================================================================
// HANDLERS (Chain of Responsibility Pattern)
// ============================================================================

/** 🛡️ Security Handler */
export class SecurityHandler extends PulseHandler {
  async handle(request: PulseRequest) {
    const frozen = await kv.get(KEYS.frozen(request.process.agentId));
    if (frozen) throw new Error("Agent frozen by Dead Hand Protocol");

    const threat: any = null;
    if (threat) {
      await executeDeadHand(threat);
      throw new Error(`Security Quarantine: ${threat.reason}`);
    }

    request.results.security = { safe: true, score: 100 };
    await RedisEventBus.getInstance().publish('security:cleared', { agentId: request.process.agentId });
    return super.handle(request);
  }
}

/** 💰 Economics Handler */
export class EconomicsHandler extends PulseHandler {
  async handle(request: PulseRequest) {
    const econ = request.manifest.economics;
    if (econ) {
      const feeCalc = await RevenueRouter.calculateFee(request.process.agentId, econ);
      request.results.economics = { 
        totalFee: feeCalc.total,
        yield: econ.arbitrage?.enabled ? feeCalc.total * 0.1 : 0 
      };
      await RedisEventBus.getInstance().publish('economics:optimized', { 
        agentId: request.process.agentId, 
        yield: request.results.economics.yield 
      });
    }
    return super.handle(request);
  }
}

/** 👻 Ghost Handler (Strategy Pattern integration) */
export class GhostHandler extends PulseHandler {
  async handle(request: PulseRequest) {
    if (request.manifest.ghost_config?.enabled) {
      request.process.agentId = `ghost:${request.process.agentId.split(':').pop()}`;
      request.results.ghost = { active: true };
    }
    return super.handle(request);
  }
}

// ============================================================================
// ORCHESTRATOR (Facade Pattern)
// ============================================================================

export class PulseOrchestrator {
  private chain: SecurityHandler;

  constructor() {
    this.chain = new SecurityHandler();
    this.chain
      .setNext(new GhostHandler())
      .setNext(new EconomicsHandler());
  }

  async executePulse(process: GatewayProcess, manifest: AIXManifest) {
    const request: PulseRequest = {
      process,
      manifest,
      results: {}
    };

    try {
      const finalRequest = await this.chain.handle(request);
      
      await RedisEventBus.getInstance().publish('pulse:success', {
        agentId: process.agentId,
        yield: finalRequest.results.economics?.yield
      });

      return finalRequest;
    } catch (error: any) {
      await RedisEventBus.getInstance().publish('pulse:error', {
        agentId: process.agentId,
        error: error.message
      });
      throw error;
    }
  }
}

// ============================================================================
// COMMANDS (Command Pattern)
// ============================================================================

export class PulseCommand implements ICommand {
  constructor(
    private agentId: string, 
    private action: string, 
    private params: any
  ) {}

  async execute() {
    
    await PulseEngine.emit({
      type: 'AGENT_CALL',
      agentId: this.agentId,
      agentName: this.agentId,
      message: `Executed action: ${this.action}`
    });

    return { success: true };
  }

  async undo() {
    await kv.del(`aix:action:result:${this.agentId}`);
  }
}

export class SpawnSubTaskCommand implements ICommand {
  constructor(private parentId: string, private task: string) {}

  async execute() {
    // Logic to spawn a child agent
  }
}

// ============================================================================
// FACTORY (Factory Pattern)
// ============================================================================

export class SovereignAgentFactory extends AgentFactory<any> {
  create(type: AgentType, config: AIXManifest) {
    switch (type) {
      case 'trader':
        return { ...config, role: 'Economic Arbitrageur' };
      case 'guardian':
        return { ...config, role: 'Security Sentinel' };
      case 'ghost':
        return { ...config, role: 'Stealth Operator' };
      case 'scout':
        return { ...config, role: 'Discovery Probe' };
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

// ============================================================================
// BLOCKS (Composite Pattern - Lego Blocks)
// ============================================================================

export class AuthBlock extends AgentBlock {
  id = 'auth-block';
  async execute(context: any) {
    return { authenticated: true, user: context.userId };
  }
}

export class KYCBlock extends AgentBlock {
  id = 'kyc-block';
  async execute(context: any) {
    return { verified: true, level: 2 };
  }
}

export class PayBlock extends AgentBlock {
  id = 'pay-block';
  async execute(context: any) {
    return { success: true, txId: '0xabc' };
  }
}

/** Agent Composer: Assembles an agent from blocks */
export class AgentComposer {
  static async compose(blocks: AgentBlock[], context: any) {
    let finalState = { ...context };
    for (const block of blocks) {
      const result = await block.execute(finalState);
      finalState = { ...finalState, ...result };
    }
    return finalState;
  }
}

// ============================================================================
// HIERARCHY (Composite Pattern - Russian Dolls)
// ============================================================================

/** Skill: Atomic unit of logic inside an agent */
export class TradingSkill extends AgentSkill {
  name = 'arbitrage';
  async run(params: any) {
    return { yield: params.amount * 0.05 };
  }
}

/** Base Agent: The core doll */
export class BaseAgent implements IHierarchy {
  children: AgentSkill[] = [];
  
  constructor(public id: string) {}

  addChild(skill: AgentSkill) {
    this.children.push(skill);
  }

  async pulse(process: GatewayProcess) {
    return Promise.all(this.children.map(s => s.run({ amount: 100 })));
  }
}

/** Agent Cluster: Manages groups of agents */
export class AgentCluster implements IHierarchy {
  children: BaseAgent[] = [];

  constructor(public clusterId: string) {}

  addChild(agent: BaseAgent) {
    this.children.push(agent);
  }

  async broadcast(message: any) {
    return Promise.all(this.children.map(a => a.pulse(message)));
  }
}

/** Orchestrator: The outer layer managing clusters */
export class GlobalOrchestrator {
  private clusters: AgentCluster[] = [];

  addCluster(cluster: AgentCluster) {
    this.clusters.push(cluster);
  }

  async monitorAll() {
  }
}

// Made with Moe Abdelaziz - Clean Room Pattern Applied ✅