import { kv } from '../index';

export interface AgentStake {
  agentId: string;
  stakedAmount: number;
  stakerAddress: string;
  unlocksAt: number;
}

export class AgentStakingManager {
  static async stake(agentId: string, stakerAddress: string, amount: number, lockDurationMs: number = 0): Promise<AgentStake> {
    const unlocksAt = Date.now() + lockDurationMs;
    const stakeObj: AgentStake = { agentId, stakedAmount: amount, stakerAddress, unlocksAt };
    await kv.lpush(`aix:economics:stake:${agentId}`, stakeObj);
    await kv.incrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
    return stakeObj;
  }

  static async unstake(agentId: string, stakerAddress: string, amount: number): Promise<boolean> {
    const currentStake = await this.getTotalStake(agentId);
    if (currentStake < amount) return false;

    // In a real system, we'd find the specific stakes for the stakerAddress and handle unlocksAt.
    // For this basic mechanism, we just decrement the total stake.
    await kv.decrby(`aix:economics:total_stake:${agentId}`, Math.floor(amount));
    return true;
  }

  static async getTotalStake(agentId: string): Promise<number> {
    const val = await kv.get(`aix:economics:total_stake:${agentId}`);
    return typeof val === 'number' ? val : (val ? parseInt(val as string, 10) : 0);
  }
}
