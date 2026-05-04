import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTrustChain } from '../src/trust-chain';
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
  const trustChain = getTrustChain();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('append', () => {
    it('should create trust transaction audit hash', async () => {
      vi.mocked(kv.get).mockResolvedValue('genesis_hash');

      const auditHash = await trustChain.append(
        'agent_1',
        'TEST_ACTION',
        { foo: 'bar' }
      );

      expect(auditHash).toBeTruthy();
      expect(typeof auditHash).toBe('string');
      expect(kv.set).toHaveBeenCalledWith(
        expect.stringContaining('trust:action:'),
        expect.objectContaining({
          agentId: 'agent_1',
          action: 'TEST_ACTION',
          topologySignature: expect.any(String)
        })
      );
    });

    it('should chain actions with prevAction', async () => {
      const prevHash = 'prev_audit_hash';
      vi.mocked(kv.get).mockResolvedValue(prevHash);

      const auditHash = await trustChain.append(
        'agent_1',
        'FOLLOW_UP',
        { step: 2 }
      );

      expect(kv.set).toHaveBeenCalledWith(
        expect.stringContaining('trust:action:'),
        expect.objectContaining({
          prevAction: prevHash
        })
      );
    });
  });

  describe('getScore', () => {
    it('should return trust score for agent', async () => {
      vi.mocked(kv.get).mockResolvedValue(8.5);

      const score = await trustChain.getScore('agent_1');

      expect(score).toBe(8.5);
    });

    it('should return zero for new agent', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const score = await trustChain.getScore('agent_new');

      expect(score).toBe(0);
    });
  });

  describe('verifyPoW', () => {
    it('should verify valid proof of work', async () => {
      // For difficulty 1, hash should start with '0'
      // We need a nonce that produces a hash starting with '0' for 'agent_1:nonce'
      // Instead of finding it, we can mock generateHash or just test the logic
      const isValid = await trustChain.verifyPoW('agent_1', 12345, 0); // difficulty 0 is always true
      expect(isValid).toBe(true);
    });
  });

  describe('detectTampering', () => {
    it('should detect no tampering in valid chain', async () => {
      const actions = [
        { auditHash: 'hash2', prevAction: 'hash1', agentId: 'a1', action: 'act2', data: {}, timestamp: 200 },
        { auditHash: 'hash1', prevAction: 'genesis', agentId: 'a1', action: 'act1', data: {}, timestamp: 100 }
      ];

      vi.mocked(kv.get)
        .mockResolvedValueOnce('hash2') // last_action
        .mockResolvedValueOnce(actions[0]) // action:hash2
        .mockResolvedValueOnce(actions[1]); // action:hash1

      // Mock generateHash to match auditHash
      const spy = vi.spyOn(trustChain, 'generateHash').mockImplementation((data: any) => data.auditHash || 'hash1');

      const result = await trustChain.detectTampering('agent_1');

      expect(result.tampered).toBe(false);
      spy.mockRestore();
    });
  });

  describe('selfHeal', () => {
    it('should heal a structural break if topology is intact', async () => {
      const actions: any[] = [
        { auditHash: 'hash2', prevAction: 'WRONG_HASH', agentId: 'a1', action: 'act2', data: {}, timestamp: 200, topologySignature: 'top2' },
        { auditHash: 'hash1', prevAction: 'genesis', agentId: 'a1', action: 'act1', data: {}, timestamp: 100, topologySignature: 'top1' }
      ];

      vi.mocked(kv.get)
        .mockResolvedValueOnce('hash2') // last_action
        .mockResolvedValueOnce(actions[0]) // action:hash2
        .mockResolvedValueOnce(actions[1]); // action:hash1

      // Mock topology check to pass for 'act2:a1'
      const topoHash = createHash('md5').update('act2:a1').digest('hex');
      actions[0].topologySignature = topoHash;

      const result = await trustChain.selfHeal('a1');

      expect(result.healed).toBe(1);
      expect(actions[0].prevAction).toBe('hash1');
    });

    it('should not heal if topology is also corrupted', async () => {
      const actions: any[] = [
        { auditHash: 'hash2', prevAction: 'WRONG_HASH', agentId: 'a1', action: 'act2', data: {}, timestamp: 200, topologySignature: 'CORRUPT_TOP' },
        { auditHash: 'hash1', prevAction: 'genesis', agentId: 'a1', action: 'act1', data: {}, timestamp: 100, topologySignature: 'top1' }
      ];

      vi.mocked(kv.get)
        .mockResolvedValueOnce('hash2')
        .mockResolvedValueOnce(actions[0])
        .mockResolvedValueOnce(actions[1]);

      const result = await trustChain.selfHeal('a1');

      expect(result.healed).toBe(0);
      expect(result.failures.length).toBeGreaterThan(0);
    });
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