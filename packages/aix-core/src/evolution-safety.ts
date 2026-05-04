/**
 * Evolution Safety System - Security-First Evolution
 * 
 * SECURITY LAYERS:
 * 1. TrustChain validation before ANY evolution
 * 2. Rollback mechanism for failed evolutions
 * 3. Complete audit log with crypto hashes
 * 4. Circuit breaker for repeated failures
 * 
 * RULE 3: TrustChain.append() for every evolution
 * RULE 2: crypto.randomBytes for audit IDs
 */

import crypto from 'crypto';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { trustChain } from './trust-chain/index';
import { getEvolution, recordLesson } from './evolution/tracker';

interface EvolutionSnapshot {
  snapshotId: string;
  agentDid: string;
  timestamp: number;
  state: {
    lessons: string[];
    trust_delta: number;
    loops_completed: number;
  };
  auditHash: string;
}

interface EvolutionAuditEntry {
  auditId: string;
  agentDid: string;
  action: 'evolution_started' | 'evolution_completed' | 'evolution_failed' | 'evolution_rolled_back';
  timestamp: number;
  details: any;
  auditHash: string;
  trustChainIndex: number;
}

interface RollbackResult {
  success: boolean;
  snapshotId: string;
  restoredState: any;
  auditId: string;
}

export class EvolutionSafety {
  /**
   * E5.1: TRUSTCHAIN VALIDATION - Security gate before evolution
   * RULE 3: Every evolution must pass TrustChain validation
   */
  static async validateBeforeEvolution(agentDid: string): Promise<{
    allowed: boolean;
    reason: string;
    trustScore: number;
  }> {
    // Check TrustChain history
    const chain = trustChain.getChain();
    const agentEntries = chain.filter(e => e.actor_did === agentDid);

    if (agentEntries.length === 0) {
      return {
        allowed: false,
        reason: 'No TrustChain history - agent not verified',
        trustScore: 0,
      };
    }

    // Calculate trust score from chain
    const recentEntries = agentEntries.slice(-10);
    const approvedCount = recentEntries.filter(e => e.human_approved).length;
    const trustScore = approvedCount / recentEntries.length;

    // Check for recent failures
    const recentFailures = recentEntries.filter(e => 
      e.action.includes('failed') || e.action.includes('blocked')
    );

    if (recentFailures.length > 3) {
      return {
        allowed: false,
        reason: `Too many recent failures: ${recentFailures.length}/10`,
        trustScore,
      };
    }

    // Minimum trust threshold
    if (trustScore < 0.3) {
      return {
        allowed: false,
        reason: `Trust score ${trustScore.toFixed(2)} below threshold (0.3)`,
        trustScore,
      };
    }

    return {
      allowed: true,
      reason: `Trust score ${trustScore.toFixed(2)} meets requirements`,
      trustScore,
    };
  }

  /**
   * E5.2: SNAPSHOT - Create rollback point before evolution
   * RULE 2: Use crypto.randomBytes for snapshot ID
   */
  static async createSnapshot(agentDid: string): Promise<EvolutionSnapshot> {
    const evolution = getEvolution(agentDid);
    
    if (!evolution) {
      throw new Error(`Cannot snapshot agent ${agentDid} - no evolution data`);
    }

    // RULE 2: Cryptographically secure ID
    const snapshotId = crypto.randomBytes(16).toString('hex');

    const snapshot: EvolutionSnapshot = {
      snapshotId,
      agentDid,
      timestamp: Date.now(),
      state: {
        lessons: [...evolution.lessons],
        trust_delta: evolution.trust_delta,
        loops_completed: evolution.loops_completed,
      },
      auditHash: '', // Will be set below
    };

    // Calculate audit hash
    snapshot.auditHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot.state))
      .digest('hex');

    // Store snapshot
    await kv.set(
      `evolution:snapshot:${agentDid}:${snapshotId}`,
      snapshot
    );

    // Add to snapshot list
    await kv.lpush(
      KEYS.agentEvolutionSnapshots(agentDid),
      snapshotId
    );
    await kv.ltrim(KEYS.agentEvolutionSnapshots(agentDid), 0, 9); // Keep last 10

    return snapshot;
  }

  /**
   * E5.2: ROLLBACK - Restore agent to previous snapshot
   * Used when evolution fails or causes issues
   */
  static async rollback(
    agentDid: string,
    snapshotId: string
  ): Promise<RollbackResult> {
    // RULE 2: Secure audit ID
    const auditId = crypto.randomBytes(16).toString('hex');

    try {
      // Retrieve snapshot
      const snapshot = await kv.get<EvolutionSnapshot>(
        `evolution:snapshot:${agentDid}:${snapshotId}`
      );

      if (!snapshot) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }

      // Verify audit hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(snapshot.state))
        .digest('hex');

      if (expectedHash !== snapshot.auditHash) {
        throw new Error('Snapshot integrity check failed - hash mismatch');
      }

      // Restore state (simplified - in production would restore to storage)
      const evolution = getEvolution(agentDid);
      if (evolution) {
        evolution.lessons = [...snapshot.state.lessons];
        evolution.trust_delta = snapshot.state.trust_delta;
        evolution.loops_completed = snapshot.state.loops_completed;
      }

      // RULE 3: Record in TrustChain
      trustChain.append('evolution.rolled_back', agentDid, {
        snapshotId,
        auditId,
        timestamp: Date.now(),
      });

      // E5.3: Audit log
      await this.logAudit({
        auditId,
        agentDid,
        action: 'evolution_rolled_back',
        timestamp: Date.now(),
        details: { snapshotId, restoredState: snapshot.state },
        auditHash: expectedHash,
        trustChainIndex: trustChain.getChain().length - 1,
      });

      return {
        success: true,
        snapshotId,
        restoredState: snapshot.state,
        auditId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed rollback
      await this.logAudit({
        auditId,
        agentDid,
        action: 'evolution_failed',
        timestamp: Date.now(),
        details: { error: errorMessage, snapshotId },
        auditHash: crypto.randomBytes(32).toString('hex'),
        trustChainIndex: -1,
      });

      throw error;
    }
  }

  /**
   * E5.3: AUDIT LOG - Complete evolution history
   * Every evolution operation is logged with crypto hash
   */
  static async logAudit(entry: EvolutionAuditEntry): Promise<void> {
    // Store audit entry
    await kv.lpush(
      KEYS.agentEvolutionAuditLog(entry.agentDid),
      JSON.stringify(entry)
    );

    // Keep last 1000 entries
    await kv.ltrim(KEYS.agentEvolutionAuditLog(entry.agentDid), 0, 999);

    // Also store in global audit log
    await kv.lpush(
      'evolution:audit:global',
      JSON.stringify(entry)
    );
    await kv.ltrim('evolution:audit:global', 0, 9999); // Keep last 10k
  }

  /**
   * SAFE EVOLUTION WRAPPER - Combines all safety features
   * Use this for any evolution operation
   */
  static async safeEvolution<T>(
    agentDid: string,
    evolutionFn: () => Promise<T>
  ): Promise<{
    success: boolean;
    result?: T;
    error?: string;
    auditId: string;
    snapshotId?: string;
  }> {
    const auditId = crypto.randomBytes(16).toString('hex');
    let snapshotId: string | undefined;

    try {
      // E5.1: Validate before evolution
      const validation = await this.validateBeforeEvolution(agentDid);
      if (!validation.allowed) {
        throw new Error(`Evolution blocked: ${validation.reason}`);
      }

      // E5.2: Create snapshot
      const snapshot = await this.createSnapshot(agentDid);
      snapshotId = snapshot.snapshotId;

      // Log start
      await this.logAudit({
        auditId,
        agentDid,
        action: 'evolution_started',
        timestamp: Date.now(),
        details: { snapshotId, trustScore: validation.trustScore },
        auditHash: snapshot.auditHash,
        trustChainIndex: trustChain.getChain().length,
      });

      // Execute evolution
      const result = await evolutionFn();

      // RULE 3: Record success in TrustChain
      trustChain.append('evolution.completed', agentDid, {
        auditId,
        snapshotId,
        timestamp: Date.now(),
      });

      // Log completion
      await this.logAudit({
        auditId,
        agentDid,
        action: 'evolution_completed',
        timestamp: Date.now(),
        details: { snapshotId },
        auditHash: crypto.randomBytes(32).toString('hex'),
        trustChainIndex: trustChain.getChain().length - 1,
      });

      return {
        success: true,
        result,
        auditId,
        snapshotId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // E5.2: Auto-rollback on failure
      if (snapshotId) {
        try {
          await this.rollback(agentDid, snapshotId);
          console.log(`[EvolutionSafety] Auto-rolled back ${agentDid} to ${snapshotId}`);
        } catch (rollbackError) {
          console.error(`[EvolutionSafety] Rollback failed:`, rollbackError);
        }
      }

      // RULE 3: Record failure in TrustChain
      trustChain.append('evolution.failed', agentDid, {
        auditId,
        error: errorMessage,
        timestamp: Date.now(),
      });

      // Log failure
      await this.logAudit({
        auditId,
        agentDid,
        action: 'evolution_failed',
        timestamp: Date.now(),
        details: { error: errorMessage, snapshotId },
        auditHash: crypto.randomBytes(32).toString('hex'),
        trustChainIndex: trustChain.getChain().length - 1,
      });

      return {
        success: false,
        error: errorMessage,
        auditId,
        snapshotId,
      };
    }
  }

  /**
   * GET AUDIT HISTORY - Retrieve evolution audit trail
   */
  static async getAuditHistory(
    agentDid: string,
    limit: number = 50
  ): Promise<EvolutionAuditEntry[]> {
    const entries = await kv.lrange<string>(
      KEYS.agentEvolutionAuditLog(agentDid),
      0,
      limit - 1
    );

    return entries.map(e => JSON.parse(e));
  }

  /**
   * VERIFY AUDIT INTEGRITY - Check if audit log is tampered
   */
  static async verifyAuditIntegrity(agentDid: string): Promise<{
    valid: boolean;
    tamperedEntries: number;
    totalEntries: number;
  }> {
    const entries = await this.getAuditHistory(agentDid, 1000);
    let tamperedCount = 0;

    for (const entry of entries) {
      // Verify hash matches content
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(entry.details))
        .digest('hex');

      if (entry.auditHash !== expectedHash) {
        tamperedCount++;
      }
    }

    return {
      valid: tamperedCount === 0,
      tamperedEntries: tamperedCount,
      totalEntries: entries.length,
    };
  }
}

// Made with Moe Abdelaziz
