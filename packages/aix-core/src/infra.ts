import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

/**
 * 🔐 SOVEREIGN_INFRASTRUCTURE
 * Unified utilities for Crypto, Resilience, and Logic Guardrails.
 * Made with Moe Abdelaziz
 */

// --- CRYPTO UTILS ---

export function generateHash(data: unknown): string {
  const hash = createHash('sha256');
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  hash.update(payload);
  return hash.digest('hex');
}

export function verifySignature(data: unknown, signature: string, publicKey: string): boolean {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const message = util.decodeUTF8(dataString);
    const signatureBytes = Buffer.from(signature, 'hex');
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
  } catch { return false; }
}

export function shannonEntropy(str: string): number {
  if (!str) return 0;
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return -Object.values(freq).reduce((sum, f) => {
    const p = f / str.length;
    return sum + p * Math.log2(p);
  }, 0);
}

// --- RESILIENCE UTILS (Circuit Breaker) ---

export interface CentralCircuitState {
    name: string;
    status: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime?: number;
}

export class CircuitBreaker {
    private state: CentralCircuitState;
    private failureThreshold: number;
    private recoveryTimeout: number;

    constructor(config: { name: string; failureThreshold: number; recoveryTimeout: number }) {
        this.state = { name: config.name, status: 'closed', failures: 0 };
        this.failureThreshold = config.failureThreshold;
        this.recoveryTimeout = config.recoveryTimeout;
    }

    public async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state.status === 'open') {
            if (Date.now() - (this.state.lastFailureTime || 0) > this.recoveryTimeout) {
                this.state.status = 'half-open';
            } else { throw new Error(`Circuit ${this.state.name} is OPEN`); }
        }
        try {
            const result = await fn();
            this.state.failures = 0;
            this.state.status = 'closed';
            return result;
        } catch (error) {
            this.state.failures++;
            this.state.lastFailureTime = Date.now();
            if (this.state.failures >= this.failureThreshold) this.state.status = 'open';
            throw error;
        }
    }

    public getState(): CentralCircuitState { return this.state; }
}
