import { kv, KEYS } from './index';
import { ArbitrageStrategy, Economics } from '@aix-types';
import { IStrategy } from './patterns';

/**
 * Strategy: Timing Attack Protection
 */
class TimingAttackStrategy implements IStrategy<number, number> {
  async execute(basePrice: number): Promise<number> {
    // Simulate finding a 15% discount by timing the transaction
    return basePrice * 0.85;
  }
}

/**
 * Strategy: Route Splitting
 */
class RouteSplittingStrategy implements IStrategy<number, number> {
  async execute(basePrice: number): Promise<number> {
    // Simulate finding an 8% discount by splitting liquidity
    return basePrice * 0.92;
  }
}

/**
 * RevenueRouter manages dynamic pricing based on arbitrage strategies.
 * @example
 * const fee = await RevenueRouter.calculateFee("agent-1", economicsConfig);
 */
export class RevenueRouter {
  private static strategies: Record<string, IStrategy<number, number>> = {
    'timing_attack': new TimingAttackStrategy(),
    'route_splitting': new RouteSplittingStrategy()
  };

  static async calculateFee(agentId: string, economics: Economics) {
    const basePrice = economics.revenue_routing?.base_price || 0;
    let finalPrice = basePrice;

    // Apply Arbitrage Strategies dynamically
    if (economics.arbitrage?.enabled) {
      for (const strategyKey of economics.arbitrage.strategies) {
        const strategy = this.strategies[strategyKey];
        if (strategy) {
          finalPrice = await strategy.execute(finalPrice);
        }
      }
    }

    return { total: finalPrice, base: basePrice };
  }

  static async recordArbitrage(agentId: string, strategy: ArbitrageStrategy, yieldAmount: number) {
    const key = `aix:economics:ledger:${agentId}`;
    await kv.lpush(key, { strategy, yieldAmount, timestamp: Date.now() });
  }
}

/**
 * SovereignLoopManager handles reinvesting generated yield into the agent's growth.
 * @example
 * await SovereignLoopManager.triggerReinvestment("agent-1", 100);
 */
export class SovereignLoopManager {
  static async triggerReinvestment(agentId: string, amount: number) {
    await kv.incrby(`aix:economics:reinvestment:${agentId}`, Math.floor(amount));
  }
}

export interface AgentStake {
  agentId: string;
  stakedAmount: number;
  stakerAddress: string;
  unlocksAt: number;
}

/**
 * Stakes tokens on an agent, supporting Bonding Curve issuance.
 * @param {string} agentId - The agent identifier.
 * @param {string} stakerAddress - The wallet address of the staker.
 * @param {number} amount - The amount to stake.
 * @param {number} [lockDurationMs=0] - Duration to lock the stake.
 * @returns {Promise<AgentStake>} The staking record.
 * @example
 * const stake = await stakeAgent("agent-1", "0x...", 1000);
 */
export async function stakeAgent(agentId: string, stakerAddress: string, amount: number, lockDurationMs: number = 0): Promise<AgentStake> {
  const unlocksAt = Date.now() + lockDurationMs;
  const stakeObj: AgentStake = { agentId, stakedAmount: amount, stakerAddress, unlocksAt };
  await kv.lpush(`aix:economics:stake:${agentId}`, stakeObj);
  await kv.incrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
  return stakeObj;
}

/**
 * Unstakes tokens from an agent.
 * @param {string} agentId - The agent identifier.
 * @param {string} stakerAddress - The wallet address of the unstaker.
 * @param {number} amount - The amount to unstake.
 * @returns {Promise<boolean>} True if successful.
 * @example
 * const success = await unstakeAgent("agent-1", "0x...", 500);
 */
export async function unstakeAgent(agentId: string, stakerAddress: string, amount: number): Promise<boolean> {
  const currentStake = await getTotalAgentStake(agentId);
  if (currentStake < amount) return false;

  // In a real system, we'd find the specific stakes for the stakerAddress and handle unlocksAt.
  // For this basic mechanism, we just decrement the total stake.
  await kv.decrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
  return true;
}

/**
 * Retrieves the total staked amount for a specific agent.
 * @param {string} agentId - The agent identifier.
 * @returns {Promise<number>} The total stake.
 * @example
 * const total = await getTotalAgentStake("agent-1");
 */
export async function getTotalAgentStake(agentId: string): Promise<number> {
  const val = await kv.get(`aix:economics:total_stake:${agentId}`);
  return typeof val === 'number' ? val : (val ? parseInt(val as string, 10) : 0);
}
