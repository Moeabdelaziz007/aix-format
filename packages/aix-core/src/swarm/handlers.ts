import { PulseHandler, RedisEventBus } from "../patterns";
import { GatewayProcess, AIXManifest } from "@aix-types";
import { kv } from "../storage/adapter";
import { KEYS } from "../storage/keys";
import { GatewaySecurity } from "../security";
import { executeDeadHand } from "../dead-hand";
import { RevenueRouter } from "../economics";

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

// 🛡️ Security Handler
export class SecurityHandler extends PulseHandler {
  async handle(request: PulseRequest) {
    const frozen = await kv.get(KEYS.frozen(request.process.agentId));
    if (frozen) throw new Error("Agent frozen by Dead Hand Protocol");

    const threat = // await evaluateAgent(request.process.agentId);
    if (threat) {
      await executeDeadHand(threat);
      throw new Error(`Security Quarantine: ${threat.reason}`);
    }

    request.results.security = { safe: true, score: 100 };
    await RedisEventBus.getInstance().publish('security:cleared', { agentId: request.process.agentId });
    return super.handle(request);
  }
}

// 💰 Economics Handler
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

// 👻 Ghost Handler (Strategy Pattern integration)
export class GhostHandler extends PulseHandler {
  async handle(request: PulseRequest) {
    if (request.manifest.ghost_config?.enabled) {
      request.process.agentId = `ghost:${request.process.agentId.split(':').pop()}`;
      request.results.ghost = { active: true };
    }
    return super.handle(request);
  }
}
