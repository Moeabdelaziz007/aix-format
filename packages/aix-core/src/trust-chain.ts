/**
 * Trust Chain
 * Handles signature verification and agent lineage tracking
 * SECURITY: Uses nacl.sign.detached.verify() for real Ed25519 signatures (RULE 3)
 */

import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

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
 */
export class TrustChain {
  private signatures: Map<string, SignatureData> = new Map();
  private lineage: Map<string, LineageRecord> = new Map();
  private verifiedAgents: Set<string> = new Set();

  /**
   * Verify signature using Ed25519 (nacl)
   * @param agentId - Agent identifier
   * @param data - Data that was signed
   * @param signature - Hex-encoded signature
   * @param publicKey - Hex-encoded Ed25519 public key
   */
  async verifySignature(
    agentId: string,
    data: any,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Convert data to canonical string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const message = util.decodeUTF8(dataString);
      
      // Decode hex signature and public key
      const signatureBytes = Buffer.from(signature, 'hex');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      
      // Verify using nacl.sign.detached.verify()
      const isValid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKeyBytes
      );
      
      if (isValid) {
        this.signatures.set(agentId, {
          agentId,
          data,
          signature,
          publicKey,
          timestamp: Date.now()
        });
        this.verifiedAgents.add(agentId);
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
    const record: LineageRecord = {
      agentId,
      parentId,
      createdAt: Date.now(),
      verified: this.verifiedAgents.has(agentId)
    };

    this.lineage.set(agentId, record);
  }

  /**
   * Get lineage for agent
   */
  getLineage(agentId: string): LineageRecord | undefined {
    return this.lineage.get(agentId);
  }

  /**
   * Get parent agent
   */
  getParent(agentId: string): string | null {
    const record = this.lineage.get(agentId);
    return record?.parentId || null;
  }

  /**
   * Get children agents
   */
  getChildren(agentId: string): string[] {
    const children: string[] = [];
    
    for (const [childId, record] of this.lineage.entries()) {
      if (record.parentId === agentId) {
        children.push(childId);
      }
    }

    return children;
  }

  /**
   * Check if agent is verified
   */
  isVerified(agentId: string): boolean {
    return this.verifiedAgents.has(agentId);
  }

  /**
   * Get signature data
   */
  getSignature(agentId: string): SignatureData | undefined {
    return this.signatures.get(agentId);
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
    
    // Check if hash starts with required number of zeros
    const prefix = '0'.repeat(difficulty);
    return hash.startsWith(prefix);
  }

  /**
   * Reset trust chain state (for testing)
   */
  reset(): void {
    this.signatures.clear();
    this.lineage.clear();
    this.verifiedAgents.clear();
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
  if (trustChainInstance) {
    trustChainInstance.reset();
    trustChainInstance = null;
  }
}

// Made with Bob
