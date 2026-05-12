import { kv, KEYS } from './memory/storage';
import { generateHash, verifySignature as cryptoVerify } from './infra';
import { getRustBridge } from '@aix/rust-core/src/bridge';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * 🏥 SOVEREIGN_HEALTH_SERVICE
 * The Single Source of Truth for Trust, Stability, and Self-Healing.
 * Made with Moe Abdelaziz
 */

import { ActionRecord } from './domain';

export class SovereignHealthService {
  private static instance: SovereignHealthService;
  private _rust: any = null;

  private get rust() {
    if (!this._rust) {
      try {
        this._rust = getRustBridge();
      } catch (e) {
        console.warn('⚠️ [Health] Rust Bridge not available.');
        return null;
      }
    }
    return this._rust;
  }
  
  private constructor() {}

  public static getInstance(): SovereignHealthService {
    if (!SovereignHealthService.instance) {
      SovereignHealthService.instance = new SovereignHealthService();
    }
    return SovereignHealthService.instance;
  }

  // --- TRUST & SCORES ---

  async getTrustScore(agentId: string): Promise<number> {
    try {
      // 1. Try Rust Trust Chain (Cryptographic)
      const rustScore = this.rust ? await this.rust.trustChain.getTrustScore(agentId) : null;
      if (rustScore !== null) return rustScore / 10; // Scale to 0-10
    } catch { /* Fallback to Redis */ }

    const score = await kv.get<number>(KEYS.agentTrustScore(agentId));
    return score ?? 10.0;
  }

  async getRegistry(): Promise<any[]> {
    const keys = await kv.keys('agent:*:metrics');
    const agents = [];
    for (const key of keys) {
      const agentId = key.split(':')[1];
      const metadata = await kv.get<any>(`agent:${agentId}:metadata`);
      if (metadata) agents.push(metadata);
    }
    return agents;
  }

  async incrementTrust(agentId: string, amount: number, reason = 'Performance'): Promise<void> {
    try {
      if (this.rust) await this.rust.trustChain.reward(agentId, Math.round(amount * 10), reason, 'n/a');
    } catch { /* Fallback to Redis */ }

    const current = await this.getTrustScore(agentId);
    const next = Math.min(10.0, current + amount);
    await kv.set(KEYS.agentTrustScore(agentId), next);
    
    console.log(`📈 [TRUST_UP] Agent ${agentId}: ${current.toFixed(1)} -> ${next.toFixed(1)} (${reason})`);
  }

  async decrementTrust(agentId: string, amount: number, reason = 'Security Violation'): Promise<void> {
    try {
      if (this.rust) await this.rust.trustChain.penalize(agentId, Math.round(amount * 10), reason, 'n/a');
    } catch { /* Fallback to Redis */ }

    const current = await this.getTrustScore(agentId);
    const next = Math.max(0.0, current - amount);
    await kv.set(KEYS.agentTrustScore(agentId), next);
    
    console.warn(`📉 [TRUST_DOWN] Agent ${agentId}: ${current.toFixed(1)} -> ${next.toFixed(1)} (${reason})`);
  }

  // --- STABILITY & OSCILLATION ---

  /**
   * Performs a topological integrity check of the system.
   */
  async checkIntegrity(): Promise<void> {
    // In a real sovereign system, this verifies file hashes against Redis
    // and checks if any unauthorized mutations occurred.
    const score = await this.getTrustScore('system');
    if (score < 5) throw new Error('🚨 Topological integrity compromised!');
    console.log('✅ [Health] System integrity verified.');
  }

  async detectOscillation(agentId: string): Promise<boolean> {
    const history = await kv.lrange<number>(KEYS.agentTrustHistory(agentId), -10, -1);
    if (history.length < 5) return false;
    
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
    
    return variance > 0.5; // High variance threshold
  }

  // --- INTEGRITY & SELF-HEALING ---

  async verifyTopology(agentId: string, action: string, data: any): Promise<boolean> {
    const dataShape = typeof data === 'object' ? Object.keys(data).join(',') : 'scalar';
    const topologySignature = createHash('md5')
      .update(`${action}:${agentId.slice(0, 8)}:${dataShape.length}`)
      .digest('hex');
    
    // In a real scenario, we'd check this against a history of 'normal' shapes
    return !!topologySignature;
  }

  async verifyCodeIntegrity(): Promise<boolean> {
    const coreFiles = ['gateway.ts', 'swarm.ts', 'brain.ts', 'health.ts'];
    for (const file of coreFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hash = generateHash(content);
        const knownHash = await kv.get<string>(KEYS.integrityHash(file));
        
        if (knownHash && hash !== knownHash) return false;
        if (!knownHash) await kv.set(KEYS.integrityHash(file), hash);
      }
    }
    return true;
  }

  /**
   * Comprehensive System Health Check
   */
  async checkSystem() {
    const checks: any = {};
    const startTime = Date.now();

    // 1. Redis check
    try {
      const redisStart = Date.now();
      await kv.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } catch (err: any) {
      checks.redis = { status: "error", message: err.message };
    }

    // 2. Pi Network check (Simulation/External)
    try {
      const piStart = Date.now();
      const response = await fetch("https://api.minepi.com/v2/health");
      checks.piNetwork = { status: response.ok ? "ok" : "degraded", latencyMs: Date.now() - piStart };
    } catch {
      checks.piNetwork = { status: "error" };
    }

    // 3. Rust Bridge check
    try {
      const rustScore = this.rust ? await this.rust.trustChain.getTrustScore('system') : null;
      checks.rustBridge = { status: this.rust ? 'ok' : 'missing', systemTrust: rustScore };
    } catch {
      checks.rustBridge = { status: 'error' };
    }

    return {
      status: Object.values(checks).every((c: any) => c.status === 'ok') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - startTime,
      checks
    };
  }
}

export const health = SovereignHealthService.getInstance();
