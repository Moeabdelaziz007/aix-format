/**
 * AIX Parallel Simulation Engine
 *
 * Swarm-style parallel execution with 4 coordination patterns:
 *
 *   race()          – first agent to finish wins
 *   consensus()     – majority vote on result
 *   pipeline()      – output of A feeds input of B
 *   scatterGather() – fan-out tasks, aggregate results
 *
 * Dry-run mode: no LLM calls, returns mock scores —
 * useful for testing topology before burning tokens.
 *
 * Usage:
 *   import { ParallelSim } from 'aix-core';
 *
 *   const sim = new ParallelSim({ dryRun: true });
 *   const result = await sim.race([
 *     { agentId: 'a1', task: 'Summarize doc A' },
 *     { agentId: 'a2', task: 'Summarize doc A' },
 *   ]);
 */

import { GatewayManager, GatewayTask, GatewayResult } from './gateway';
import { LLMRouter, createDefaultRouter, MockProvider } from './llm-provider';
import { emit, BUS_RINGS } from './bus';

export interface SimAgent {
  agentId:  string;
  name?:    string;
  task:     string;
  tools?:   Record<string, (input: any) => Promise<string>>;
  metadata?: Record<string, any>;
}

export interface SimOptions {
  dryRun?:      boolean;   // no real LLM calls
  timeout?:     number;    // ms per agent (default 30s)
  concurrency?: number;    // max parallel agents (default: all)
  llmRouter?:   LLMRouter;
}

export interface SimResult {
  winner?:   AgentOutcome;
  results:   AgentOutcome[];
  duration:  number;
  pattern:   'race' | 'consensus' | 'pipeline' | 'scatter-gather';
  consensus?: string;
}

export interface AgentOutcome {
  agentId:   string;
  name:      string;
  success:   boolean;
  output?:   string;
  cost:      number;
  duration:  number;
  happiness?: number;
  error?:    string;
}

// ─── Internal Helpers ───────────────────────────────────────────────────

async function runAgent(
  agent: SimAgent,
  options: SimOptions,
  taskOverride?: string
): Promise<AgentOutcome> {
  const start = Date.now();
  const name  = agent.name ?? agent.agentId;
  const task  = taskOverride ?? agent.task;

  // Dry-run: return mock outcome without LLM
  if (options.dryRun) {
    await new Promise(r => setTimeout(r, Math.random() * 300 + 50));
    return {
      agentId:  agent.agentId,
      name,
      success:  Math.random() > 0.1,
      output:   `[DRY-RUN] ${name} completed: "${task.slice(0, 60)}..."`,
      cost:     parseFloat((Math.random() * 0.002).toFixed(5)),
      duration: Date.now() - start,
      happiness: 0.7 + Math.random() * 0.3,
    };
  }

  const router = options.llmRouter ?? createDefaultRouter();
  const gatewayTask: GatewayTask = {
    taskId:      `sim-${agent.agentId}-${Date.now()}`,
    description: task,
    tools:       agent.tools ?? {},
    timeout:     options.timeout ?? 30_000,
  };

  try {
    const res: GatewayResult = await GatewayManager.runTask(
      agent.agentId,
      name,
      gatewayTask,
      router
    );
    return {
      agentId:  agent.agentId,
      name,
      success:  res.runtime.success,
      output:   res.runtime.output,
      cost:     res.cost,
      duration: Date.now() - start,
      happiness: res.happiness,
    };
  } catch (err: any) {
    return {
      agentId:  agent.agentId,
      name,
      success:  false,
      cost:     0,
      duration: Date.now() - start,
      error:    err.message,
    };
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── ParallelSim ─────────────────────────────────────────────────────────

export class ParallelSim {
  private opts: SimOptions;

  constructor(options: SimOptions = {}) {
    this.opts = { timeout: 30_000, concurrency: 999, ...options };
  }

  /**
   * RACE: Run all agents in parallel, return first success.
   * Like Promise.race but captures all results.
   */
  async race(agents: SimAgent[]): Promise<SimResult> {
    const start = Date.now();
    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_START', pattern: 'race', count: agents.length });

    const settled = await Promise.allSettled(
      agents.map(a => runAgent(a, this.opts))
    );

    const results = settled.map(s =>
      s.status === 'fulfilled' ? s.value : { agentId: '', name: '', success: false, cost: 0, duration: 0, error: String((s as any).reason) }
    );

    const winner = results.find(r => r.success);
    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_DONE', pattern: 'race', winner: winner?.agentId });

    return { winner, results, duration: Date.now() - start, pattern: 'race' };
  }

  /**
   * CONSENSUS: Run all agents, return majority-vote answer.
   * Uses simple string similarity for voting.
   */
  async consensus(agents: SimAgent[]): Promise<SimResult> {
    const start = Date.now();
    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_START', pattern: 'consensus', count: agents.length });

    const settled = await Promise.allSettled(
      agents.map(a => runAgent(a, this.opts))
    );
    const results = settled
      .filter(s => s.status === 'fulfilled')
      .map(s => (s as PromiseFulfilledResult<AgentOutcome>).value)
      .filter(r => r.success);

    // Simple majority: find most common output prefix (first 100 chars)
    const votes: Record<string, number> = {};
    for (const r of results) {
      const key = (r.output ?? '').slice(0, 100).trim().toLowerCase();
      votes[key] = (votes[key] ?? 0) + 1;
    }
    const topKey = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const winner = results.find(r => (r.output ?? '').slice(0, 100).trim().toLowerCase() === topKey);

    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_DONE', pattern: 'consensus', winner: winner?.agentId });

    return {
      winner,
      results,
      duration:  Date.now() - start,
      pattern:   'consensus',
      consensus: winner?.output,
    };
  }

  /**
   * PIPELINE: Output of agent[0] feeds agent[1] feeds agent[2]...
   * Sequential with dependency chain.
   */
  async pipeline(agents: SimAgent[]): Promise<SimResult> {
    const start = Date.now();
    const results: AgentOutcome[] = [];
    let previousOutput = '';

    for (const agent of agents) {
      const task = previousOutput
        ? `${agent.task}\n\nContext from previous agent:\n${previousOutput}`
        : agent.task;

      emit(BUS_RINGS.MIND, 'sim', { type: 'PIPELINE_STEP', agentId: agent.agentId });
      const outcome = await runAgent(agent, this.opts, task);
      results.push(outcome);

      if (!outcome.success) break; // stop pipeline on failure
      previousOutput = outcome.output ?? '';
    }

    return {
      winner:   results[results.length - 1],
      results,
      duration: Date.now() - start,
      pattern:  'pipeline',
    };
  }

  /**
   * SCATTER-GATHER: Fan out N sub-tasks in parallel, aggregate into summary.
   * Ideal for: map-reduce style work, parallel research.
   *
   * @param subtasks - array of specific sub-task descriptions
   * @param aggregatorAgent - agent that summarizes all results
   */
  async scatterGather(
    subtasks:        SimAgent[],
    aggregatorAgent: SimAgent
  ): Promise<SimResult> {
    const start = Date.now();
    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_START', pattern: 'scatter-gather', count: subtasks.length });

    // SCATTER: run all sub-tasks in parallel (with concurrency limit)
    const batches = chunk(subtasks, this.opts.concurrency ?? 999);
    const subResults: AgentOutcome[] = [];
    for (const batch of batches) {
      const settled = await Promise.allSettled(batch.map(a => runAgent(a, this.opts)));
      settled.forEach(s => {
        subResults.push(
          s.status === 'fulfilled' ? s.value : { agentId: '', name: '', success: false, cost: 0, duration: 0 }
        );
      });
    }

    // GATHER: aggregate all outputs via aggregator agent
    const gathered = subResults
      .filter(r => r.success)
      .map(r => `[${r.name}]: ${r.output}`)
      .join('\n\n');

    const aggregatorTask = `${aggregatorAgent.task}\n\n=== SUB-RESULTS ===\n${gathered}`;
    const final = await runAgent(aggregatorAgent, this.opts, aggregatorTask);

    emit(BUS_RINGS.MIND, 'sim', { type: 'SIM_DONE', pattern: 'scatter-gather' });

    return {
      winner:  final,
      results: [...subResults, final],
      duration: Date.now() - start,
      pattern: 'scatter-gather',
    };
  }

  /**
   * Benchmark: run same task across N agents, return perf table.
   * Use to compare models/configs without changing code.
   */
  async benchmark(task: string, configs: Omit<SimAgent, 'task'>[]): Promise<{
    table: Array<{ agent: string; success: boolean; duration: number; cost: number; happiness?: number }>;
    fastest: string;
    cheapest: string;
    happiest: string;
  }> {
    const agents: SimAgent[] = configs.map(c => ({ ...c, task }));
    const { results } = await this.race(agents);
    const successes = results.filter(r => r.success);
    return {
      table:    results.map(r => ({ agent: r.name, success: r.success, duration: r.duration, cost: r.cost, happiness: r.happiness })),
      fastest:  successes.sort((a, b) => a.duration - b.duration)[0]?.name ?? 'none',
      cheapest: successes.sort((a, b) => a.cost - b.cost)[0]?.name ?? 'none',
      happiest: successes.sort((a, b) => (b.happiness ?? 0) - (a.happiness ?? 0))[0]?.name ?? 'none',
    };
  }
}
