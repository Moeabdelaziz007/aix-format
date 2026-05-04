/**
 * Gateway + ExpectationEngine Integration Tests
 * Tests the complete flow: Gateway → ExpectationEngine → Task Execution
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock implementations
class ExpectationEngine {
  private expectations: Map<string, any> = new Map();
  private completedTasks: Set<string> = new Set();
  private failedTasks: Map<string, string> = new Map();

  async setExpectation(
    agentId: string,
    taskId: string,
    expectedSteps: string[],
    expectedMs: number,
    description: string
  ): Promise<void> {
    const key = `${agentId}:${taskId}`;
    this.expectations.set(key, {
      agentId,
      taskId,
      expectedSteps,
      expectedMs,
      description,
      startTime: Date.now(),
      currentStep: 0
    });
  }

  async markExpectationMet(agentId: string, taskId: string): Promise<void> {
    const key = `${agentId}:${taskId}`;
    this.completedTasks.add(key);
    this.expectations.delete(key);
  }

  async markExpectationFailed(agentId: string, taskId: string, reason: string): Promise<void> {
    const key = `${agentId}:${taskId}`;
    this.failedTasks.set(key, reason);
    this.expectations.delete(key);
  }

  getExpectation(agentId: string, taskId: string): any {
    return this.expectations.get(`${agentId}:${taskId}`);
  }

  isCompleted(agentId: string, taskId: string): boolean {
    return this.completedTasks.has(`${agentId}:${taskId}`);
  }

  isFailed(agentId: string, taskId: string): boolean {
    return this.failedTasks.has(`${agentId}:${taskId}`);
  }

  getFailureReason(agentId: string, taskId: string): string | undefined {
    return this.failedTasks.get(`${agentId}:${taskId}`);
  }

  reset(): void {
    this.expectations.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }
}

class TrustChain {
  async verifySignature(agentId: string, data: any, signature: string): Promise<boolean> {
    // Mock signature verification
    return signature === `valid-sig-${agentId}`;
  }
}

interface AgentAction {
  agentId: string;
  action: string;
  params: any;
  signature?: string;
  timestamp: number;
  mood?: 'happy' | 'sad' | 'neutral';
}

interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

class Gateway {
  private expectationEngine: ExpectationEngine;
  private trustChain: TrustChain;
  private actionHandlers: Map<string, (params: any, mood?: string) => Promise<any>>;

  constructor() {
    this.expectationEngine = new ExpectationEngine();
    this.trustChain = new TrustChain();
    this.actionHandlers = new Map();
    this.registerDefaultHandlers();
  }

  async executeAction(action: AgentAction): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // 1. Verify signature if provided
      if (action.signature) {
        const isValid = await this.trustChain.verifySignature(
          action.agentId,
          action,
          action.signature
        );
        
        if (!isValid) {
          return {
            success: false,
            error: 'Invalid signature',
            executionTime: Date.now() - startTime
          };
        }
      }

      // 2. Set expectation for monitoring
      await this.expectationEngine.setExpectation(
        action.agentId,
        action.action,
        ['validate', 'execute', 'complete'],
        30000,
        `Executing ${action.action}`
      );

      // 3. Get action handler
      const handler = this.actionHandlers.get(action.action);
      if (!handler) {
        throw new Error(`Unknown action: ${action.action}`);
      }

      // 4. Execute action (with mood if provided)
      const result = await handler(action.params, action.mood);

      // 5. Mark expectation as met
      await this.expectationEngine.markExpectationMet(
        action.agentId,
        action.action
      );

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      await this.expectationEngine.markExpectationFailed(
        action.agentId,
        action.action,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  registerHandler(action: string, handler: (params: any, mood?: string) => Promise<any>) {
    this.actionHandlers.set(action, handler);
  }

  private registerDefaultHandlers() {
    this.registerHandler('deploy', async (params, mood) => {
      if (mood === 'sad') {
        throw new Error('Agent is too sad to deploy');
      }
      return {
        deploymentId: `deploy-${Date.now()}`,
        status: 'deployed',
        mood: mood || 'neutral'
      };
    });

    this.registerHandler('execute', async (params, mood) => {
      if (mood === 'happy') {
        // Happy agents execute faster
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return {
        taskId: params.taskId,
        result: `Executed with ${mood || 'neutral'} mood`,
        timestamp: Date.now()
      };
    });

    this.registerHandler('monitor', async (params) => {
      return {
        agentId: params.agentId,
        status: 'healthy',
        metrics: { uptime: 1000, requests: 100, errors: 0 }
      };
    });
  }

  getExpectationEngine(): ExpectationEngine {
    return this.expectationEngine;
  }

  reset(): void {
    this.expectationEngine.reset();
  }
}

describe('Gateway + ExpectationEngine Integration', () => {
  let gateway: Gateway;

  before(() => {
    gateway = new Gateway();
  });

  after(() => {
    gateway.reset();
  });

  describe('Basic Flow', () => {
    it('should execute action and mark expectation as met', async () => {
      const action: AgentAction = {
        agentId: 'agent-1',
        action: 'deploy',
        params: { version: '1.0.0' },
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(action);

      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.status, 'deployed');
      
      // Verify expectation was marked as met
      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isCompleted('agent-1', 'deploy'), true);
    });

    it('should handle signature verification', async () => {
      const action: AgentAction = {
        agentId: 'agent-2',
        action: 'deploy',
        params: { version: '1.0.0' },
        signature: 'valid-sig-agent-2',
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(action);

      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should reject invalid signatures', async () => {
      const action: AgentAction = {
        agentId: 'agent-3',
        action: 'deploy',
        params: { version: '1.0.0' },
        signature: 'invalid-signature',
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(action);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid signature');
    });
  });

  describe('Multi-Task Flows', () => {
    it('should handle multiple sequential tasks', async () => {
      const agentId = 'agent-multi';
      
      // Task 1: Deploy
      const deploy = await gateway.executeAction({
        agentId,
        action: 'deploy',
        params: { version: '1.0.0' },
        timestamp: Date.now()
      });

      assert.strictEqual(deploy.success, true);

      // Task 2: Execute
      const execute = await gateway.executeAction({
        agentId,
        action: 'execute',
        params: { taskId: 'task-1' },
        timestamp: Date.now()
      });

      assert.strictEqual(execute.success, true);

      // Task 3: Monitor
      const monitor = await gateway.executeAction({
        agentId,
        action: 'monitor',
        params: { agentId },
        timestamp: Date.now()
      });

      assert.strictEqual(monitor.success, true);

      // Verify all tasks completed
      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isCompleted(agentId, 'deploy'), true);
      assert.strictEqual(engine.isCompleted(agentId, 'execute'), true);
      assert.strictEqual(engine.isCompleted(agentId, 'monitor'), true);
    });

    it('should handle parallel tasks from different agents', async () => {
      const tasks = [
        gateway.executeAction({
          agentId: 'agent-a',
          action: 'deploy',
          params: { version: '1.0.0' },
          timestamp: Date.now()
        }),
        gateway.executeAction({
          agentId: 'agent-b',
          action: 'deploy',
          params: { version: '1.0.0' },
          timestamp: Date.now()
        }),
        gateway.executeAction({
          agentId: 'agent-c',
          action: 'deploy',
          params: { version: '1.0.0' },
          timestamp: Date.now()
        })
      ];

      const results = await Promise.all(tasks);

      results.forEach(result => {
        assert.strictEqual(result.success, true);
      });

      // Verify all completed
      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isCompleted('agent-a', 'deploy'), true);
      assert.strictEqual(engine.isCompleted('agent-b', 'deploy'), true);
      assert.strictEqual(engine.isCompleted('agent-c', 'deploy'), true);
    });
  });

  describe('Failure & Recovery Scenarios', () => {
    it('should mark expectation as failed on error', async () => {
      const action: AgentAction = {
        agentId: 'agent-fail',
        action: 'unknown-action',
        params: {},
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(action);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);

      // Verify expectation was marked as failed
      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isFailed('agent-fail', 'unknown-action'), true);
      assert.ok(engine.getFailureReason('agent-fail', 'unknown-action'));
    });

    it('should allow retry after failure', async () => {
      const agentId = 'agent-retry';
      
      // First attempt: fail
      const fail = await gateway.executeAction({
        agentId,
        action: 'unknown-action',
        params: {},
        timestamp: Date.now()
      });

      assert.strictEqual(fail.success, false);

      // Second attempt: succeed
      const success = await gateway.executeAction({
        agentId,
        action: 'deploy',
        params: { version: '1.0.0' },
        timestamp: Date.now()
      });

      assert.strictEqual(success.success, true);

      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isCompleted(agentId, 'deploy'), true);
    });

    it('should handle timeout scenarios', async () => {
      // Register slow handler
      gateway.registerHandler('slow-task', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { status: 'completed' };
      });

      const action: AgentAction = {
        agentId: 'agent-slow',
        action: 'slow-task',
        params: {},
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(action);

      assert.strictEqual(result.success, true);
      assert.ok(result.executionTime >= 100);
    });
  });

  describe('Mood-Dependent Behavior', () => {
    it('should execute faster when agent is happy', async () => {
      const happyAction: AgentAction = {
        agentId: 'agent-happy',
        action: 'execute',
        params: { taskId: 'task-happy' },
        mood: 'happy',
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(happyAction);

      assert.strictEqual(result.success, true);
      assert.ok(result.executionTime < 50); // Should be faster
      assert.ok(result.data.result.includes('happy'));
    });

    it('should execute slower when agent is neutral', async () => {
      const neutralAction: AgentAction = {
        agentId: 'agent-neutral',
        action: 'execute',
        params: { taskId: 'task-neutral' },
        mood: 'neutral',
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(neutralAction);

      assert.strictEqual(result.success, true);
      assert.ok(result.executionTime >= 50); // Should be slower
    });

    it('should fail deployment when agent is sad', async () => {
      const sadAction: AgentAction = {
        agentId: 'agent-sad',
        action: 'deploy',
        params: { version: '1.0.0' },
        mood: 'sad',
        timestamp: Date.now()
      };

      const result = await gateway.executeAction(sadAction);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Agent is too sad to deploy');

      const engine = gateway.getExpectationEngine();
      assert.strictEqual(engine.isFailed('agent-sad', 'deploy'), true);
    });
  });

  describe('Performance', () => {
    it('should handle 100 tasks in under 1 second', async () => {
      const startTime = Date.now();
      const tasks = [];

      for (let i = 0; i < 100; i++) {
        tasks.push(
          gateway.executeAction({
            agentId: `agent-${i}`,
            action: 'deploy',
            params: { version: '1.0.0' },
            timestamp: Date.now()
          })
        );
      }

      const results = await Promise.all(tasks);
      const duration = Date.now() - startTime;

      assert.ok(duration < 1000, `Took ${duration}ms, expected <1000ms`);
      assert.strictEqual(results.length, 100);
      results.forEach(result => {
        assert.strictEqual(result.success, true);
      });
    });
  });
});

// Made with Moe Abdelaziz
