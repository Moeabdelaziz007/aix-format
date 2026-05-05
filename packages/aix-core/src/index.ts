/**
 * 🌌 AIX Core - The Sovereign Entrance
 * Made with Moe Abdelaziz
 */

export * from './domain.js';
export type { AgentTask, AgentResult } from './agent-runtime.js';
export type { ToolRegistry } from './llm/index.js';

import { SovereignGateway } from './gateway.js';
let gatewayInstance: SovereignGateway | null = null;

export function getGateway(config?: { githubToken?: string }): SovereignGateway {
  if (!gatewayInstance) {
    gatewayInstance = new SovereignGateway(config);
  }
  return gatewayInstance;
}
