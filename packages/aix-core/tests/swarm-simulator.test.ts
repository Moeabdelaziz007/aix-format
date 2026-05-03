/**
 * Test Suite for Swarm Simulator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SwarmSimulator,
  SwarmConfig,
  SwarmTask,
  AgentConfig,
  CoordinationStrategyType,
} from '../src/swarm-simulator';

describe('SwarmSimulator', () => {
  let config: SwarmConfig;
  let task: SwarmTask;

  beforeEach(() => {
    const agents: AgentConfig[] = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        role: 'leader',
        capabilities: ['planning', 'execution'],
        priority: 5,
      },
      {
        id: 'agent-2',
        name: 'Agent 2',
        role: 'worker',
        capabilities: ['execution', 'review'],
        priority: 3,
      },
      {
        id: 'agent-3',
        name: 'Agent 3',
        role: 'worker',
        capabilities: ['execution'],
        priority: 2,
      },
    ];

    config = {
      agents,
      parallelism: 2,
      timeout: 5000,
      coordination: 'hierarchical',
      communication: 'direct',
      enableVisualization: true,
    };

    task = {
      id: 'task-1',
      description: 'Test task',
      requirements: ['execution'],
      subtasks: [
        {
          id: 'subtask-1',
          description: 'Subtask 1',
          requirements: ['execution'],
        },
        {
          id: 'subtask-2',
          description: 'Subtask 2',
          requirements: ['review'],
        },
      ],
    };
  });

  describe('Constructor', () => {
    it('should create a swarm simulator with valid config', () => {
      const simulator = new SwarmSimulator(config);
      expect(simulator).toBeDefined();
      expect(simulator.getMetrics().totalAgents).toBe(3);
    });

    it('should initialize metrics correctly', () => {
      const simulator = new SwarmSimulator(config);
      const metrics = simulator.getMetrics();
      
      expect(metrics.totalAgents).toBe(3);
      expect(metrics.activeAgents).toBe(0);
      expect(metrics.completedAgents).toBe(0);
      expect(metrics.failedAgents).toBe(0);
    });
  });

  describe('Coordination Strategies', () => {
    it('should use hierarchical coordination', async () => {
      config.coordination = 'hierarchical';
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should use peer-to-peer coordination', async () => {
      config.coordination = 'peer-to-peer';
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.success).toBe(true);
    });

    it('should use consensus coordination', async () => {
      config.coordination = 'consensus';
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Parallel Execution', () => {
    it('should respect parallelism limit', async () => {
      config.parallelism = 1;
      const simulator = new SwarmSimulator(config);
      
      let maxActive = 0;
      simulator.on('event', (event) => {
        const metrics = simulator.getMetrics();
        maxActive = Math.max(maxActive, metrics.activeAgents);
      });
      
      await simulator.run(task);
      expect(maxActive).toBeLessThanOrEqual(1);
    });

    it('should execute multiple agents in parallel', async () => {
      config.parallelism = 3;
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('should track completed agents', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.metrics.completedAgents).toBeGreaterThan(0);
      expect(result.metrics.successRate).toBeGreaterThan(0);
    });

    it('should calculate average duration', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.metrics.averageDuration).toBeGreaterThan(0);
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
    });

    it('should track throughput', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.metrics.throughput).toBeGreaterThan(0);
    });
  });

  describe('Event Timeline', () => {
    it('should record agent started events', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      const startedEvents = result.timeline.filter(e => e.type === 'agent_started');
      expect(startedEvents.length).toBeGreaterThan(0);
    });

    it('should record agent completed events', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      const completedEvents = result.timeline.filter(e => e.type === 'agent_completed');
      expect(completedEvents.length).toBeGreaterThan(0);
    });

    it('should record coordination events', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      const coordEvents = result.timeline.filter(e => e.type === 'coordination');
      expect(coordEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Visualization', () => {
    it('should generate visualization data', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.visualization).toBeDefined();
      expect(result.visualization.nodes.length).toBe(3);
      expect(result.visualization.timeline.length).toBeGreaterThan(0);
    });

    it('should export visualization as JSON', async () => {
      const simulator = new SwarmSimulator(config);
      await simulator.run(task);
      
      const json = simulator.exportVisualization('json');
      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should export visualization as CSV', async () => {
      const simulator = new SwarmSimulator(config);
      await simulator.run(task);
      
      const csv = simulator.exportVisualization('csv');
      expect(csv).toBeDefined();
      expect(csv).toContain('timestamp,agentId,event,duration');
    });
  });

  describe('Streaming', () => {
    it('should stream events during execution', async () => {
      const simulator = new SwarmSimulator(config);
      const events: any[] = [];
      
      for await (const event of simulator.stream(task)) {
        events.push(event);
      }
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'agent_started')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing capabilities gracefully', async () => {
      const impossibleTask: SwarmTask = {
        id: 'impossible',
        description: 'Impossible task',
        requirements: ['nonexistent-capability'],
      };
      
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(impossibleTask);
      
      expect(result.metrics.failedAgents).toBeGreaterThan(0);
    });

    it('should prevent running multiple swarms simultaneously', async () => {
      const simulator = new SwarmSimulator(config);
      
      const promise1 = simulator.run(task);
      
      await expect(simulator.run(task)).rejects.toThrow('already running');
      
      await promise1;
    });
  });

  describe('Stop Functionality', () => {
    it('should stop a running swarm', async () => {
      const simulator = new SwarmSimulator(config);
      
      const runPromise = simulator.run(task);
      await simulator.stop();
      
      const result = await runPromise;
      expect(result).toBeDefined();
    });
  });

  describe('Agent Results', () => {
    it('should return results for all agents', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should include retry count in results', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      result.results.forEach(r => {
        expect(r.retries).toBeDefined();
        expect(typeof r.retries).toBe('number');
      });
    });

    it('should include duration in results', async () => {
      const simulator = new SwarmSimulator(config);
      const result = await simulator.run(task);
      
      result.results.forEach(r => {
        expect(r.duration).toBeGreaterThan(0);
        expect(r.startTime).toBeDefined();
        expect(r.endTime).toBeDefined();
      });
    });
  });
});

describe('Coordination Strategies', () => {
  it('should distribute tasks hierarchically', async () => {
    const agents: AgentConfig[] = [
      { id: 'leader', name: 'Leader', role: 'leader', capabilities: ['all'], priority: 5 },
      { id: 'worker1', name: 'Worker 1', role: 'worker', capabilities: ['task1'], priority: 3 },
      { id: 'worker2', name: 'Worker 2', role: 'worker', capabilities: ['task2'], priority: 2 },
    ];

    const config: SwarmConfig = {
      agents,
      parallelism: 3,
      timeout: 5000,
      coordination: 'hierarchical',
      communication: 'direct',
    };

    const task: SwarmTask = {
      id: 'main',
      description: 'Main task',
      requirements: ['all'],
      subtasks: [
        { id: 'sub1', description: 'Subtask 1', requirements: ['task1'] },
        { id: 'sub2', description: 'Subtask 2', requirements: ['task2'] },
      ],
    };

    const simulator = new SwarmSimulator(config);
    const result = await simulator.run(task);
    
    expect(result.success).toBe(true);
  });
});

describe('Message Queue', () => {
  it('should track message count', async () => {
    const config: SwarmConfig = {
      agents: [
        { id: 'agent1', name: 'Agent 1', role: 'sender', capabilities: ['send'] },
        { id: 'agent2', name: 'Agent 2', role: 'receiver', capabilities: ['receive'] },
      ],
      parallelism: 2,
      timeout: 5000,
      coordination: 'peer-to-peer',
      communication: 'direct',
    };

    const task: SwarmTask = {
      id: 'comm-test',
      description: 'Communication test',
      requirements: ['send', 'receive'],
    };

    const simulator = new SwarmSimulator(config);
    const result = await simulator.run(task);
    
    expect(result.metrics.messagesSent).toBeGreaterThanOrEqual(0);
  });
});

// Made with Moe Abdelaziz
