import * as crypto from 'crypto';
import { AIX_CONFIG } from '../core/config';

/**
 * 🔗 AIX TRUST CHAIN (v1.0)
 * The immutable record of all sovereign mutations.
 * 
 * Made with Moe Abdelaziz
 */

export interface TrustEntry {
  hash: string;
  previousHash: string;
  timestamp: number;
  ring: number;
  action: string;
  actor: string;
  signature: string;
}

export class TrustChain {
  private static previousHash: string = '0'.repeat(64);

  /**
   * Appends a new verifiable entry to the chain.
   */
  static async append(ring: number, action: string, actor: string = 'AIX_AGENT'): Promise<TrustEntry> {
    const timestamp = Date.now();
    const data = `${this.previousHash}|${timestamp}|${ring}|${action}|${actor}`;
    
    const hash = crypto.createHmac('sha256', AIX_CONFIG.SECURITY.DNA_SECRET)
      .update(data)
      .digest('hex');

    const signature = crypto.createHmac('sha256', AIX_CONFIG.SECURITY.DNA_SECRET)
      .update(hash)
      .digest('hex');

    const entry: TrustEntry = {
      hash,
      previousHash: this.previousHash,
      timestamp,
      ring,
      action,
      actor,
      signature
    };

    // In a real scenario, we save this to the Vault (Redis/File)
    this.previousHash = hash;
    
    console.log(`🔗 [TrustChain] Entry Appended: ${action} (Ring ${ring})`);
    return entry;
  }
}

// Made with Moe Abdelaziz
