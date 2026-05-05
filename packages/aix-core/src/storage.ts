import { Redis } from '@upstash/redis';

/**
 * 🗄️ SOVEREIGN_STORAGE
 * Unified persistence layer using Upstash Redis.
 * Made with Moe Abdelaziz
 */

// --- NAMESPACES & KEYS ---

export const NS = {
  REGISTRY: 'aix:registry',
  IDENTITY: 'aix:identity',
  ECONOMICS: 'aix:economics',
  GATEWAY: 'aix:gateway',
  PULSE: 'aix:pulse',
  SKILLS: 'aix:skills',
} as const;

export const KEYS = {
  // Registry & Identity
  registry: (agentId: string) => `agent:${agentId}`,
  agentAutonomy: (agentId: string) => `agent:${agentId}:autonomy`,
  agentLastActivity: (agentId: string) => `agent:${agentId}:last_activity`,
  
  // Health & Trust
  agentTrustScore: (agentId: string) => `agent:${agentId}:trust_score`,
  agentTrustHistory: (agentId: string) => `agent:${agentId}:trust_history`,
  frozen: (agentId: string) => `agent:${agentId}:frozen`,
  lastAction: (agentId: string) => `trust:last_action:${agentId}`,
  actionRecord: (hash: string) => `trust:action:${hash}`,
  verified: (agentId: string) => `trust:verified:${agentId}`,
  signature: (agentId: string) => `trust:sig:${agentId}`,
  integrityHash: (file: string) => `integrity:hash:${file}`,
  
  // Brain & Learning

  
  // Execution
  aixActionResult: (agentId: string) => `aix:action:result:${agentId}`,
  agentSelfReview: (agentId: string, taskId: string) => `agent:review:${agentId}:${taskId}`,
  agentSelfReviewHistory: (agentId: string) => `agent:review_history:${agentId}`,
  agentSkills: (agentId: string) => `agent:skills:${agentId}`,
  agentSkillDetail: (agentId: string, hash: string) => `agent:skill:${agentId}:${hash}`,
  aixEvents: (channel: string) => `aix:events:${channel}`,
};

// --- REDIS ADAPTER ---

export const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Sovereign Storage Orchestrator
 * Ensures fail-fast behavior in production.
 */
export class StorageOrchestrator {
  private static instance: StorageOrchestrator;
  
  private constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error('🚨 [Storage] UPSTASH_REDIS_REST_URL is missing. Sovereign storage requires real Redis.');
    }
  }

  public static getInstance(): StorageOrchestrator {
    if (!StorageOrchestrator.instance) {
      StorageOrchestrator.instance = new StorageOrchestrator();
    }
    return StorageOrchestrator.instance;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await kv.ping();
      return true;
    } catch { return false; }
  }

  /**
   * Saves a payload with optional compression for large data.
   */
  async save<T>(key: string, data: T, options: { compress?: boolean; ttl?: number } = {}): Promise<void> {
    const json = JSON.stringify(data);
    let finalValue: string | Buffer = json;
    let isCompressed = false;

    // Threshold: 10KB
    if (options.compress || json.length > 10240) {
      const zlib = await import('zlib');
      finalValue = zlib.gzipSync(json).toString('base64');
      isCompressed = true;
    }

    const payload = isCompressed ? `__gz__${finalValue}` : json;
    
    if (options.ttl) {
      await kv.set(key, payload, { ex: options.ttl });
    } else {
      await kv.set(key, payload);
    }
  }

  /**
   * Loads a payload and handles decompression if needed.
   */
  async load<T>(key: string): Promise<T | null> {
    const raw = await kv.get<string>(key);
    if (!raw) return null;

    if (raw.startsWith('__gz__')) {
      const zlib = await import('zlib');
      const base64 = raw.slice(6);
      const decompressed = zlib.gunzipSync(Buffer.from(base64, 'base64')).toString();
      return JSON.parse(decompressed);
    }

    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw as any;
    }
  }
}
