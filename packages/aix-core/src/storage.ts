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
  agentSkills: (agentId: string) => `agent:${agentId}:skills`,
  agentSkillDetail: (agentId: string, hash: string) => `agent:${agentId}:skill:${hash}`,
  
  // Execution
  aixActionResult: (agentId: string) => `aix:action:result:${agentId}`,
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
}
