import { ArbitrageStrategy, Economics } from '@aix-types';
export declare class RevenueRouter {
    private static strategies;
    static calculateFee(agentId: string, economics: Economics): Promise<{
        total: number;
        base: number;
    }>;
    static recordArbitrage(agentId: string, strategy: ArbitrageStrategy, yieldAmount: number): Promise<void>;
}
export declare class SovereignLoopManager {
    static triggerReinvestment(agentId: string, amount: number): Promise<void>;
}
export interface AgentStake {
    agentId: string;
    stakedAmount: number;
    stakerAddress: string;
    unlocksAt: number;
}
export declare function stakeAgent(agentId: string, stakerAddress: string, amount: number, lockDurationMs?: number): Promise<AgentStake>;
export declare function unstakeAgent(agentId: string, stakerAddress: string, amount: number): Promise<boolean>;
export declare function getTotalAgentStake(agentId: string): Promise<number>;
