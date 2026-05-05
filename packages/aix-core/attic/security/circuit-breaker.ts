import { z } from 'zod';

/**
 * AIX Sovereign Circuit Breaker (RULE 8)
 * Protects providers from cascading failures.
 * Status: CLOSED, OPEN, HALF_OPEN
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  name: string;
}

export const CircuitConfigSchema = z.object({
  failureThreshold: z.number().default(3),
  recoveryTimeout: z.number().default(9000), // 9s (Tesla Harmony)
  name: z.string()
});

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitConfig;

  constructor(config: Partial<CircuitConfig> & { name: string }) {
    this.config = CircuitConfigSchema.parse(config);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error(`[CircuitBreaker:${this.config.name}] Circuit is OPEN. Request blocked.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    // 🚀 TURBOQUANT: Leaky Bucket Recovery
    // Instead of resetting to 0, we decrease failureCount gradually to maintain "structural memory"
    if (this.failureCount > 0) this.failureCount--;
    
    if (this.failureCount === 0) {
      this.state = CircuitState.CLOSED;
      this.lastFailureTime = null;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // 🛡️ Proactive Trip: If failures happen too fast (High Frequency), trip earlier
    const densityFactor = this.calculateDensityFactor();
    const effectiveThreshold = Math.max(1, this.config.failureThreshold - densityFactor);

    if (this.failureCount >= effectiveThreshold) {
      this.state = CircuitState.OPEN;
      console.error(`🚨 [CircuitBreaker:${this.config.name}] TRIP! Effective Threshold (${effectiveThreshold}) reached.`);
    }
  }

  private calculateDensityFactor(): number {
    if (!this.lastFailureTime) return 0;
    const timeSinceLast = Date.now() - this.lastFailureTime;
    // If failures are within 2 seconds of each other, increase density factor
    return timeSinceLast < 2000 ? 1 : 0;
  }

  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime > this.config.recoveryTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }
}
