/**
 * 🌌 AIX Core - The Sovereign Entrance
 * Made with Moe Abdelaziz
 */

export * from './domain';
export * from './rate-limit';
export * from './harness.config';
export * from './gateway';
export * from './agent-runtime';
export * from './identity';
export * from './treasury';
export * from './security/index';
export * from './security/dna';
export * from './compression/manifest-integration';
export * from './AgentSelfReview';

export type { AgentTask, AgentResult } from './agent-runtime';
export type { ToolRegistry } from './llm/index';

import { SovereignGateway } from './gateway';
let gatewayInstance: SovereignGateway | null = null;

export function getGateway(config?: { githubToken?: string }): SovereignGateway {
  if (!gatewayInstance) {
    gatewayInstance = new SovereignGateway(config);
  }
  return gatewayInstance;
}

// Re-export storage for convenience
export * from './memory/storage';
export * from './workers/mission_validator';
export * from './voice/voice_service';
