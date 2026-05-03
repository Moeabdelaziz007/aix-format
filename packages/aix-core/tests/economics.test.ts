/**
 * AIX Economics - Comprehensive Test Suite
 * Tests for revenue routing, staking, and arbitrage strategies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RevenueRouter,
  SovereignLoopManager,
  stakeAgent,
  unstakeAgent,
  getTotalAgentStake,
  AgentStake
} from '../src/economics';
import { kv } from '../src/storage/adapter';

// Mock Redis
vi.mock('../src/storage/adapter', () => ({
  kv: {
    lpush: vi.fn(),
    incrby: vi.fn(),
    decrby: vi.fn(),
    get: vi.fn()
  }
}));

describe('RevenueRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateFee', () => {
    it('should return base price when arbitrage disabled', async () => {
      const economics = {
        revenue_routing: { base_price: 100 },
        arbitrage: { enabled: false, strategies: [] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.base).toBe(100);
      expect(result.total).toBe(100);
    });

    it('should apply timing attack strategy', async () => {
      const economics = {
        revenue_routing: { base_price: 100 },
        arbitrage: { enabled: true, strategies: ['timing_attack'] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.base).toBe(100);
      expect(result.total).toBe(85); // 15% discount
    });

    it('should apply route splitting strategy', async () => {
      const economics = {
        revenue_routing: { base_price: 100 },
        arbitrage: { enabled: true, strategies: ['route_splitting'] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.base).toBe(100);
      expect(result.total).toBe(92); // 8% discount
    });

    it('should apply multiple strategies sequentially', async () => {
      const economics = {
        revenue_routing: { base_price: 100 },
        arbitrage: { 
          enabled: true, 
          strategies: ['timing_attack', 'route_splitting'] 
        }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.base).toBe(100);
      // 100 * 0.85 (timing) * 0.92 (splitting) = 78.2
      expect(result.total).toBeCloseTo(78.2, 1);
    });

    it('should handle missing revenue_routing', async () => {
      const economics = {
        arbitrage: { enabled: false, strategies: [] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.base).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should ignore unknown strategies', async () => {
      const economics = {
        revenue_routing: { base_price: 100 },
        arbitrage: { 
          enabled: true, 
          strategies: ['unknown_strategy'] 
        }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.total).toBe(100); // No change
    });

    it('should handle zero base price', async () => {
      const economics = {
        revenue_routing: { base_price: 0 },
        arbitrage: { enabled: true, strategies: ['timing_attack'] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.total).toBe(0);
    });

    it('should handle negative base price', async () => {
      const economics = {
        revenue_routing: { base_price: -100 },
        arbitrage: { enabled: true, strategies: ['timing_attack'] }
      };

      const result = await RevenueRouter.calculateFee('agent_1', economics);
      
      expect(result.total).toBe(-85);
    });
  });

  describe('recordArbitrage', () => {
    it('should record arbitrage in Redis', async () => {
      await RevenueRouter.recordArbitrage('agent_1', 'timing_attack', 15);

      expect(kv.lpush).toHaveBeenCalledWith(
        'aix:economics:ledger:agent_1',
        expect.objectContaining({
          strategy: 'timing_attack',
          yieldAmount: 15,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should record multiple arbitrages', async () => {
      await RevenueRouter.recordArbitrage('agent_1', 'timing_attack', 15);
      await RevenueRouter.recordArbitrage('agent_1', 'route_splitting', 8);

      expect(kv.lpush).toHaveBeenCalledTimes(2);
    });

    it('should handle zero yield', async () => {
      await RevenueRouter.recordArbitrage('agent_1', 'timing_attack', 0);

      expect(kv.lpush).toHaveBeenCalledWith(
        'aix:economics:ledger:agent_1',
        expect.objectContaining({ yieldAmount: 0 })
      );
    });
  });
});

describe('SovereignLoopManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerReinvestment', () => {
    it('should increment reinvestment counter', async () => {
      await SovereignLoopManager.triggerReinvestment('agent_1', 100);

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:reinvestment:agent_1',
        100
      );
    });

    it('should floor decimal amounts', async () => {
      await SovereignLoopManager.triggerReinvestment('agent_1', 99.7);

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:reinvestment:agent_1',
        99
      );
    });

    it('should handle zero amount', async () => {
      await SovereignLoopManager.triggerReinvestment('agent_1', 0);

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:reinvestment:agent_1',
        0
      );
    });

    it('should handle negative amount', async () => {
      await SovereignLoopManager.triggerReinvestment('agent_1', -50);

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:reinvestment:agent_1',
        -50
      );
    });

    it('should handle multiple agents', async () => {
      await SovereignLoopManager.triggerReinvestment('agent_1', 100);
      await SovereignLoopManager.triggerReinvestment('agent_2', 200);

      expect(kv.incrby).toHaveBeenCalledTimes(2);
      expect(kv.incrby).toHaveBeenCalledWith('aix:economics:reinvestment:agent_1', 100);
      expect(kv.incrby).toHaveBeenCalledWith('aix:economics:reinvestment:agent_2', 200);
    });
  });
});

describe('Staking Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stakeAgent', () => {
    it('should create stake with lock duration', async () => {
      const result = await stakeAgent('agent_1', 'staker_addr', 1000, 86400000);

      expect(result).toMatchObject({
        agentId: 'agent_1',
        stakedAmount: 1000,
        stakerAddress: 'staker_addr',
        unlocksAt: expect.any(Number)
      });

      expect(kv.lpush).toHaveBeenCalledWith(
        'aix:economics:stake:agent_1',
        expect.objectContaining({
          agentId: 'agent_1',
          stakedAmount: 1000
        })
      );

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        1000
      );
    });

    it('should create stake without lock duration', async () => {
      const now = Date.now();
      const result = await stakeAgent('agent_1', 'staker_addr', 500);

      expect(result.unlocksAt).toBeGreaterThanOrEqual(now);
      expect(result.unlocksAt).toBeLessThanOrEqual(now + 100);
    });

    it('should handle zero amount', async () => {
      const result = await stakeAgent('agent_1', 'staker_addr', 0);

      expect(result.stakedAmount).toBe(0);
      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        0
      );
    });

    it('should floor decimal amounts', async () => {
      await stakeAgent('agent_1', 'staker_addr', 999.9);

      expect(kv.incrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        999
      );
    });

    it('should handle multiple stakes for same agent', async () => {
      await stakeAgent('agent_1', 'staker_1', 100);
      await stakeAgent('agent_1', 'staker_2', 200);

      expect(kv.lpush).toHaveBeenCalledTimes(2);
      expect(kv.incrby).toHaveBeenCalledTimes(2);
    });

    it('should return correct unlock time', async () => {
      const lockDuration = 3600000; // 1 hour
      const before = Date.now();
      const result = await stakeAgent('agent_1', 'staker_addr', 100, lockDuration);
      const after = Date.now();

      expect(result.unlocksAt).toBeGreaterThanOrEqual(before + lockDuration);
      expect(result.unlocksAt).toBeLessThanOrEqual(after + lockDuration + 100);
    });
  });

  describe('unstakeAgent', () => {
    it('should unstake when sufficient stake exists', async () => {
      vi.mocked(kv.get).mockResolvedValue(1000);

      const result = await unstakeAgent('agent_1', 'staker_addr', 500);

      expect(result).toBe(true);
      expect(kv.decrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        500
      );
    });

    it('should fail when insufficient stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(100);

      const result = await unstakeAgent('agent_1', 'staker_addr', 500);

      expect(result).toBe(false);
      expect(kv.decrby).not.toHaveBeenCalled();
    });

    it('should handle zero current stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(0);

      const result = await unstakeAgent('agent_1', 'staker_addr', 100);

      expect(result).toBe(false);
    });

    it('should handle null current stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await unstakeAgent('agent_1', 'staker_addr', 100);

      expect(result).toBe(false);
    });

    it('should unstake exact amount', async () => {
      vi.mocked(kv.get).mockResolvedValue(1000);

      const result = await unstakeAgent('agent_1', 'staker_addr', 1000);

      expect(result).toBe(true);
      expect(kv.decrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        1000
      );
    });

    it('should floor decimal amounts', async () => {
      vi.mocked(kv.get).mockResolvedValue(1000);

      await unstakeAgent('agent_1', 'staker_addr', 500.9);

      expect(kv.decrby).toHaveBeenCalledWith(
        'aix:economics:total_stake:agent_1',
        500
      );
    });
  });

  describe('getTotalAgentStake', () => {
    it('should return numeric stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(1500);

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(1500);
    });

    it('should parse string stake', async () => {
      vi.mocked(kv.get).mockResolvedValue('2500');

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(2500);
    });

    it('should return 0 for null stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(0);
    });

    it('should return 0 for undefined stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(undefined);

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(0);
    });

    it('should handle zero stake', async () => {
      vi.mocked(kv.get).mockResolvedValue(0);

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(0);
    });

    it('should handle string zero', async () => {
      vi.mocked(kv.get).mockResolvedValue('0');

      const result = await getTotalAgentStake('agent_1');

      expect(result).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete stake/unstake cycle', async () => {
      // Stake
      await stakeAgent('agent_1', 'staker_1', 1000);
      vi.mocked(kv.get).mockResolvedValue(1000);

      // Check total
      let total = await getTotalAgentStake('agent_1');
      expect(total).toBe(1000);

      // Unstake partial
      vi.mocked(kv.get).mockResolvedValue(1000);
      const unstakeResult = await unstakeAgent('agent_1', 'staker_1', 400);
      expect(unstakeResult).toBe(true);

      // Check remaining
      vi.mocked(kv.get).mockResolvedValue(600);
      total = await getTotalAgentStake('agent_1');
      expect(total).toBe(600);
    });

    it('should handle multiple stakers', async () => {
      await stakeAgent('agent_1', 'staker_1', 500);
      await stakeAgent('agent_1', 'staker_2', 300);
      await stakeAgent('agent_1', 'staker_3', 200);

      vi.mocked(kv.get).mockResolvedValue(1000);
      const total = await getTotalAgentStake('agent_1');
      expect(total).toBe(1000);
    });
  });
});

// Made with Moe Abdelaziz
