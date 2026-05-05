/**
 * 🌌 AIX Core - The Sovereign Entrance
 * Made with Moe Abdelaziz
 */

export * from './storage';
export * from './health';
export * from './brain';
export * from './curiosity';
export * from './rate-limit';
export * from './harness.config';
export * from './gateway';
export * from './agent-runtime';
export * from './llm-provider';
export * from './wikibrain/SemanticIndex';
export * from './infra';
export * from './mcp-gate';
export * from './swarm';

import { Gateway } from './gateway';
let gatewayInstance: Gateway | null = null;

export function getGateway(config?: any): Gateway {
  if (!gatewayInstance) {
    gatewayInstance = new Gateway(config);
  }
  return gatewayInstance;
}
