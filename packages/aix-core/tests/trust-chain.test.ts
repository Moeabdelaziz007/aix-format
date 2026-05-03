/**
 * AIX Trust Chain - Comprehensive Test Suite
 * Tests for Satoshi's Trustless Proof blockchain
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordTrustTransaction,
  getTrustScore,
  getTrustChain,
  verifyChainIntegrity,
  getTrustLeaderboard,
  getTrustRelationship,
  detectTampering,
  exportChain,
  TrustTransaction,
  AgentTrustScore
} from '../src/trust-chain';
import { kv } from '../src/storage/adapter';

// Mock Redis
vi.mock('../src/storage/adapter', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    lpush: vi.fn(),
    lrange: vi.fn(),
    del: vi.fn()
  }
}));

describe('Trust Chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordTrustTransaction', () => {
    it('should create trust transaction with proof of work', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);
      vi.mocked(kv.get).mockResolvedValue(null);

      const tx = await recordTrustTransaction(
        'agent_1',
        'agent_1',
        'agent_2',
        0.5,
        'Good collaboration'
      );

      expect(tx.agentId).toBe('agent_1');
      expect(tx.fromAgent).toBe('agent_1');
      expect(tx.toAgent).toBe('agent_2');
      expect(tx.trustDelta).toBe(0.5);
      expect(tx.hash.startsWith('0')).toBe(true);
      expect(tx.signature).toBeTruthy();
    });

    it('should chain transactions with prevHash', async () => {
      const existingTx: TrustTransaction = {
        txId: 'tx:agent_1:123:abc',
        agentId: 'agent_1',
        fromAgent: 'agent_1',
        toAgent: 'agent_2',
        trustDelta: 0.3,
        reason: 'First tx',
        timestamp: Date.now() - 1000,
        prevHash: '0'.repeat(64),
        hash: '0abc123',
        nonce: 42,
        signature: 'sig123'
      };

      vi.mocked(kv.lrange).mockResolvedValue([existingTx]);
      vi.mocked(kv.get).mockResolvedValue(null);

      const tx = await recordTrustTransaction(
        'agent_1',
        'agent_1',
        'agent_3',
        0.4,
        'Second tx'
      );

      expect(tx.prevHash).toBe(existingTx.hash);
    });

    it('should reject invalid trust delta', async () => {
      await expect(
        recordTrustTransaction('agent_1', 'agent_1', 'agent_2', 1.5, 'Invalid')
      ).rejects.toThrow('Trust delta must be between -1 and 1');

      await expect(
        recordTrustTransaction('agent_1', 'agent_1', 'agent_2', -1.5, 'Invalid')
      ).rejects.toThrow('Trust delta must be between -1 and 1');
    });

    it('should update trust score', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);
      vi.mocked(kv.get).mockResolvedValue(null);

      await recordTrustTransaction(
        'agent_1',
        'agent_1',
        'agent_2',
        0.5,
        'Good work'
      );

      expect(kv.set).toHaveBeenCalledWith(
        'trust:score:agent_2',
        expect.objectContaining({
          agentId: 'agent_2',
          totalTrust: 0.5,
          transactionCount: 1
        })
      );
    });

    it('should handle negative trust delta', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);
      vi.mocked(kv.get).mockResolvedValue(null);

      const tx = await recordTrustTransaction(
        'agent_1',
        'agent_1',
        'agent_2',
        -0.3,
        'Poor performance'
      );

      expect(tx.trustDelta).toBe(-0.3);
    });

    it('should store transaction in chain', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);
      vi.mocked(kv.get).mockResolvedValue(null);

      await recordTrustTransaction(
        'agent_1',
        'agent_1',
        'agent_2',
        0.5,
        'Good work'
      );

      expect(kv.lpush).toHaveBeenCalledWith(
        'trust:chain:agent_1',
        expect.objectContaining({
          agentId: 'agent_1',
          trustDelta: 0.5
        })
      );
    });
  });

  describe('getTrustScore', () => {
    it('should return trust score for agent', async () => {
      const score: AgentTrustScore = {
        agentId: 'agent_1',
        totalTrust: 5.5,
        transactionCount: 10,
        lastUpdated: Date.now(),
        chainLength: 10
      };

      vi.mocked(kv.get).mockResolvedValue(score);

      const result = await getTrustScore('agent_1');

      expect(result).toEqual(score);
    });

    it('should return zero score for new agent', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await getTrustScore('agent_new');

      expect(result.agentId).toBe('agent_new');
      expect(result.totalTrust).toBe(0);
      expect(result.transactionCount).toBe(0);
    });
  });

  describe('getTrustChain', () => {
    it('should return transaction chain', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Good work',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'sig1'
        },
        {
          txId: 'tx:2',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_3',
          trustDelta: 0.3,
          reason: 'Helpful',
          timestamp: Date.now(),
          prevHash: '0abc123',
          hash: '0def456',
          nonce: 38,
          signature: 'sig2'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await getTrustChain('agent_1');

      expect(result).toHaveLength(2);
      expect(result[0].txId).toBe('tx:1');
    });

    it('should respect limit parameter', async () => {
      const transactions = Array(100).fill(null).map((_, i) => ({
        txId: `tx:${i}`,
        agentId: 'agent_1',
        fromAgent: 'agent_1',
        toAgent: 'agent_2',
        trustDelta: 0.1,
        reason: 'Test',
        timestamp: Date.now(),
        prevHash: '0'.repeat(64),
        hash: `0hash${i}`,
        nonce: i,
        signature: `sig${i}`
      }));

      vi.mocked(kv.lrange).mockResolvedValue(transactions.slice(0, 10));

      const result = await getTrustChain('agent_1', 10);

      expect(kv.lrange).toHaveBeenCalledWith('trust:chain:agent_1', 0, 9);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should verify valid chain', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:2',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_3',
          trustDelta: 0.3,
          reason: 'Second',
          timestamp: Date.now(),
          prevHash: '0abc123',
          hash: '0def456',
          nonce: 38,
          signature: 'e8c5f4a3b2d1e9f8c7b6a5d4e3f2c1b0'
        },
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'First',
          timestamp: Date.now() - 1000,
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await verifyChainIntegrity('agent_1');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect chain break', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:2',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_3',
          trustDelta: 0.3,
          reason: 'Second',
          timestamp: Date.now(),
          prevHash: '0wrong',
          hash: '0def456',
          nonce: 38,
          signature: 'e8c5f4a3b2d1e9f8c7b6a5d4e3f2c1b0'
        },
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'First',
          timestamp: Date.now() - 1000,
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await verifyChainIntegrity('agent_1');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Chain break');
    });

    it('should detect invalid proof of work', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Test',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: 'abc123', // Doesn't start with 0
          nonce: 42,
          signature: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await verifyChainIntegrity('agent_1');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('proof of work'))).toBe(true);
    });

    it('should return valid for empty chain', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);

      const result = await verifyChainIntegrity('agent_1');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getTrustLeaderboard', () => {
    it('should return sorted leaderboard', async () => {
      const scores: AgentTrustScore[] = [
        {
          agentId: 'agent_1',
          totalTrust: 3.5,
          transactionCount: 7,
          lastUpdated: Date.now(),
          chainLength: 7
        },
        {
          agentId: 'agent_2',
          totalTrust: 8.2,
          transactionCount: 15,
          lastUpdated: Date.now(),
          chainLength: 15
        },
        {
          agentId: 'agent_3',
          totalTrust: 5.1,
          transactionCount: 10,
          lastUpdated: Date.now(),
          chainLength: 10
        }
      ];

      vi.mocked(kv.get)
        .mockResolvedValueOnce(scores[0])
        .mockResolvedValueOnce(scores[1])
        .mockResolvedValueOnce(scores[2]);

      const result = await getTrustLeaderboard(['agent_1', 'agent_2', 'agent_3']);

      expect(result).toHaveLength(3);
      expect(result[0].agentId).toBe('agent_2');
      expect(result[1].agentId).toBe('agent_3');
      expect(result[2].agentId).toBe('agent_1');
    });

    it('should respect limit parameter', async () => {
      const scores = Array(5).fill(null).map((_, i) => ({
        agentId: `agent_${i}`,
        totalTrust: i * 1.5,
        transactionCount: i * 2,
        lastUpdated: Date.now(),
        chainLength: i * 2
      }));

      scores.forEach(s => vi.mocked(kv.get).mockResolvedValueOnce(s));

      const result = await getTrustLeaderboard(
        scores.map(s => s.agentId),
        3
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('getTrustRelationship', () => {
    it('should calculate trust between two agents', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Good work',
          timestamp: Date.now() - 2000,
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'sig1'
        },
        {
          txId: 'tx:2',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.3,
          reason: 'Helpful',
          timestamp: Date.now() - 1000,
          prevHash: '0abc123',
          hash: '0def456',
          nonce: 38,
          signature: 'sig2'
        },
        {
          txId: 'tx:3',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_3',
          trustDelta: 0.2,
          reason: 'Other',
          timestamp: Date.now(),
          prevHash: '0def456',
          hash: '0ghi789',
          nonce: 35,
          signature: 'sig3'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await getTrustRelationship('agent_1', 'agent_2');

      expect(result.totalTrust).toBe(0.8);
      expect(result.transactionCount).toBe(2);
      expect(result.lastTransaction?.txId).toBe('tx:1');
    });

    it('should handle bidirectional trust', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Good',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'sig1'
        },
        {
          txId: 'tx:2',
          agentId: 'agent_1',
          fromAgent: 'agent_2',
          toAgent: 'agent_1',
          trustDelta: 0.3,
          reason: 'Also good',
          timestamp: Date.now(),
          prevHash: '0abc123',
          hash: '0def456',
          nonce: 38,
          signature: 'sig2'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await getTrustRelationship('agent_1', 'agent_2');

      expect(result.totalTrust).toBe(0.2); // 0.5 - 0.3
      expect(result.transactionCount).toBe(2);
    });

    it('should return zero for no relationship', async () => {
      vi.mocked(kv.lrange).mockResolvedValue([]);

      const result = await getTrustRelationship('agent_1', 'agent_2');

      expect(result.totalTrust).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.lastTransaction).toBeUndefined();
    });
  });

  describe('detectTampering', () => {
    it('should detect no tampering in valid chain', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Test',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await detectTampering('agent_1');

      expect(result.tampered).toBe(false);
      expect(result.details).toHaveLength(0);
    });

    it('should detect tampering', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Test',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: 'invalid', // Invalid proof of work
          nonce: 42,
          signature: 'sig1'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await detectTampering('agent_1');

      expect(result.tampered).toBe(true);
      expect(result.details.length).toBeGreaterThan(0);
    });
  });

  describe('exportChain', () => {
    it('should export complete chain with integrity check', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Test',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: '0abc123',
          nonce: 42,
          signature: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await exportChain('agent_1');

      expect(result.agentId).toBe('agent_1');
      expect(result.chainLength).toBe(1);
      expect(result.transactions).toHaveLength(1);
      expect(result.integrity.valid).toBe(true);
      expect(result.exportedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should include integrity errors in export', async () => {
      const transactions: TrustTransaction[] = [
        {
          txId: 'tx:1',
          agentId: 'agent_1',
          fromAgent: 'agent_1',
          toAgent: 'agent_2',
          trustDelta: 0.5,
          reason: 'Test',
          timestamp: Date.now(),
          prevHash: '0'.repeat(64),
          hash: 'invalid',
          nonce: 42,
          signature: 'sig1'
        }
      ];

      vi.mocked(kv.lrange).mockResolvedValue(transactions);

      const result = await exportChain('agent_1');

      expect(result.integrity.valid).toBe(false);
      expect(result.integrity.errors.length).toBeGreaterThan(0);
    });
  });
});

// Made with Moe Abdelaziz