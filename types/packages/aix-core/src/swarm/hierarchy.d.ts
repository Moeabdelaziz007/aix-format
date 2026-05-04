import { IHierarchy, AgentSkill } from "../patterns";
import { GatewayProcess } from "../gateway";
/**
 * Skill: Atomic unit of logic inside an agent.
 */
export declare class TradingSkill extends AgentSkill {
    name: string;
    run(params: any): Promise<{
        yield: number;
    }>;
}
/**
 * Base Agent: The core doll.
 */
export declare class BaseAgent implements IHierarchy {
    id: string;
    children: AgentSkill[];
    constructor(id: string);
    addChild(skill: AgentSkill): void;
    pulse(process: GatewayProcess): Promise<any[]>;
}
/**
 * Agent Cluster: Manages groups of agents.
 */
export declare class AgentCluster implements IHierarchy {
    clusterId: string;
    children: BaseAgent[];
    constructor(clusterId: string);
    addChild(agent: BaseAgent): void;
    broadcast(message: any): Promise<any[][]>;
}
/**
 * Orchestrator: The outer layer managing clusters.
 */
export declare class GlobalOrchestrator {
    private clusters;
    addCluster(cluster: AgentCluster): void;
    monitorAll(): Promise<void>;
}
