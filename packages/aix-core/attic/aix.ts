/**
 * aix() — The Single Public API
 *
 * Every system we built (Phases 1–4) is accessible through this one function.
 *
 * Usage:
 *
 *   import { aix } from 'aix-core';
 *
 *   // Single agent
 *   const result = await aix('agent-1', 'Summarize this report');
 *
 *   // Parallel swarm
 *   const swarm = await aix.swarm([
 *     { agentId: 'r1', task: 'Research topic A' },
 *     { agentId: 'r2', task: 'Research topic B' },
 *   ], { pattern: 'consensus' });
 *
 *   // Dry-run simulation (no LLM cost)
 *   const sim = await aix.sim([
 *     { agentId: 'a1', task: 'Analyze X' },
 *     { agentId: 'a2', task: 'Analyze X' },
 *   ]);
 *
 *   // SSE / WebSocket streaming
 *   for await (const event of aix.stream('agent-1', 'Build a plan')) {
 *     res.write(`data: ${JSON.stringify(event)}\n\n`);
 *   }
 */

import { GatewayManager, GatewayTask, GatewayResult } from './gateway';
import { ParallelSim, SimAgent, SimOptions, SimResult } from './parallel-sim';
import { createDefaultRouter, LLMRouter } from './llm-provider';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AixOptions {
  model?:    string;          // force a specific model
  tools?:    Record<string, (input: any) => Promise<string>>;
  maxSteps?: number;
  timeout?:  number;
  dryRun?:   boolean;        // skip LLM, return mock
  llm?:      LLMRouter;      // inject custom router
}

export interface AixResult {
  output:    string;
  success:   boolean;
  steps:     number;
  cost:      number;
  modelUsed: string;
  happiness: number;
  duration:  number;
  processId: string;
}

export type SwarmPattern = 'race' | 'consensus' | 'pipeline' | 'scatter-gather';

export interface AixSwarmOptions extends SimOptions {
  pattern?: SwarmPattern;
  aggregator?: SimAgent;     // required for scatter-gather
}

// ─── Core Function ────────────────────────────────────────────────────────

/**
 * Run a single agent task.
 * Auto-detects OPENAI_API_KEY / ANTHROPIC_API_KEY / OLLAMA_BASE_URL.
 */
async function aix(
  agentId: string,
  task:    string,
  options: AixOptions = {}
): Promise<AixResult> {
  const start  = Date.now();
  const router = options.llm ?? createDefaultRouter();

  const gatewayTask: GatewayTask = {
    taskId:      `aix-${agentId}-${Date.now()}`,
    description: task,
    tools:       options.tools ?? {},
    maxSteps:    options.maxSteps,
    timeout:     options.timeout,
  };

  const res: GatewayResult = await GatewayManager.runTask(
    agentId,
    agentId,
    gatewayTask,
    router
  );

  return {
    output:    res.runtime.output ?? '',
    success:   res.runtime.success,
    steps:     res.runtime.steps,
    cost:      res.cost,
    modelUsed: res.modelId,
    happiness: res.happiness ?? 0,
    duration:  Date.now() - start,
    processId: res.processId,
  };
}

// ─── Swarm Methods (attached as properties) ────────────────────────────────

/**
 * aix.swarm() — parallel multi-agent execution
 *
 * @example
 *   const result = await aix.swarm([
 *     { agentId: 'a1', task: 'Research X' },
 *     { agentId: 'a2', task: 'Research Y' },
 *   ], { pattern: 'consensus' });
 */
aix.swarm = async function(
  agents:  SimAgent[],
  options: AixSwarmOptions = {}
): Promise<SimResult> {
  const sim = new ParallelSim(options);
  const pattern = options.pattern ?? 'race';

  if (pattern === 'pipeline')      return sim.pipeline(agents);
  if (pattern === 'consensus')     return sim.consensus(agents);
  if (pattern === 'scatter-gather') {
    if (!options.aggregator) throw new Error('scatter-gather requires options.aggregator');
    return sim.scatterGather(agents, options.aggregator);
  }
  return sim.race(agents); // default
};

/**
 * aix.sim() — dry-run parallel simulation, zero LLM cost
 *
 * Use before production to test topology, concurrency, routing.
 *
 * @example
 *   const sim = await aix.sim([{ agentId: 'a1', task: 'Test task' }]);
 *   console.log(sim.results.map(r => r.duration)); // latency profile
 */
aix.sim = async function(
  agents:  SimAgent[],
  options: Omit<AixSwarmOptions, 'dryRun'> = {}
): Promise<SimResult> {
  return aix.swarm(agents, { ...options, dryRun: true });
};

/**
 * aix.stream() — AsyncGenerator for SSE/WebSocket endpoints
 *
 * @example
 *   // Next.js route handler:
 *   export async function GET(req: Request) {
 *     const stream = new ReadableStream({
 *       async start(controller) {
 *         for await (const event of aix.stream('agent-1', req.task)) {
 *           controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
 *         }
 *         controller.close();
 *       }
 *     });
 *     return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
 *   }
 */
aix.stream = async function*(
  agentId: string,
  task:    string,
  options: AixOptions = {}
): AsyncGenerator<any> {
  const router = options.llm ?? createDefaultRouter();
  const gatewayTask: GatewayTask = {
    taskId:      `aix-stream-${agentId}-${Date.now()}`,
    description: task,
    tools:       options.tools ?? {},
    maxSteps:    options.maxSteps,
    timeout:     options.timeout,
  };
  yield* GatewayManager.streamTask(agentId, agentId, gatewayTask, router);
};

/**
 * aix.benchmark() — compare N agent configs on same task
 *
 * @example
 *   const bench = await aix.benchmark('Summarize in 3 bullets', [
 *     { agentId: 'gpt4o',   name: 'GPT-4o' },
 *     { agentId: 'sonnet',  name: 'Claude Sonnet' },
 *     { agentId: 'llama',   name: 'Llama 3.2 local' },
 *   ]);
 *   console.table(bench.table);
 */
aix.benchmark = async function(
  task:    string,
  configs: Omit<SimAgent, 'task'>[],
  options: SimOptions = {}
): Promise<ReturnType<ParallelSim['benchmark']>> {
  const sim = new ParallelSim(options);
  return sim.benchmark(task, configs);
};

export { aix };
export default aix;
