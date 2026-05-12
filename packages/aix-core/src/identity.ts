import { kv, KEYS } from './memory/storage';
import { getRustBridge } from '@aix/rust-core/src/bridge';
import { BusEventSchema } from './domain';
import crypto from 'crypto';

/**
 * 🆔 IDENTITY_SERVICE
 * Handles KYC, DID, and Sovereign Identity proofs.
 * Integrated with Rust TrustChain.
 * 
 * Made with Moe Abdelaziz
 */

export interface KycStatus {
  verified: boolean;
  level: 'none' | 'basic' | 'advanced' | 'sovereign';
  token?: string;
  timestamp: number;
}

export class IdentityService {
  private _rust: any = null;
  private get rust() {
    if (!this._rust) {
      try { this._rust = getRustBridge(); } catch(e) { return null; }
    }
    return this._rust;
  }

  /**
   * Fetches KYC status for a user.
   */
  async getKycStatus(userId: string): Promise<KycStatus> {
    const key = `user:${userId}:kyc`;
    const status = await kv.get<KycStatus>(key);
    return status || { verified: false, level: 'none', timestamp: Date.now() };
  }

  /**
   * Verifies a KYC token.
   */
  async verifyKycToken(userId: string, token: string): Promise<boolean> {
    const status = await this.getKycStatus(userId);
    
    const isValid = status.verified && status.token === token;
    
    if (isValid) {
      console.log(`🆔 [Identity] KYC verified for ${userId} (Level: ${status.level})`);
    }
    
    return isValid;
  }

  /**
   * Updates KYC status (e.g. after successful Pi KYC).
   */
  async updateKycStatus(userId: string, level: KycStatus['level'], token?: string): Promise<void> {
    const status: KycStatus = {
      verified: true,
      level,
      token: token || crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now()
    };

    await kv.set(`user:${userId}:kyc`, status);
    
    // Reward user in TrustChain for completing KYC
    try {
      await this.rust.trustChain.reward(`user:${userId}`, 100, 'KYC_COMPLETED', 'identity');
      
      // Publish to Pulse
      await this.rust.eventStore.publish(BusEventSchema.parse({
        type: 'IdentityEvent',
        agent_id: `user:${userId}`,
        user_id: userId,
        action: 'kyc_update',
        status: level,
        timestamp: status.timestamp
      }));
    } catch { /* Fallback */ }
  }
}

export const identity = new IdentityService();
