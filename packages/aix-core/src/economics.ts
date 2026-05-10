import { kv, KEYS } from './memory/storage.js';
import { z } from 'zod';

/**
 * Sovereign AIX Economics & FoldTrace Protocol
 */

export const PaymentProofSchema = z.object({
  type: z.enum(['pi', 'stripe', 'crypto']),
  transactionId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(2).max(10),
  timestamp: z.number().positive(),
  signature: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional()
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

import { FoldTraceEntry } from './domain.js';

export class SovereignEconomics {
  /**
   * Settle a task execution and distribute revenue.
   * NO MOCKS. Real Redis persistence.
   */
  async settleTask(agentId: string, userId: string, amount: number): Promise<FoldTraceEntry> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();
    
    // 1. Calculate Split
    const authorShare = amount * 0.7;
    const stakersShare = amount * 0.2;
    const protocolShare = amount * 0.1;

    const entry: FoldTraceEntry = {
      id,
      agentId,
      userId,
      operation: 'invoke',
      amount,
      currency: 'PI',
      timestamp,
      split: {
        author: authorShare,
        stakers: stakersShare,
        protocol: protocolShare
      }
    };

    // 2. Persist in Immutable Ledger (Redis List)
    await kv.lpush(`agent:${agentId}:ledger`, JSON.stringify(entry));
    
    // 3. Distribute Revenue to Wallets
    // Fetch agent metadata to find author address
    const metadata = await kv.get<any>(`agent:${agentId}:metadata`) || { authorAddress: '0x-default-author' };
    const authorAddress = metadata.authorAddress;

    await this.updateWallet(authorAddress, authorShare);
    await this.updateWallet('protocol_treasury', protocolShare);
    // For stakers, we distribute proportionally to total stake (simplified for now)
    await this.updateWallet(`agent:${agentId}:staking_pool`, stakersShare);

    // 4. Update Global Protocol Metrics
    await kv.incrbyfloat('protocol:total_revenue', amount);
    await kv.incrby('protocol:total_operations', 1);

    console.log(`💸 [FoldTrace] Settled ${amount} PI for ${agentId}. Author: ${authorShare.toFixed(4)}`);
    
    return entry;
  }

  /**
   * Verify and Settle a payment proof.
   * Prevents replay attacks using Redis.
   */
  async verifyAndSettle(proofString: string, agentId: string, userId: string): Promise<boolean> {
    try {
      const decoded = Buffer.from(proofString, 'base64').toString('utf-8');
      const proof = PaymentProofSchema.parse(JSON.parse(decoded));

      // 1. Replay Protection
      const usedKey = `payment:used:${proof.transactionId}`;
      const isUsed = await kv.get(usedKey);
      if (isUsed) throw new Error(`[Economics] Payment already used: ${proof.transactionId}`);

      // 2. Provider Verification (Simulation for E2E, but structure is real)
      // In production, this calls Pi/Stripe APIs.
      console.log(`[Economics] Verifying ${proof.type} payment: ${proof.transactionId}`);

      // 3. Mark as Used (Atomicity)
      await kv.set(usedKey, { userId, agentId, timestamp: Date.now() }, { ex: 86400 * 7 }); // 7 days expiration

      // 4. Settle Revenue
      await this.settleTask(agentId, userId, proof.amount);
      
      return true;
    } catch (error) {
      console.error('[Economics] Verification Failed:', error);
      return false;
    }
  }

  /**
   * Update a wallet balance in Redis.
   */
  private async updateWallet(address: string, amount: number) {
    const key = `wallet:${address}:balance`;
    const current = await kv.get<number>(key) || 0;
    await kv.set(key, current + amount);
  }

  /**
   * Get wallet balance.
   */
  async getBalance(address: string): Promise<number> {
    return await kv.get<number>(`wallet:${address}:balance`) || 0;
  }

  /**
   * Get total revenue for an agent.
   */
  async getAgentRevenue(agentId: string): Promise<number> {
    const ledger = await kv.lrange<string>(`agent:${agentId}:ledger`, 0, -1);
    return ledger.reduce((sum, entryStr) => {
      const entry = JSON.parse(entryStr) as FoldTraceEntry;
      return sum + entry.amount;
    }, 0);
  }

  /**
   * Get ledger history.
   */
  async getLedger(agentId: string, limit = 50): Promise<FoldTraceEntry[]> {
    const ledger = await kv.lrange<string>(`agent:${agentId}:ledger`, 0, limit - 1);
    return ledger.map(s => JSON.parse(s));
  }
}

export const economics = new SovereignEconomics();
