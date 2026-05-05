import { SovereignHealthService } from './health';
import { AIXTokenBucket, RATE_LIMITS } from './rate-limit';
import { kv } from './storage';

/**
 * AIX Sovereign Harness Config & Entry Point
 * 
 * Consolidates Payment, Auth, and Rate-Limiting into a single sovereign gate.
 * This is the 'Guardian' layer that protects every agent invocation.
 */
export const HarnessConfig = {
  version: "1.4.0",
  protocol: "Sovereign AIX",
  
  // 1. Auth Configuration
  auth: {
    required: true,
    provider: "AxiomID",
    sessionTimeout: 3600,
  },

  // 2. Rate Limit Configuration
  rateLimit: {
    enabled: true,
    default: RATE_LIMITS.INVOKE,
    sensitive: RATE_LIMITS.STAKE,
  },

  // 3. Payment Gate Configuration
  payment: {
    enabled: true,
    provider: "FoldTrace",
    currency: "PI",
    minBalance: 0.001,
  }
};

/**
 * HarnessGate
 * 
 * The single entry point for checking if an operation is allowed.
 */
export class HarnessGate {
  private health: SovereignHealthService;
  private rateLimiter: AIXTokenBucket;

  constructor() {
    this.health = new SovereignHealthService();
    this.rateLimiter = new AIXTokenBucket(
      HarnessConfig.rateLimit.default.capacity,
      HarnessConfig.rateLimit.default.windowMs
    );
  }

  /**
   * Pre-flight clearance for any agentic operation
   */
  async checkClearance(agentId: string, userId: string, operationType: string = 'invoke'): Promise<{
    allowed: boolean;
    reason?: string;
    metrics?: any;
  }> {
    // A. Integrity Check
    const integrity = await this.health.getTrustScore(agentId);
    if (integrity < 3.0) {
      return { allowed: false, reason: "AGENT_INTEGRITY_COMPROMISED" };
    }

    // B. Rate Limit Check
    const isAllowed = await this.rateLimiter.consume(`${userId}:${operationType}`);
    if (!isAllowed) {
      return { allowed: false, reason: "RATE_LIMIT_EXCEEDED" };
    }

    // C. Payment Gate Check (Placeholder for real payment logic)
    const balance = await kv.get<number>(`user:${userId}:balance`) ?? 1.0;
    if (balance < HarnessConfig.payment.minBalance) {
      return { allowed: false, reason: "INSUFFICIENT_FUNDS_402" };
    }

    return { 
      allowed: true, 
      metrics: { integrity, balance }
    };
  }
}

export const getHarness = () => new HarnessGate();
