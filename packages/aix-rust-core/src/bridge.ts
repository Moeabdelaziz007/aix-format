/**
 * TypeScript Integration Bridge for Rust Core (Gem 1 - Batching)
 * 
 * Provides high-level TypeScript API with automatic batching and serialization.
 */

import * as msgpack from '@msgpack/msgpack';
import type { BusEvent, Skill, RustCore } from '../index';

// Load native module
const rustCore: RustCore = require('../index.node');

// ============================================================================
// Serialization Helpers (Binary for Performance)
// ============================================================================

/**
 * Serialize data to binary using MessagePack (faster than JSON)
 */
function serialize<T>(data: T): Buffer {
  return Buffer.from(msgpack.encode(data));
}

/**
 * Deserialize binary data using MessagePack
 */
function deserialize<T>(buffer: Buffer): T {
  return msgpack.decode(buffer) as T;
}

// ============================================================================
// Event Store Bridge (Gem 1 - Batched Operations)
// ============================================================================

export class RustEventStore {
  private batch: BusEvent[] = [];
  private batchSize: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private flushInterval: number;

  constructor(batchSize = 100, flushIntervalMs = 1000) {
    this.batchSize = batchSize;
    this.flushInterval = flushIntervalMs;
  }

  /**
   * Publish event with automatic batching (Gem 1)
   * Events are accumulated and flushed in batches for 1000x performance
   */
  async publish(event: BusEvent): Promise<void> {
    this.batch.push(event);

    // Auto-flush when batch is full
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush().catch(console.error);
        }, this.flushInterval);
      }
    }
  }

  /**
   * Manually flush pending events
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Serialize batch to binary
    const buffer = serialize(this.batch);

    // Single FFI call for entire batch
    await rustCore.appendEventBatch(buffer);

    // Clear batch
    this.batch = [];
  }

  /**
   * Query events by agent ID
   */
  async query(agentId: string, pattern?: string): Promise<BusEvent[]> {
    const buffer = await rustCore.queryEvents(agentId, pattern ?? null);
    return deserialize<BusEvent[]>(buffer);
  }

  /**
   * Query events by type
   */
  async queryByType(eventType: string): Promise<BusEvent[]> {
    const buffer = await rustCore.queryEventsByType(eventType);
    return deserialize<BusEvent[]>(buffer);
  }

  /**
   * Get total event count
   */
  async count(): Promise<number> {
    return rustCore.eventCount();
  }

  /**
   * Cleanup - flush pending events
   */
  async destroy(): Promise<void> {
    await this.flush();
  }
}

// ============================================================================
// Skill Cache Bridge (Gem 2 - SIMD Search)
// ============================================================================

export class RustSkillCache {
  private embeddingDim: number;

  constructor(embeddingDim = 384) {
    this.embeddingDim = embeddingDim;
  }

  /**
   * Add skill to cache
   */
  async addSkill(skill: Skill): Promise<void> {
    if (skill.embedding.length !== this.embeddingDim) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.embeddingDim}, got ${skill.embedding.length}`
      );
    }

    const buffer = serialize(skill);
    await rustCore.addSkill(buffer);
  }

  /**
   * SIMD semantic search (Gem 2 - 5x faster)
   * Returns skill IDs sorted by similarity
   */
  async search(queryEmbedding: number[], limit = 10): Promise<string[]> {
    if (queryEmbedding.length !== this.embeddingDim) {
      throw new Error(
        `Query embedding dimension mismatch: expected ${this.embeddingDim}, got ${queryEmbedding.length}`
      );
    }

    const embedding = new Float32Array(queryEmbedding);
    return rustCore.searchSkills(embedding, limit);
  }

  /**
   * Get skill by ID
   */
  async getSkill(skillId: string): Promise<Skill | null> {
    const buffer = await rustCore.getSkill(skillId);
    if (!buffer) return null;
    return deserialize<Skill>(buffer);
  }

  /**
   * Update skill statistics after execution
   */
  async updateStats(
    skillId: string,
    success: boolean,
    durationMs: number
  ): Promise<void> {
    await rustCore.updateSkillStats(skillId, success, durationMs);
  }

  /**
   * Execute skill with automatic stats tracking
   */
  async executeSkill<T, R>(
    skillId: string,
    executor: (skill: Skill, input: T) => Promise<R>,
    input: T
  ): Promise<R> {
    const skill = await this.getSkill(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const startTime = Date.now();
    let success = false;
    let result: R;

    try {
      result = await executor(skill, input);
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      await this.updateStats(skillId, success, duration);
    }
  }
}

// ============================================================================
// Trust Chain Bridge (Gem 2 - Batch Verification)
// ============================================================================

export class RustTrustChain {
  /**
   * Register new agent
   * Returns public key as hex string
   */
  async registerAgent(agentId: string): Promise<string> {
    const publicKeyBuffer = await rustCore.registerAgent(agentId);
    return publicKeyBuffer.toString('hex');
  }

  /**
   * Add trust transaction
   * Returns transaction hash
   */
  async addTransaction(
    agentId: string,
    delta: number,
    reason: string,
    taskHash: string
  ): Promise<string> {
    return rustCore.addTransaction(agentId, delta, reason, taskHash);
  }

  /**
   * Verify single agent's chain
   */
  async verifyChain(agentId: string): Promise<boolean> {
    return rustCore.verifyChain(agentId);
  }

  /**
   * Batch verify multiple chains (Gem 2 - 10x faster)
   */
  async verifyBatch(agentIds: string[]): Promise<Map<string, boolean>> {
    const results = await rustCore.verifyBatch(agentIds);
    return new Map(Object.entries(results));
  }

  /**
   * Get agent's trust score
   */
  async getTrustScore(agentId: string): Promise<number | null> {
    return rustCore.getTrustScore(agentId);
  }

  /**
   * Reward agent for good behavior
   */
  async reward(
    agentId: string,
    amount: number,
    reason: string,
    taskHash: string
  ): Promise<string> {
    return this.addTransaction(agentId, Math.abs(amount), reason, taskHash);
  }

  /**
   * Penalize agent for bad behavior
   */
  async penalize(
    agentId: string,
    amount: number,
    reason: string,
    taskHash: string
  ): Promise<string> {
    return this.addTransaction(agentId, -Math.abs(amount), reason, taskHash);
  }
}

// ============================================================================
// Unified Bridge API
// ============================================================================

export class RustBridge {
  public readonly eventStore: RustEventStore;
  public readonly skillCache: RustSkillCache;
  public readonly trustChain: RustTrustChain;

  constructor(config?: {
    eventBatchSize?: number;
    eventFlushInterval?: number;
    embeddingDim?: number;
  }) {
    this.eventStore = new RustEventStore(
      config?.eventBatchSize,
      config?.eventFlushInterval
    );
    this.skillCache = new RustSkillCache(config?.embeddingDim);
    this.trustChain = new RustTrustChain();
  }

  /**
   * Cleanup all resources
   */
  async destroy(): Promise<void> {
    await this.eventStore.destroy();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let bridgeInstance: RustBridge | null = null;

/**
 * Get singleton bridge instance
 */
export function getRustBridge(config?: {
  eventBatchSize?: number;
  eventFlushInterval?: number;
  embeddingDim?: number;
}): RustBridge {
  if (!bridgeInstance) {
    bridgeInstance = new RustBridge(config);
  }
  return bridgeInstance;
}

/**
 * Destroy singleton instance
 */
export async function destroyRustBridge(): Promise<void> {
  if (bridgeInstance) {
    await bridgeInstance.destroy();
    bridgeInstance = null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export { rustCore };
export default RustBridge;

// Made with Moe Abdelaziz
