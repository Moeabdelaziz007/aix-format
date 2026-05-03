/**
 * AIX Rust Core - Type-safe FFI bindings (Gem 5)
 * 
 * High-performance Rust core with TypeScript type safety across FFI boundary.
 * All operations use binary serialization (bincode) for maximum performance.
 */

// ============================================================================
// Event Store Types
// ============================================================================

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type BusEvent =
  | {
      type: 'TaskSpawned';
      agent_id: string;
      task_id: string;
      timestamp: number;
    }
  | {
      type: 'TaskCompleted';
      agent_id: string;
      task_id: string;
      result: string;
      timestamp: number;
    }
  | {
      type: 'SkillExtracted';
      agent_id: string;
      skill_id: string;
      skill_name: string;
      timestamp: number;
    }
  | {
      type: 'SecurityAlert';
      agent_id: string;
      reason: string;
      severity: AlertSeverity;
      timestamp: number;
    }
  | {
      type: 'TrustUpdated';
      agent_id: string;
      delta: number;
      new_score: number;
      timestamp: number;
    }
  | {
      type: 'SkillExecuted';
      agent_id: string;
      skill_id: string;
      duration_ms: number;
      success: boolean;
      timestamp: number;
    };

// ============================================================================
// Skill Cache Types
// ============================================================================

export interface DataSkill {
  name: string;
  description: string;
  input_schema: string;
  output_schema: string;
  transformations: string[];
}

export interface ApiSkill {
  name: string;
  description: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
}

export interface ComputeSkill {
  name: string;
  description: string;
  algorithm: string;
  complexity: string;
}

export interface FileSkill {
  name: string;
  description: string;
  operations: string[];
  file_types: string[];
}

export interface NetworkSkill {
  name: string;
  description: string;
  protocols: string[];
}

export type SkillKind =
  | { kind: 'DataProcessing' } & DataSkill
  | { kind: 'ApiCall' } & ApiSkill
  | { kind: 'Computation' } & ComputeSkill
  | { kind: 'FileOperation' } & FileSkill
  | { kind: 'NetworkRequest' } & NetworkSkill;

export interface Skill {
  id: string;
  kind: SkillKind;
  embedding: number[];
  usage_count: number;
  success_rate: number;
  avg_duration_ms: number;
}

// ============================================================================
// Trust Chain Types
// ============================================================================

export interface TrustTransaction {
  agent_id: string;
  delta: number;
  reason: string;
  task_hash: string;
  timestamp: number;
  prev_hash: string;
  signature: number[];
  nonce: number;
}

// ============================================================================
// Rust Core Interface
// ============================================================================

export interface RustCore {
  // ========== Event Store ==========
  
  /**
   * Append batch of events (Gem 1 - 1000x faster batching)
   * @param buffer Binary-serialized Vec<BusEvent> using bincode
   */
  appendEventBatch(buffer: Buffer): Promise<void>;

  /**
   * Query events by agent ID with optional pattern matching
   * @param agentId Agent identifier
   * @param pattern Optional search pattern (null for all events)
   * @returns Binary-serialized Vec<BusEvent>
   */
  queryEvents(agentId: string, pattern: string | null): Promise<Buffer>;

  /**
   * Query events by type
   * @param eventType Event type name
   * @returns Binary-serialized Vec<BusEvent>
   */
  queryEventsByType(eventType: string): Promise<Buffer>;

  /**
   * Get total event count
   */
  eventCount(): Promise<number>;

  // ========== Skill Cache ==========

  /**
   * Add skill to cache
   * @param buffer Binary-serialized Skill using bincode
   */
  addSkill(buffer: Buffer): Promise<void>;

  /**
   * SIMD semantic search (Gem 2 - 5x faster)
   * @param queryEmbedding Query embedding vector (Float32Array)
   * @param limit Maximum number of results
   * @returns Array of skill IDs sorted by similarity
   */
  searchSkills(queryEmbedding: Float32Array, limit: number): Promise<string[]>;

  /**
   * Get skill by ID
   * @param skillId Skill identifier
   * @returns Binary-serialized Skill or null if not found
   */
  getSkill(skillId: string): Promise<Buffer | null>;

  /**
   * Update skill usage statistics
   * @param skillId Skill identifier
   * @param success Whether execution was successful
   * @param durationMs Execution duration in milliseconds
   */
  updateSkillStats(skillId: string, success: boolean, durationMs: number): Promise<void>;

  // ========== Trust Chain ==========

  /**
   * Register new agent with generated keypair
   * @param agentId Agent identifier
   * @returns Public key bytes (32 bytes for Ed25519)
   */
  registerAgent(agentId: string): Promise<Buffer>;

  /**
   * Add trust transaction to agent's chain
   * @param agentId Agent identifier
   * @param delta Trust score change (positive or negative)
   * @param reason Human-readable reason
   * @param taskHash Hash of associated task
   * @returns Transaction hash
   */
  addTransaction(
    agentId: string,
    delta: number,
    reason: string,
    taskHash: string
  ): Promise<string>;

  /**
   * Verify single agent's chain integrity
   * @param agentId Agent identifier
   * @returns True if chain is valid
   */
  verifyChain(agentId: string): Promise<boolean>;

  /**
   * Batch verify multiple chains (Gem 2 - 10x faster)
   * @param agentIds Array of agent identifiers
   * @returns Map of agent_id to validation result
   */
  verifyBatch(agentIds: string[]): Promise<Record<string, boolean>>;

  /**
   * Get agent's current trust score
   * @param agentId Agent identifier
   * @returns Trust score or null if agent not found
   */
  getTrustScore(agentId: string): Promise<number | null>;
}

/**
 * Native Rust core module
 * Load with: const rustCore = require('@aix/rust-core');
 */
declare const rustCore: RustCore;

export default rustCore;

// ============================================================================
// Helper Types for Serialization
// ============================================================================

/**
 * Serialization helper for converting between TypeScript and Rust types
 */
export namespace Serialization {
  /**
   * Serialize events to binary buffer
   */
  export function serializeEvents(events: BusEvent[]): Buffer;

  /**
   * Deserialize events from binary buffer
   */
  export function deserializeEvents(buffer: Buffer): BusEvent[];

  /**
   * Serialize skill to binary buffer
   */
  export function serializeSkill(skill: Skill): Buffer;

  /**
   * Deserialize skill from binary buffer
   */
  export function deserializeSkill(buffer: Buffer): Skill;
}

// Made with Bob
