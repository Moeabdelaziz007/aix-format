import { IHierarchy, AgentSkill } from "../patterns";
import { GatewayProcess } from "@aix-types";

/**
 * Skill: Atomic unit of logic inside an agent.
 * @example
 * const res = await new TradingSkill().run({ amount: 10 });
 */
export class TradingSkill extends AgentSkill {
  name = 'arbitrage';
  async run(params: any) {
    return { yield: params.amount * 0.05 };
  }
}

/**
 * Base Agent: The core doll.
 * @example
 * const agent = new BaseAgent("id1");
 */
export class BaseAgent implements IHierarchy {
  children: AgentSkill[] = [];
  
  constructor(public id: string) {}

  addChild(skill: AgentSkill) {
    this.children.push(skill);
  }

  async pulse(process: GatewayProcess) {
    console.log(`[RussianDoll] Agent ${this.id} pulsing skills...`);
    // Runs all skills in the doll
    return Promise.all(this.children.map(s => s.run({ amount: 100 })));
  }
}

/**
 * Agent Cluster: Manages groups of agents.
 * @example
 * const cluster = new AgentCluster("c1");
 */
export class AgentCluster implements IHierarchy {
  children: BaseAgent[] = [];

  constructor(public clusterId: string) {}

  addChild(agent: BaseAgent) {
    this.children.push(agent);
  }

  async broadcast(message: any) {
    console.log(`[Cluster] ${this.clusterId} broadcasting to ${this.children.length} agents.`);
    return Promise.all(this.children.map(a => a.pulse(message)));
  }
}

/**
 * Orchestrator: The outer layer managing clusters.
 * @example
 * const orch = new GlobalOrchestrator();
 */
export class GlobalOrchestrator {
  private clusters: AgentCluster[] = [];

  addCluster(cluster: AgentCluster) {
    this.clusters.push(cluster);
  }

  async monitorAll() {
    console.log(`[Orchestrator] Monitoring ${this.clusters.length} clusters.`);
  }
}
