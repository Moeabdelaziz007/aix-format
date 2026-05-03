import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
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

export async function stakeAgent(agentId: string, stakerAddress: string, amount: number, lockDurationMs: number = 0): Promise<AgentStake> {
  const unlocksAt = Date.now() + lockDurationMs;
  const stakeObj: AgentStake = { agentId, stakedAmount: amount, stakerAddress, unlocksAt };
  await kv.lpush(`aix:economics:stake:${agentId}`, stakeObj);
  await kv.incrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
  return stakeObj;
}

export async function unstakeAgent(agentId: string, stakerAddress: string, amount: number): Promise<boolean> {
  const currentStake = await getTotalAgentStake(agentId);
  if (currentStake < amount) return false;

  // In a real system, we'd find the specific stakes for the stakerAddress and handle unlocksAt.
  // For this basic mechanism, we just decrement the total stake.
  await kv.decrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
  return true;
}

export async function getTotalAgentStake(agentId: string): Promise<number> {
  const val = await kv.get(`aix:economics:total_stake:${agentId}`);
  return typeof val === 'number' ? val : (val ? parseInt(val as string, 10) : 0);
}
