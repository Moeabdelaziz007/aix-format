/**
 * Redis Evolution Store
 * Persists agent evolution data in Upstash Redis
 * RULE 9: Evolution data must survive server restarts
 *
 * Note: @vercel/kv is deprecated, using Upstash Redis directly
 * Env vars: KV_REST_API_URL, KV_REST_API_TOKEN
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client (will use env vars automatically)
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export interface EvolutionData {
  loops_completed: number;
  last_improved: string;
  lessons: string[];
  trust_delta: number;
  version_lineage: string[];
}

export class RedisEvolutionStore {
  private prefix = 'evolution:';

  /**
   * Set evolution data for an agent
   */
  async set(agentDid: string, data: EvolutionData): Promise<void> {
    if (!redis) {
      console.warn('[RedisEvolutionStore] Redis not configured, skipping set');
      return;
    }
    try {
      await redis.set(`${this.prefix}${agentDid}`, JSON.stringify(data));
    } catch (error) {
      console.error('[RedisEvolutionStore] Set failed:', error);
      throw error;
    }
  }

  /**
   * Get evolution data for an agent
   */
  async get(agentDid: string): Promise<EvolutionData | null> {
    if (!redis) {
      console.warn('[RedisEvolutionStore] Redis not configured, returning null');
      return null;
    }
    try {
      const raw = await redis.get(`${this.prefix}${agentDid}`);
      return raw ? JSON.parse(raw as string) : null;
    } catch (error) {
      console.error('[RedisEvolutionStore] Get failed:', error);
      return null;
    }
  }

  /**
   * Get all evolution data (for analytics)
   */
  async getAll(): Promise<Map<string, EvolutionData>> {
    if (!redis) {
      console.warn('[RedisEvolutionStore] Redis not configured, returning empty map');
      return new Map();
    }
    try {
      const keys = await redis.keys(`${this.prefix}*`);
      const map = new Map<string, EvolutionData>();
      
      for (const key of keys) {
        const agentDid = key.replace(this.prefix, '');
        const data = await this.get(agentDid);
        if (data) map.set(agentDid, data);
      }
      
      return map;
    } catch (error) {
      console.error('[RedisEvolutionStore] GetAll failed:', error);
      return new Map();
    }
  }

  /**
   * Delete evolution data for an agent
   */
  async delete(agentDid: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(`${this.prefix}${agentDid}`);
    } catch (error) {
      console.error('[RedisEvolutionStore] Delete failed:', error);
    }
  }

  /**
   * Clear all evolution data (use with caution)
   */
  async clear(): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('[RedisEvolutionStore] Clear failed:', error);
    }
  }
}

// Singleton instance
export const evolutionStore = new RedisEvolutionStore();

// Made with Moe Abdelaziz
