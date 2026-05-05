import { kv, KEYS } from './storage';
import { generateHash, verifySignature as cryptoVerify } from './infra';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * 🏥 SOVEREIGN_HEALTH_SERVICE
 * The Single Source of Truth for Trust, Stability, and Self-Healing.
 * Made with Moe Abdelaziz
 */

export interface ActionRecord {
  auditHash: string;
  prevAction: string;
  agentId: string;
  action: string;
  data: unknown;
  timestamp: number;
  topologySignature?: string;
}

export class SovereignHealthService {
  private static instance: SovereignHealthService;
  
  private constructor() {}

  public static getInstance(): SovereignHealthService {
    if (!SovereignHealthService.instance) {
      SovereignHealthService.instance = new SovereignHealthService();
    }
    return SovereignHealthService.instance;
  }

  // --- TRUST & SCORES ---

  async getTrustScore(agentId: string): Promise<number> {
    return await kv.get<number>(KEYS.agentTrustScore(agentId)) || 0;
  }

  async incrementTrust(agentId: string, amount: number = 0.1): Promise<void> {
    const current = await this.getTrustScore(agentId);
    await kv.set(KEYS.agentTrustScore(agentId), Math.min(10, current + amount));
  }

  async decrementTrust(agentId: string, amount: number = 0.5): Promise<void> {
    const current = await this.getTrustScore(agentId);
    await kv.set(KEYS.agentTrustScore(agentId), Math.max(0, current - amount));
  }

  // --- STABILITY & OSCILLATION ---

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
}

export const health = SovereignHealthService.getInstance();
