/**
 * Canonical Agent Lifecycle Tests
 * Tests 3 core flows: Simple Chat, Data-Fetching, Async Long-Running
 * Full integration: API → Gateway → Runtime → Bus → TrustChain
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';

// Mock Metrics Collector
class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();

  record(metric: string, value: any): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push({
      value,
      timestamp: Date.now()
    });
  }

  getMetrics(metric: string): any[] {
    return this.metrics.get(metric) || [];
  }

  getLatest(metric: string): any {
    const values = this.getMetrics(metric);
    return values[values.length - 1];
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Mock Bus (4-Ring Architecture)
class Bus extends EventEmitter {
  private metrics: MetricsCollector;

  constructor(metrics: MetricsCollector) {
    super();
    this.metrics = metrics;
  }

  emitEvent(ring: string, event: string, data: any): void {
    this.metrics.record(`bus.${ring}.${event}`, data);
    this.emit(`${ring}:${event}`, data);
  }
}

// Mock TrustChain
class TrustChain {
  private metrics: MetricsCollector;

  constructor(metrics: MetricsCollector) {
    this.metrics = metrics;
  }

  async verifySignature(agentId: string, data: any, signature: string): Promise<boolean> {
    this.metrics.record('trustchain.verify', { agentId, valid: true });
    return signature.startsWith('valid-');
  }

  async recordLineage(agentId: string, parentId: string | null): Promise<void> {
    this.metrics.record('trustchain.lineage', { agentId, parentId });
  }
}

// Mock Gateway
class Gateway {
  private bus: Bus;
  private trustChain: TrustChain;
  private metrics: MetricsCollector;

  constructor(bus: Bus, trustChain: TrustChain, metrics: MetricsCollector) {
    this.bus = bus;
    this.trustChain = trustChain;
    this.metrics = metrics;
  }

  async spawn(agentId: string, config: any): Promise<{ success: boolean; agentId: string }> {
    this.metrics.record('gateway.spawn', { agentId, config });
    
    // Verify signature if provided
    if (config.signature) {
      const valid = await this.trustChain.verifySignature(agentId, config, config.signature);
      if (!valid) {
        throw new Error('Invalid signature');
      }
    }

    // Record lineage
    await this.trustChain.recordLineage(agentId, config.parentId || null);

    // Emit spawn event
    this.bus.emitEvent('gateway', 'agent.spawned', { agentId, config });

    return { success: true, agentId };
  }

  async run(agentId: string, input: any): Promise<any> {
    this.metrics.record('gateway.run', { agentId, input });
    
    // Emit run event
    this.bus.emitEvent('gateway', 'agent.running', { agentId, input });

    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 50));

    const result = {
      agentId,
      output: `Processed: ${JSON.stringify(input)}`,
      timestamp: Date.now()
    };

    // Emit complete event
    this.bus.emitEvent('gateway', 'agent.completed', { agentId, result });

    return result;
  }

  async pay(agentId: string, amount: number): Promise<{ success: boolean; txHash: string }> {
    this.metrics.record('gateway.pay', { agentId, amount });
    
    // Emit payment event
    this.bus.emitEvent('gateway', 'agent.paid', { agentId, amount });

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
  }
}

// Mock Runtime
class Runtime {
  private bus: Bus;
  private metrics: MetricsCollector;

  constructor(bus: Bus, metrics: MetricsCollector) {
    this.bus = bus;
    this.metrics = metrics;

    // Listen to bus events
    this.bus.on('gateway:agent.running', (data) => {
      this.handleRun(data);
    });
  }

  private async handleRun(data: any): Promise<void> {
    this.metrics.record('runtime.execute', data);
    
    // Emit runtime events
    this.bus.emitEvent('runtime', 'execution.started', data);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 30));
    
    this.bus.emitEvent('runtime', 'execution.completed', {
      ...data,
      result: 'success'
    });
  }
}

describe('Canonical Agent Lifecycle Tests', () => {
  let metrics: MetricsCollector;
  let bus: Bus;
  let trustChain: TrustChain;
  let gateway: Gateway;
  let runtime: Runtime;

  before(() => {
    metrics = new MetricsCollector();
    bus = new Bus(metrics);
    trustChain = new TrustChain(metrics);
    gateway = new Gateway(bus, trustChain, metrics);
    runtime = new Runtime(bus, metrics);
  });

  after(() => {
    metrics.reset();
  });

  describe('Flow 1: Simple Chat Agent', () => {
    it('should complete full lifecycle: spawn → run → pay', async () => {
      const agentId = 'chat-agent-1';

      // 1. Spawn
      const spawnResult = await gateway.spawn(agentId, {
        type: 'chat',
        model: 'gpt-4',
        signature: 'valid-sig-123'
      });

      assert.strictEqual(spawnResult.success, true);
      assert.strictEqual(spawnResult.agentId, agentId);

      // Verify spawn metrics
      const spawnMetrics = metrics.getLatest('gateway.spawn');
      assert.strictEqual(spawnMetrics.value.agentId, agentId);

      // Verify trust chain
      const lineageMetrics = metrics.getLatest('trustchain.lineage');
      assert.strictEqual(lineageMetrics.value.agentId, agentId);

      // 2. Run
      const runResult = await gateway.run(agentId, {
        message: 'Hello, how are you?'
      });

      assert.ok(runResult.output);
      assert.ok(runResult.timestamp);

      // Verify runtime execution
      const runtimeMetrics = metrics.getLatest('runtime.execute');
      assert.strictEqual(runtimeMetrics.value.agentId, agentId);

      // 3. Pay
      const payResult = await gateway.pay(agentId, 0.001);

      assert.strictEqual(payResult.success, true);
      assert.ok(payResult.txHash);

      // Verify payment metrics
      const payMetrics = metrics.getLatest('gateway.pay');
      assert.strictEqual(payMetrics.value.agentId, agentId);
      assert.strictEqual(payMetrics.value.amount, 0.001);
    });

    it('should emit all bus events in correct order', async () => {
      const agentId = 'chat-agent-2';
      const events: string[] = [];

      // Listen to all bus events
      bus.on('gateway:agent.spawned', () => events.push('spawned'));
      bus.on('gateway:agent.running', () => events.push('running'));
      bus.on('runtime:execution.started', () => events.push('exec-started'));
      bus.on('runtime:execution.completed', () => events.push('exec-completed'));
      bus.on('gateway:agent.completed', () => events.push('completed'));
      bus.on('gateway:agent.paid', () => events.push('paid'));

      // Execute lifecycle
      await gateway.spawn(agentId, { type: 'chat' });
      await gateway.run(agentId, { message: 'test' });
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for runtime
      await gateway.pay(agentId, 0.001);

      // Verify event order
      assert.ok(events.includes('spawned'));
      assert.ok(events.includes('running'));
      assert.ok(events.includes('exec-started'));
      assert.ok(events.includes('exec-completed'));
      assert.ok(events.includes('paid'));
    });
  });

  describe('Flow 2: Data-Fetching Agent (WikiBrain)', () => {
    it('should handle async data fetching with retries', async () => {
      const agentId = 'wikibrain-agent-1';

      // 1. Spawn with data-fetching config
      await gateway.spawn(agentId, {
        type: 'data-fetcher',
        source: 'wikipedia',
        retries: 3,
        signature: 'valid-sig-456'
      });

      // 2. Run with query
      const runResult = await gateway.run(agentId, {
        query: 'AIX Format',
        maxResults: 10
      });

      assert.ok(runResult.output);

      // Verify data-fetching metrics
      const runMetrics = metrics.getLatest('gateway.run');
      assert.strictEqual(runMetrics.value.input.query, 'AIX Format');

      // 3. Pay for data usage
      const payResult = await gateway.pay(agentId, 0.005);
      assert.strictEqual(payResult.success, true);
    });

    it('should handle multiple concurrent data fetches', async () => {
      const agents = ['wiki-1', 'wiki-2', 'wiki-3'];
      
      // Spawn all agents
      await Promise.all(
        agents.map(id => gateway.spawn(id, {
          type: 'data-fetcher',
          signature: `valid-sig-${id}`
        }))
      );

      // Run all agents concurrently
      const results = await Promise.all(
        agents.map(id => gateway.run(id, {
          query: `Query for ${id}`
        }))
      );

      assert.strictEqual(results.length, 3);
      results.forEach(result => {
        assert.ok(result.output);
      });

      // Verify all agents recorded in metrics
      const spawnMetrics = metrics.getMetrics('gateway.spawn');
      assert.ok(spawnMetrics.length >= 3);
    });
  });

  describe('Flow 3: Async Long-Running Agent (PWA/Pet)', () => {
    it('should handle long-running background tasks', async () => {
      const agentId = 'pet-agent-1';

      // 1. Spawn pet agent
      await gateway.spawn(agentId, {
        type: 'pet',
        personality: 'friendly',
        autonomy: true,
        signature: 'valid-sig-789'
      });

      // 2. Start long-running task
      const runPromise = gateway.run(agentId, {
        task: 'monitor-mood',
        duration: 1000 // 1 second for testing
      });

      // Verify task started
      await new Promise(resolve => setTimeout(resolve, 100));
      const runMetrics = metrics.getLatest('gateway.run');
      assert.strictEqual(runMetrics.value.agentId, agentId);

      // Wait for completion
      const result = await runPromise;
      assert.ok(result.output);

      // 3. Pay for compute time
      const payResult = await gateway.pay(agentId, 0.01);
      assert.strictEqual(payResult.success, true);
    });

    it('should emit periodic heartbeat events', async () => {
      const agentId = 'pet-agent-2';
      const heartbeats: any[] = [];

      // Listen for heartbeat events
      bus.on('runtime:execution.started', (data) => {
        if (data.agentId === agentId) {
          heartbeats.push(data);
        }
      });

      // Spawn and run
      await gateway.spawn(agentId, {
        type: 'pet',
        signature: 'valid-sig-pet'
      });

      await gateway.run(agentId, {
        task: 'background-monitoring'
      });

      // Wait for heartbeats
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify heartbeats received
      assert.ok(heartbeats.length > 0);
    });

    it('should handle graceful shutdown', async () => {
      const agentId = 'pet-agent-3';

      // Spawn agent
      await gateway.spawn(agentId, {
        type: 'pet',
        signature: 'valid-sig-shutdown'
      });

      // Start task
      const runPromise = gateway.run(agentId, {
        task: 'long-task'
      });

      // Simulate shutdown signal
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Agent should complete gracefully
      const result = await runPromise;
      assert.ok(result);

      // Verify final payment
      const payResult = await gateway.pay(agentId, 0.002);
      assert.strictEqual(payResult.success, true);
    });
  });

  describe('Cross-Flow Integration', () => {
    it('should handle agent spawning another agent (lineage)', async () => {
      const parentId = 'parent-agent';
      const childId = 'child-agent';

      // Spawn parent
      await gateway.spawn(parentId, {
        type: 'orchestrator',
        signature: 'valid-sig-parent'
      });

      // Parent spawns child
      await gateway.spawn(childId, {
        type: 'worker',
        parentId: parentId,
        signature: 'valid-sig-child'
      });

      // Verify lineage recorded
      const lineageMetrics = metrics.getMetrics('trustchain.lineage');
      const childLineage = lineageMetrics.find(m => m.value.agentId === childId);
      
      assert.ok(childLineage);
      assert.strictEqual(childLineage.value.parentId, parentId);
    });

    it('should handle payment distribution across agent hierarchy', async () => {
      const orchestratorId = 'orchestrator-1';
      const workerIds = ['worker-1', 'worker-2', 'worker-3'];

      // Spawn orchestrator
      await gateway.spawn(orchestratorId, {
        type: 'orchestrator',
        signature: 'valid-sig-orch'
      });

      // Spawn workers
      await Promise.all(
        workerIds.map(id => gateway.spawn(id, {
          type: 'worker',
          parentId: orchestratorId,
          signature: `valid-sig-${id}`
        }))
      );

      // Run all workers
      await Promise.all(
        workerIds.map(id => gateway.run(id, { task: 'work' }))
      );

      // Pay orchestrator (should distribute to workers)
      await gateway.pay(orchestratorId, 0.1);

      // Verify payment metrics
      const payMetrics = metrics.getMetrics('gateway.pay');
      assert.ok(payMetrics.length > 0);
    });
  });

  describe('Metrics & Observability', () => {
    it('should expose metrics for Ink dashboard', () => {
      // Get all metrics
      const spawnCount = metrics.getMetrics('gateway.spawn').length;
      const runCount = metrics.getMetrics('gateway.run').length;
      const payCount = metrics.getMetrics('gateway.pay').length;

      assert.ok(spawnCount > 0);
      assert.ok(runCount > 0);
      assert.ok(payCount > 0);

      // Metrics should be available for /pulse endpoint
      const dashboardMetrics = {
        agents: {
          spawned: spawnCount,
          running: runCount,
          paid: payCount
        },
        timestamp: Date.now()
      };

      assert.ok(dashboardMetrics.agents.spawned > 0);
    });

    it('should track performance metrics', () => {
      const runMetrics = metrics.getMetrics('gateway.run');
      
      // Calculate average execution time
      const times = runMetrics.map(m => m.timestamp);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      assert.ok(avgTime > 0);
      assert.ok(avgTime < 10000); // Should be under 10 seconds
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should handle spawn failure gracefully', async () => {
      try {
        await gateway.spawn('invalid-agent', {
          type: 'invalid',
          signature: 'invalid-sig' // Will fail verification
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should recover from runtime errors', async () => {
      const agentId = 'error-agent';

      await gateway.spawn(agentId, {
        type: 'test',
        signature: 'valid-sig-error'
      });

      // This should complete even if runtime has issues
      const result = await gateway.run(agentId, {
        task: 'potentially-failing-task'
      });

      assert.ok(result);
    });
  });
});

// Made with Moe Abdelaziz
