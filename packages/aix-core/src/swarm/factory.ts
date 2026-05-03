import { AgentFactory } from "./patterns";
import { AIXManifest } from "@aix-types";

export type AgentType = 'trader' | 'guardian' | 'ghost' | 'scout';

/**
 * Factory for creating specific sovereign agent configurations.
 * @example
 * const config = new SovereignAgentFactory().create('trader', manifest);
 */
export class SovereignAgentFactory extends AgentFactory<any> {
  create(type: AgentType, config: AIXManifest) {
    switch (type) {
      case 'trader':
        return { ...config, role: 'Economic Arbitrageur' };
      case 'guardian':
        return { ...config, role: 'Security Sentinel' };
      case 'ghost':
        return { ...config, role: 'Stealth Operator' };
      case 'scout':
        return { ...config, role: 'Discovery Probe' };
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
