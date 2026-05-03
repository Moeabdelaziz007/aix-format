export * from './storage/adapter';
import { kv } from './storage/adapter';

import { NS, TTL, KEYS } from './storage/keys';
export { NS, TTL, KEYS };
export * from './registry';
export * from './learning';
export * from './gateway';
export * from './security';
export * from './memory-readable';
export * from './dead-hand';
export * from './channels';
export * from './pets';
export * from './pulse';
export * from './economics';
export * from './economics/BondingCurve';
export * from './patterns';
export * from './swarm/handlers';
export * from './swarm/orchestrator';
export * from './swarm/commands';
export * from './swarm/factory';
export * from './swarm/blocks';
export * from './swarm/hierarchy';
export * from './voice/ManifestBuilder';

// Philosophical Engines (v1.4.0)
export * from './curiosity-engine';
export * from './expectation-engine';
export * from './failure-learning';

// Decentralization Engines (v1.5.0)
export * from './resonance-engine';
export * from './p2p-router';
export * from './trust-chain';

// Agent Runtime (v1.5.0)
export * from './agent-runtime';

export default kv;


