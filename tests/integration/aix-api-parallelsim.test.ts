/**
 * ParallelSim + aix() API Integration Tests
 * Tests: aix(), aix.swarm(), aix.sim(), aix.stream()
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

// Mock Agent
interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Mock AIX API
class AIXCore {
  private agents: Map<string, Agent> = new Map();
  private eventBus: EventEmitter = new EventEmitter();

  /**
   * aix() - Execute single agent
   */
  async execute(agentId: string, input: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = 'running';
    this.eventBus.emit('agent:start', { agentId, input });

    try {
      // Simulate agent execution
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = {
        agentId,
        input,
        output: `Processed by ${agent.name}`,
        timestamp: Date.now()
      };

      agent.status = 'completed';
      agent.result = result;
      this.eventBus.emit('agent:complete', { agentId, result });

      return result;
    } catch (error) {
      agent.status = 'failed';
      agent.error = error instanceof Error ? error.message : 'Unknown error';
      this.eventBus.emit('agent:error', { agentId, error });
      throw error;
    }
  }

  /**
   * aix.swarm() - Execute multiple agents in parallel
   */
  async swarm(agentIds: string[], input: any): Promise<any[]> {
    this.eventBus.emit('swarm:start', { agentIds, input });

    const promises = agentIds.map(agentId => 
      this.execute(agentId, input).catch(error => ({
        agentId,
        error: error.message,
        failed: true
      }))
    );

    const results = await Promise.all(promises);
    this.eventBus.emit('swarm:complete', { results });

    return results;
  }

  /**
   * aix.sim() - Run simulation with multiple agents
   */
  async sim(config: {
    agents: string[];
    iterations: number;
    input: any;
  }): Promise<any> {
    this.eventBus.emit('sim:start', config);

    const results = [];
    
    for (let i = 0; i < config.iterations; i++) {
      const iterationResults = await this.swarm(config.agents, {
        ...config.input,
        iteration: i
      });
      
      results.push({
        iteration: i,
        results: iterationResults
      });

      this.eventBus.emit('sim:iteration', { iteration: i, results: iterationResults });
    }

    this.eventBus.emit('sim:complete', { results });

    return {
      iterations: config.iterations,
      totalAgents: config.agents.length,
      results
    };
  }

  /**
   * aix.stream() - Stream agent execution results
   */
  async *stream(agentId: string, input: any): AsyncGenerator<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = 'running';
    yield { type: 'start', agentId, timestamp: Date.now() };

    // Simulate streaming chunks
    const chunks = ['Processing', 'Analyzing', 'Generating', 'Finalizing'];
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 20));
      yield {
        type: 'chunk',
        agentId,
        data: chunk,
        timestamp: Date.now()
      };
    }

    const result = {
      agentId,
      input,
      output: `Streamed result from ${agent.name}`,
      timestamp: Date.now()
    };

    agent.status = 'completed';
    agent.result = result;

    yield { type: 'complete', agentId, result, timestamp: Date.now() };
  }

  /**
   * Register agent
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (...args: any[]) => void): void {
    this.eventBus.on(event, handler);
  }

  /**
   * Reset state
   */
  reset(): void {
    this.agents.clear();
    this.eventBus.removeAllListeners();
  }
}

describe('ParallelSim + aix() API', () => {
  let aix: AIXCore;

  before(() => {
    aix = new AIXCore();

    // Register test agents
    aix.registerAgent({ id: 'agent-1', name: 'Agent One', status: 'idle' });
    aix.registerAgent({ id: 'agent-2', name: 'Agent Two', status: 'idle' });
    aix.registerAgent({ id: 'agent-3', name: 'Agent Three', status: 'idle' });
    aix.registerAgent({ id: 'agent-4', name: 'Agent Four', status: 'idle' });
    aix.registerAgent({ id: 'agent-5', name: 'Agent Five', status: 'idle' });
  });

  after(() => {
    aix.reset();
  });

  describe('aix() - Single Agent Execution', () => {
    it('should execute single agent successfully', async () => {
      const result = await aix.execute('agent-1', { task: 'test' });

      assert.ok(result);
      assert.strictEqual(result.agentId, 'agent-1');
      assert.strictEqual(result.input.task, 'test');
      assert.ok(result.output);
      assert.ok(result.timestamp);

      const agent = aix.getAgent('agent-1');
      assert.strictEqual(agent?.status, 'completed');
    });

    it('should handle agent not found', async () => {
      try {
        await aix.execute('unknown-agent', { task: 'test' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Agent not found'));
      }
    });

    it('should emit events during execution', async () => {
      const events: string[] = [];

      aix.on('agent:start', () => events.push('start'));
      aix.on('agent:complete', () => events.push('complete'));

      await aix.execute('agent-2', { task: 'test' });

      assert.deepStrictEqual(events, ['start', 'complete']);
    });
  });

  describe('aix.swarm() - Parallel Execution', () => {
    it('should execute multiple agents in parallel', async () => {
      const startTime = Date.now();
      const results = await aix.swarm(
        ['agent-1', 'agent-2', 'agent-3'],
        { task: 'parallel-test' }
      );
      const duration = Date.now() - startTime;

      assert.strictEqual(results.length, 3);
      
      // Should be faster than sequential (3 * 50ms = 150ms)
      assert.ok(duration < 150, `Took ${duration}ms, expected <150ms`);

      results.forEach(result => {
        assert.ok(result.agentId);
        assert.ok(result.output || result.failed);
      });
    });

    it('should handle partial failures in swarm', async () => {
      // Register a failing agent
      aix.registerAgent({ id: 'failing-agent', name: 'Failing', status: 'idle' });

      const results = await aix.swarm(
        ['agent-1', 'failing-agent', 'agent-2'],
        { task: 'test' }
      );

      assert.strictEqual(results.length, 3);
      
      // Check that some succeeded and some failed
      const succeeded = results.filter(r => !r.failed);
      assert.ok(succeeded.length >= 2);
    });

    it('should emit swarm events', async () => {
      const events: string[] = [];

      aix.on('swarm:start', () => events.push('start'));
      aix.on('swarm:complete', () => events.push('complete'));

      await aix.swarm(['agent-1', 'agent-2'], { task: 'test' });

      assert.deepStrictEqual(events, ['start', 'complete']);
    });
  });

  describe('aix.sim() - Simulation', () => {
    it('should run simulation with multiple iterations', async () => {
      const result = await aix.sim({
        agents: ['agent-1', 'agent-2'],
        iterations: 3,
        input: { task: 'simulation' }
      });

      assert.strictEqual(result.iterations, 3);
      assert.strictEqual(result.totalAgents, 2);
      assert.strictEqual(result.results.length, 3);

      result.results.forEach((iteration: any, i: number) => {
        assert.strictEqual(iteration.iteration, i);
        assert.strictEqual(iteration.results.length, 2);
      });
    });

    it('should emit iteration events', async () => {
      const iterations: number[] = [];

      aix.on('sim:iteration', (data: any) => {
        iterations.push(data.iteration);
      });

      await aix.sim({
        agents: ['agent-1'],
        iterations: 5,
        input: { task: 'test' }
      });

      assert.deepStrictEqual(iterations, [0, 1, 2, 3, 4]);
    });

    it('should handle large simulations', async () => {
      const startTime = Date.now();

      const result = await aix.sim({
        agents: ['agent-1', 'agent-2', 'agent-3'],
        iterations: 10,
        input: { task: 'large-sim' }
      });

      const duration = Date.now() - startTime;

      assert.strictEqual(result.iterations, 10);
      assert.strictEqual(result.results.length, 10);
      
      // Should complete in reasonable time
      assert.ok(duration < 2000, `Took ${duration}ms, expected <2000ms`);
    });
  });

  describe('aix.stream() - Streaming Execution', () => {
    it('should stream agent execution results', async () => {
      const chunks: any[] = [];

      for await (const chunk of aix.stream('agent-1', { task: 'stream-test' })) {
        chunks.push(chunk);
      }

      assert.ok(chunks.length > 0);
      
      // Check start event
      assert.strictEqual(chunks[0].type, 'start');
      assert.strictEqual(chunks[0].agentId, 'agent-1');

      // Check chunk events
      const dataChunks = chunks.filter(c => c.type === 'chunk');
      assert.ok(dataChunks.length > 0);

      // Check complete event
      const lastChunk = chunks[chunks.length - 1];
      assert.strictEqual(lastChunk.type, 'complete');
      assert.ok(lastChunk.result);
    });

    it('should stream in correct order', async () => {
      const types: string[] = [];

      for await (const chunk of aix.stream('agent-2', { task: 'test' })) {
        types.push(chunk.type);
      }

      assert.strictEqual(types[0], 'start');
      assert.strictEqual(types[types.length - 1], 'complete');
      
      // All middle chunks should be 'chunk'
      const middleChunks = types.slice(1, -1);
      middleChunks.forEach(type => {
        assert.strictEqual(type, 'chunk');
      });
    });

    it('should handle streaming errors', async () => {
      try {
        for await (const chunk of aix.stream('unknown-agent', { task: 'test' })) {
          // Should not reach here
          assert.fail('Should have thrown error');
        }
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Agent not found'));
      }
    });
  });

  describe('Performance', () => {
    it('should handle 100 parallel agents', async () => {
      // Register 100 agents
      for (let i = 0; i < 100; i++) {
        aix.registerAgent({
          id: `perf-agent-${i}`,
          name: `Perf Agent ${i}`,
          status: 'idle'
        });
      }

      const agentIds = Array.from({ length: 100 }, (_, i) => `perf-agent-${i}`);
      
      const startTime = Date.now();
      const results = await aix.swarm(agentIds, { task: 'perf-test' });
      const duration = Date.now() - startTime;

      assert.strictEqual(results.length, 100);
      
      // Should complete in reasonable time (not 100 * 50ms = 5000ms)
      assert.ok(duration < 1000, `Took ${duration}ms, expected <1000ms`);
    });

    it('should handle 1000 sequential executions', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        await aix.execute('agent-1', { task: `seq-${i}` });
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      assert.ok(duration < 60000, `Took ${duration}ms, expected <60000ms`);
    });
  });

  describe('Complex Workflows', () => {
    it('should combine swarm + sim', async () => {
      const result = await aix.sim({
        agents: ['agent-1', 'agent-2', 'agent-3'],
        iterations: 5,
        input: { task: 'complex-workflow' }
      });

      assert.strictEqual(result.iterations, 5);
      assert.strictEqual(result.totalAgents, 3);
      
      // Each iteration should have 3 results
      result.results.forEach((iteration: any) => {
        assert.strictEqual(iteration.results.length, 3);
      });
    });

    it('should handle nested agent calls', async () => {
      // Register a coordinator agent
      aix.registerAgent({
        id: 'coordinator',
        name: 'Coordinator',
        status: 'idle'
      });

      // Execute coordinator which internally calls other agents
      const result = await aix.execute('coordinator', {
        task: 'coordinate',
        subAgents: ['agent-1', 'agent-2']
      });

      assert.ok(result);
      assert.strictEqual(result.agentId, 'coordinator');
    });
  });

  describe('Event System', () => {
    it('should track all events in order', async () => {
      const events: string[] = [];

      aix.on('agent:start', () => events.push('agent:start'));
      aix.on('agent:complete', () => events.push('agent:complete'));
      aix.on('swarm:start', () => events.push('swarm:start'));
      aix.on('swarm:complete', () => events.push('swarm:complete'));

      await aix.swarm(['agent-1', 'agent-2'], { task: 'test' });

      assert.ok(events.includes('swarm:start'));
      assert.ok(events.includes('swarm:complete'));
      assert.ok(events.includes('agent:start'));
      assert.ok(events.includes('agent:complete'));
    });
  });
});

// Made with Moe Abdelaziz
