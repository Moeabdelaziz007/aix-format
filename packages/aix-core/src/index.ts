/**
 * 🌌 AIX Core - The Sovereign Entrance
 * Made with Moe Abdelaziz
 */

export * from './memory/storage.js';
export * from './health.js';
export * from './brain.js';
export * from './curiosity.js';
export * from './rate-limit.js';
export * from './harness.config.js';
export * from './economics.js';
export * from './treasury.js';
export * from './registry.js';
export * from './identity.js';
export * from './gateway.js';
export * from './agent-runtime.js';
export * from './llm/index.js';
export * from './security/index.js';
export * from './wikibrain/SemanticIndex.js';
export * from './infra.js';
export * from './mcp-gate.js';
export * from './swarm.js';
export * from './scanner.js';
export * from './validation.js';
export * from './domain.js';
export { getRustBridge } from '@aix/rust-core/src/bridge.js';

import { SovereignGateway } from './gateway.js';
let gatewayInstance: SovereignGateway | null = null;

export function getGateway(config?: any): SovereignGateway {
  if (!gatewayInstance) {
    gatewayInstance = new SovereignGateway(config);
  }
  return gatewayInstance;
}
