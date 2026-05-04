/**
 * Trust Chain
 * Handles signature verification and agent lineage tracking
 * SECURITY: Uses nacl.sign.detached.verify() for real Ed25519 signatures (RULE 3)
 */

import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';

export interface SignatureData {
  agentId: string;
  data: any;
  signature: string;
  publicKey: string;  // Ed25519 public key (hex)
  timestamp: number;
}

export interface LineageRecord {
  agentId: string;
  parentId: string | null;
  createdAt: number;
  verified: boolean;
}

/**
 * TrustChain class
 * Persistent Meta-Cognitive Trust Layer
 */
export class TrustChain {
  /**
   * Verify signature using Ed25519 (nacl)
   */
  async verifySignature(
    agentId: string,
    data: any,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const message = util.decodeUTF8(dataString);
      
      const signatureBytes = Buffer.from(signature, 'hex');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      
      const isValid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKeyBytes
      );
      
      if (isValid) {
        const sigData: SignatureData = {
          agentId,
          data,
          signature,
          publicKey,
          timestamp: Date.now()
        };
        
        // Persist signature and verification status
        await kv.set(`trust:sig:${agentId}`, sigData);
        await kv.set(`trust:verified:${agentId}`, true);
        
        // Update Trust Score (Proactive improvement)
        const currentScore = await kv.get<number>(KEYS.agentTrustScore(agentId)) || 0;
        await kv.set(KEYS.agentTrustScore(agentId), Math.min(10, currentScore + 0.1));
      }

      return isValid;
    } catch (error) {
      console.error('[TrustChain] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Record agent lineage
   */
  async recordLineage(agentId: string, parentId: string | null): Promise<void> {
    const isVerified = await this.isVerified(agentId);
    const record: LineageRecord = {
      agentId,
      parentId,
      createdAt: Date.now(),
      verified: isVerified
    };

    await kv.set(KEYS.lineageNode(agentId), record);
    if (parentId) {
      // Add to children list in Redis
      const children = await kv.get<string[]>(KEYS.lineageChildren(parentId)) || [];
      if (!children.includes(agentId)) {
        children.push(agentId);
        await kv.set(KEYS.lineageChildren(parentId), children);
      }
    }
  }

  /**
   * Get lineage for agent
   */
  async getLineage(agentId: string): Promise<LineageRecord | null> {
    return await kv.get<LineageRecord>(KEYS.lineageNode(agentId));
  }

  /**
   * Get parent agent
   */
  async getParent(agentId: string): Promise<string | null> {
    const record = await this.getLineage(agentId);
    return record?.parentId || null;
  }

  /**
   * Get children agents
   */
  async getChildren(agentId: string): Promise<string[]> {
    return await kv.get<string[]>(KEYS.lineageChildren(agentId)) || [];
  }

  /**
   * Check if agent is verified
   */
  async isVerified(agentId: string): Promise<boolean> {
    return await kv.get<boolean>(`trust:verified:${agentId}`) || false;
  }

  /**
   * Get signature data
   */
  async getSignature(agentId: string): Promise<SignatureData | null> {
    return await kv.get<SignatureData>(`trust:sig:${agentId}`);
  }

  /**
   * Append an action to the trust chain (RULE 3)
   * Returns a unique auditHash for the action
   */
  async append(agentId: string, action: string, data: any): Promise<string> {
    const timestamp = Date.now();
    const prevAction = await kv.get<string>(`trust:last_action:${agentId}`) || 'genesis';
    
    // Create Audit Hash: SHA256(prevHash + agentId + action + data + timestamp)
    const auditHash = this.generateHash({
      prevAction,
      agentId,
      action,
      data,
      timestamp
    });

    const actionRecord = {
      auditHash,
      prevAction,
      agentId,
      action,
      data,
      timestamp
    };

    // Store the action and update the tail of the chain
    await kv.set(`trust:action:${auditHash}`, actionRecord);
    await kv.set(`trust:last_action:${agentId}`, auditHash);
    
    // Log to Pulse (Nervous System Bus)
    await kv.set(KEYS.aixEvents(`trust:${agentId}`), {
      type: 'TRUST_APPEND',
      agentId,
      action,
      auditHash
    });

    return auditHash;
  }

  /**
   * Generate hash for data
   */
  generateHash(data: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Verify proof of work (PoW)
   */
  async verifyPoW(agentId: string, nonce: number, difficulty: number): Promise<boolean> {
    const data = `${agentId}:${nonce}`;
    const hash = this.generateHash(data);
    const prefix = '0'.repeat(difficulty);
    return hash.startsWith(prefix);
  }
}

/**
 * Singleton instance
 */
let trustChainInstance: TrustChain | null = null;

/**
 * Get trust chain instance
 */
export function getTrustChain(): TrustChain {
  if (!trustChainInstance) {
    trustChainInstance = new TrustChain();
  }
  return trustChainInstance;
}

/**
 * Reset trust chain instance (for testing)
 */
export function resetTrustChain(): void {
  trustChainInstance = null;
}

// Made with Moe Abdelaziz
