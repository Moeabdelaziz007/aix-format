import { kv } from '../index';

export interface AgentStake {
  agentId: string;
  stakedAmount: number;
  stakerAddress: string;
  unlocksAt: number;
}

/**
 * Manages the staking and unstaking flows for agents.
 * @example
 * await AgentStakingManager.stake("agent-1", "0x...", 1000);
 */
export class AgentStakingManager {
  /**
   * Stakes tokens on an agent.
   * @param {string} agentId - The agent identifier.
   * @param {string} stakerAddress - The wallet address of the staker.
   * @param {number} amount - The amount to stake.
   * @param {number} [lockDurationMs=0] - Duration to lock the stake.
   * @returns {Promise<AgentStake>} The staking record.
   * @example
   * const stake = await AgentStakingManager.stake("agent-1", "0x...", 1000);
   */
  static async stake(agentId: string, stakerAddress: string, amount: number, lockDurationMs: number = 0): Promise<AgentStake> {
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
   * const success = await AgentStakingManager.unstake("agent-1", "0x...", 500);
   */
  static async unstake(agentId: string, stakerAddress: string, amount: number): Promise<boolean> {
    const currentStake = await this.getTotalStake(agentId);
    if (currentStake < amount) return false;

    // In a real system, we'd find the specific stakes for the stakerAddress and handle unlocksAt.
    // For this basic mechanism, we just decrement the total stake.
    await kv.decrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
    return true;
  }

  /**
   * Retrieves the total staked amount for an agent.
   * @param {string} agentId - The agent identifier.
   * @returns {Promise<number>} The total stake.
   * @example
   * const total = await AgentStakingManager.getTotalStake("agent-1");
   */
  static async getTotalStake(agentId: string): Promise<number> {
    const val = await kv.get(`aix:economics:total_stake:${agentId}`);
    return typeof val === 'number' ? val : (val ? parseInt(val as string, 10) : 0);
  }
}
