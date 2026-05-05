import { kv, KEYS } from './storage';
import { getRustBridge } from '../../aix-rust-core/src/bridge';
import { 
  TreasuryEvent, 
  TreasuryEventSchema, 
  PaymentRequest, 
  Settlement, 
  SettlementSchema,
  FoldTraceEntry,
  FoldTraceSchema
} from './domain';
import crypto from 'crypto';

/**
 * 🏛️ SOVEREIGN_TREASURY (AIX v1.5)
 * Centralized Economic & Settlement Engine.
 * Incorporates FoldTrace Protocol and Legacy Routing logic.
 * 
 * Made with Moe Abdelaziz
 */

export class SovereignTreasury {
  private rust = getRustBridge();

  /**
   * Records an economic event and publishes to Pulse.
   */
  async recordEvent(eventInput: Omit<TreasuryEvent, 'timestamp'>): Promise<void> {
    const event = TreasuryEventSchema.parse({
      ...eventInput,
      timestamp: Date.now()
    });

    // 1. Persist to KV for history
    const historyKey = `treasury:history:${event.agentId}`;
    await kv.lpush(historyKey, JSON.stringify(event));
    await kv.ltrim(historyKey, 0, 99);

    // 2. Publish to Pulse (Rust Event Store)
    await this.rust.eventStore.publish({
      type: 'TreasuryEvent',
      agent_id: event.agentId,
      event_type: event.type,
      amount: event.amount,
      currency: event.currency,
      timestamp: event.timestamp,
    });

    console.log(`🏛️ [Treasury] Event Recorded: ${event.type} for ${event.agentId} (${event.amount} ${event.currency})`);
  }

  /**
   * Processes a payment request and settles it via FoldTrace.
   */
  async processPayment(agentId: string, request: PaymentRequest & { userId: string, rail?: Settlement['rail'] }): Promise<Settlement> {
    console.log(`🏛️ [Treasury] Processing payment for ${agentId}: ${request.amount} ${request.currency}`);

    // 1. Rail Selection
    const rail = request.rail || (['PI', 'USDC', 'SOL'].includes(request.currency) ? 'x402' : 'stripe_acp');

    // 2. Settlement Creation
    const settlement = SettlementSchema.parse({
      transactionId: `txn_${crypto.randomBytes(12).toString('hex')}`,
      status: rail === 'escrow' ? 'pending' : 'success',
      rail,
      amount: request.amount,
      currency: request.currency,
      timestamp: new Date().toISOString()
    });

    // 3. FoldTrace Settlement (If successful or internal)
    if (settlement.status === 'success') {
      await this.settleFoldTrace(agentId, request.userId, request.amount, request.currency);
    }

    // 4. Record Event
    await this.recordEvent({
      type: 'settlement',
      agentId,
      amount: request.amount,
      currency: request.currency,
      metadata: { rail, transactionId: settlement.transactionId, status: settlement.status }
    });

    return settlement;
  }

  /**
   * FoldTrace Protocol: Settle revenue and distribute shares.
   */
  private async settleFoldTrace(agentId: string, userId: string, amount: number, currency: string) {
    const authorShare = amount * 0.7;
    const stakersShare = amount * 0.2;
    const protocolShare = amount * 0.1;

    const entry: FoldTraceEntry = {
      id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      agentId,
      userId,
      operation: 'invoke',
      amount,
      currency,
      timestamp: Date.now(),
      split: {
        author: authorShare,
        stakers: stakersShare,
        protocol: protocolShare
      }
    };

    // Persist to Ledger
    await kv.lpush(`agent:${agentId}:ledger`, JSON.stringify(entry));
    
    // Distribute (Simplified Wallet Update)
    await this.updateWallet(`author:${agentId}`, authorShare, currency);
    await this.updateWallet('protocol_treasury', protocolShare, currency);
    await this.updateWallet(`agent:${agentId}:staking_pool`, stakersShare, currency);

    // Update Pulse
    await this.recordEvent({
      type: 'revenue',
      agentId,
      amount,
      currency,
      metadata: { foldTraceId: entry.id, split: entry.split }
    });
  }

  /**
   * Optimizes treasury by rebalancing to yield sources.
   */
  async rebalance(agentId: string, target: string, amount: number): Promise<void> {
    await this.recordEvent({
      type: 'rebalance',
      agentId,
      amount,
      currency: 'PI',
      metadata: { target, action: 'rebalance_to_yield' }
    });
  }

  private async updateWallet(address: string, amount: number, currency: string) {
    const key = `wallet:${address}:${currency}`;
    const current = await kv.get<number>(key) || 0;
    await kv.set(key, current + amount);
  }
}

export const treasury = new SovereignTreasury();
