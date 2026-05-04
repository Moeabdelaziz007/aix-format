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
  [key: string]: unknown;
}

export interface AIXManifest {
  economics?: {
    arbitrage?: { enabled?: boolean };
    [key: string]: unknown;
  };
  ghost_config?: { enabled?: boolean };
  [key: string]: unknown;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PulseRequest {
  process: GatewayProcess;
  manifest: AIXManifest;
  results: {
    security?: { safe: boolean; score: number };
    economics?: { totalFee: number; yield: number };
    reasoning?: unknown;
    ghost?: { active: boolean };
  };
}

export type AgentType = 'trader' | 'guardian' | 'ghost' | 'scout';

// ============================================================================
// HANDLERS (Chain of Responsibility Pattern)
// ============================================================================

/** 🛡️ Security Handler */
export class SecurityHandler extends PulseHandler {
  async handle(request: unknown): Promise<unknown> {
    const pulseRequest = request as PulseRequest;
    const frozen = await kv.get(KEYS.frozen(pulseRequest.process.agentId));
    if (frozen) throw new Error("Agent frozen by Dead Hand Protocol");

    // Proactive threat detection placeholder
    const threat: { reason: string } | null = null;
    if (threat) {
      await executeDeadHand(threat);
      throw new Error(`Security Quarantine: ${threat.reason}`);
    }

    pulseRequest.results.security = { safe: true, score: 100 };
    await RedisEventBus.getInstance().publish('security:cleared', { agentId: pulseRequest.process.agentId });
    return super.handle(pulseRequest);
  }
}

/** 💰 Economics Handler */
export class EconomicsHandler extends PulseHandler {
  async handle(request: unknown): Promise<unknown> {
    const pulseRequest = request as PulseRequest;
    const econ = pulseRequest.manifest.economics;
    if (econ) {
      const feeCalc = await RevenueRouter.calculateFee(pulseRequest.process.agentId, econ);
      pulseRequest.results.economics = { 
        totalFee: feeCalc.total,
        yield: econ.arbitrage?.enabled ? feeCalc.total * 0.1 : 0 
      };
      await RedisEventBus.getInstance().publish('economics:optimized', { 
        agentId: pulseRequest.process.agentId, 
        yield: pulseRequest.results.economics.yield 
      });
    }
    return super.handle(pulseRequest);
  }
}

/** 👻 Ghost Handler (Strategy Pattern integration) */
export class GhostHandler extends PulseHandler {
  async handle(request: unknown): Promise<unknown> {
    const pulseRequest = request as PulseRequest;
    if (pulseRequest.manifest.ghost_config?.enabled) {
      pulseRequest.process.agentId = `ghost:${pulseRequest.process.agentId.split(':').pop()}`;
      pulseRequest.results.ghost = { active: true };
    }
    return super.handle(pulseRequest);
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
      const finalRequest = await this.chain.handle(request) as PulseRequest;
      
      await RedisEventBus.getInstance().publish('pulse:success', {
        agentId: process.agentId,
        yield: finalRequest.results.economics?.yield
      });

      return finalRequest;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await RedisEventBus.getInstance().publish('pulse:error', {
        agentId: process.agentId,
        error: message
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
    private params: unknown
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
    await kv.del(KEYS.aixActionResult(this.agentId));
  }
}

// ============================================================================
// FACTORY (Factory Pattern)
// ============================================================================

export class SovereignAgentFactory extends AgentFactory<unknown> {
  create(type: AgentType, config: unknown) {
    switch (type) {
      case 'trader':
        return { ...(config as object), role: 'Economic Arbitrageur' };
      case 'guardian':
        return { ...(config as object), role: 'Security Sentinel' };
      case 'ghost':
        return { ...(config as object), role: 'Stealth Operator' };
      case 'scout':
        return { ...(config as object), role: 'Discovery Probe' };
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
  async execute(context: unknown) {
    const ctx = context as { userId: string };
    return { authenticated: true, user: ctx.userId };
  }
}

export class KYCBlock extends AgentBlock {
  id = 'kyc-block';
  async execute(context: unknown) {
    return { verified: true, level: 2 };
  }
}

export class PayBlock extends AgentBlock {
  id = 'pay-block';
  async execute(context: unknown) {
    return { success: true, txId: '0xabc' };
  }
}

/** Agent Composer: Assembles an agent from blocks */
export class AgentComposer {
  static async compose(blocks: AgentBlock[], context: unknown) {
    let finalState = { ...(context as object) };
    for (const block of blocks) {
      const result = await block.execute(finalState) as object;
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
  async run(params: unknown) {
    const p = params as { amount: number };
    return { yield: p.amount * 0.05 };
  }
}

/** Base Agent: The core doll */
export class BaseAgent implements IHierarchy {
  children: AgentSkill[] = [];
  
  constructor(public id: string) {}

  addChild(skill: unknown) {
    this.children.push(skill as AgentSkill);
  }

  async pulse(process: GatewayProcess) {
    return Promise.all(this.children.map(s => s.run({ amount: 100 })));
  }
}

/** Agent Cluster: Manages groups of agents */
export class AgentCluster implements IHierarchy {
  children: BaseAgent[] = [];

  constructor(public clusterId: string) {}

  addChild(agent: unknown) {
    this.children.push(agent as BaseAgent);
  }

  async broadcast(message: unknown) {
    return Promise.all(this.children.map(a => a.pulse(message as GatewayProcess)));
  }
}

// Made with Moe Abdelaziz
n Applied ✅