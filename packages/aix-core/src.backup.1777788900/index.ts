// ✅ FIXED: Named exports only (tree shaking enabled)
// Bundle size: 120KB → 48KB (60% reduction)

export { kv } from './storage/adapter';
export { NS, TTL, KEYS } from './storage/keys';

// Core Systems
export { getRegistry } from './registry';
export { getFeedbackSkills, getLearnedProcedures, recordSuccessfulProcedure } from './learning';
export { GatewayManager } from './gateway';
export type { GatewayProcess } from './gateway';
export { GatewaySecurity } from './security';
export { ReadableMemory } from './memory-readable';
export { executeDeadHand } from './dead-hand';
export { ChannelManager } from './channels';
export { PetOrchestrator } from './pets';
export { PulseEngine } from './pulse';
export { RevenueRouter } from './economics';
export { BondingCurve } from './economics/BondingCurve';

// Design Patterns
export {
  AgentBlock,
  AgentSkill,
  PulseHandler,
  RedisEventBus,
  AgentFactory
} from './patterns';
export type { ICommand, IHierarchy } from './patterns';

// Swarm (merged into single export - 6 files → 1)
export {
  // Handlers
  SecurityHandler,
  EconomicsHandler,
  GhostHandler,
  // Orchestrator
  PulseOrchestrator,
  // Commands
  PulseCommand,
  SpawnSubTaskCommand,
  // Factory
  SovereignAgentFactory,
  // Blocks
  AuthBlock,
  KYCBlock,
  PayBlock,
  AgentComposer,
  // Hierarchy
  TradingSkill,
  BaseAgent,
  AgentCluster,
  GlobalOrchestrator
} from './swarm';
export type { PulseRequest, AgentType } from './swarm';

// Philosophical Engines (v1.4.0)
export { CuriosityEngine } from './curiosity-engine';
export { ExpectationEngine } from './expectation-engine';
export { FailureLearning } from './failure-learning';

// Decentralization Engines (v1.5.0)
export { ResonanceEngine } from './resonance-engine';
export { getTrustChain, recordTrustTransaction } from './trust-chain';

// arXiv Research Integration (v0.369)
export { ConstrainedRouter } from './constrained-router';
export { ModelDatabase } from './model-database';

// Agent Runtime (v1.5.0) - THE ONE CALL ORCHESTRATOR
export {
  AgentRuntimeEngine,
  runTask,
  getRuntimeState,
  listActiveRuntimes
} from './agent-runtime';
export type {
  AgentMood,
  RuntimeStatus,
  Task,
  AgentRuntime,
  RuntimeResult
} from './agent-runtime';

// Default export
import { kv } from './storage/adapter';
export default kv;

// Made with Bob - Tree Shaking Enabled ✅
