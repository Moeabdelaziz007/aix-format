/**
 * aix-core public surface — 33 smart exports
 *
 * Primary API (start here):
 *   import aix from 'aix-core';
 *   import { aix, ParallelSim, GatewayManager } from 'aix-core';
 */

// ─── PRIMARY: The one function you need ──────────────────────────────────
export { aix, aix as default }          from './aix';
export type { AixOptions, AixResult, AixSwarmOptions, SwarmPattern } from './aix';

// ─── SIMULATION: Parallel execution engine ────────────────────────────
export { ParallelSim }                  from './parallel-sim';
export type { SimAgent, SimOptions, SimResult, AgentOutcome } from './parallel-sim';

// ─── CONTROL PLANE: Gateway process lifecycle ───────────────────────
export { GatewayManager }               from './gateway';
export type { GatewayProcess, GatewayTask, GatewayResult, GatewayStatus } from './gateway';

// ─── EXECUTION ENGINE: ReAct loop ─────────────────────────────────
export { AgentRuntimeEngine }           from './agent-runtime';
export type { RuntimeResult }           from './agent-runtime';

// ─── LLM PROVIDERS: OpenAI / Anthropic / Ollama / Mock ────────────────
export { createDefaultRouter, MockProvider, LLMRouter } from './llm-provider';
export type { LLMProvider, CompletionOptions, CompletionResponse } from './llm-provider';

// ─── SWARM: Multi-agent coordination (lower-level) ──────────────────
export { SwarmRouter }                  from './SwarmRouter';

// ─── PHILOSOPHICAL ENGINES ──────────────────────────────────────
export { CuriosityEngine }              from './curiosity-engine';
export { ExpectationEngine }            from './expectation-engine';
export { FailureLearning }              from './failure-learning';

// ─── ROUTING: Constrained model selection ──────────────────────────
export { ConstrainedRouter }            from './constrained-router';
export type { Task, TaskConstraints }   from './constrained-router';

// ─── SAFETY: Lineage + Trust ─────────────────────────────────────
export { LineageRegistry }              from './lineage-registry';
export { TrustChain }                   from './trust-chain';

// ─── STORAGE: Redis adapter + key registry ────────────────────────
export { kv }                           from './storage/adapter';
export { KEYS, TTL }                    from './storage/keys';

// ─── BUS: Event system ────────────────────────────────────────
export { emit, subscribe, BUS_RINGS }  from './bus';

// ─── MODELS: Performance database ───────────────────────────────
export { ModelDatabase }               from './model-database';

// ─── PETS: Mood-driven routing ──────────────────────────────────
export { getPetState, getDynamicConstraints } from './pets';
