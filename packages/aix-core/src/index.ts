/**
 * 🌌 AIX Core - The Sovereign Entrance
 * Made with Moe Abdelaziz
 */

export * from './memory/storage';
export * from './health';
export * from './brain';
export * from './curiosity';
export * from './rate-limit';
export * from './harness.config';
export * from './economics';
export * from './treasury';
export * from './registry';
export * from './identity';
export * from './gateway';
export * from './agent-runtime';
export * from './llm';
export * from './security';
export * from './wikibrain/SemanticIndex';
export * from './infra';
export * from './mcp-gate';
export * from './swarm';
export * from './scanner';
export * from './validation';
export * from './domain';
export { getRustBridge } from '@aix/rust-core/src/bridge';

import { SovereignGateway } from './gateway';
let gatewayInstance: SovereignGateway | null = null;

export function getGateway(config?: any): SovereignGateway {
  if (!gatewayInstance) {
    gatewayInstance = new SovereignGateway(config);
  }
  return gatewayInstance;
}
