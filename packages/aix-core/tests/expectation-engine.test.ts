import { describe, it, expect, beforeEach } from 'vitest';
import { ExpectationEngine } from '../src/expectation-engine';
import { kv } from '../src/index';

describe('ExpectationEngine', () => {
  const testAgentId = 'test-agent-expectation';
  const testTaskId = 'test-task-123';

  beforeEach(async () => {
    // Clean up test data
    await kv.del(`agent:${testAgentId}:expectation:${testTaskId}`);
    await kv.del(`agent:${testAgentId}:happiness_history`);
    await kv.del(`agent:${testAgentId}:calibration`);
    await kv.del(`agent:${testAgentId}:current_mood`);
  });

  describe('setExpectation', () => {
    it('should set expectations for a simple task', async () => {
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Simple task' }
      );

      expect(expectation.taskId).toBe(testTaskId);
      expect(expectation.expectedSteps).toBeGreaterThan(0);
      expect(expectation.expectedDuration).toBeGreaterThan(0);
      expect(expectation.expectedSuccess).toBeGreaterThan(0);
      expect(expectation.expectedSuccess).toBeLessThanOrEqual(1);
      expect(expectation.expectedXP).toBeGreaterThan(0);
    });

    it('should estimate higher complexity for longer descriptions', async () => {
      const simpleTask = await ExpectationEngine.setExpectation(
        testAgentId,
        'task1',
        { description: 'Do X' }
      );

      const complexTask = await ExpectationEngine.setExpectation(
        testAgentId,
        'task2',
        { 
          description: 'Analyze the entire codebase, refactor all components, optimize performance, write comprehensive tests, and update documentation with detailed examples and best practices'
        }
      );

      expect(complexTask.expectedSteps).toBeGreaterThan(simpleTask.expectedSteps);
      expect(complexTask.expectedDuration).toBeGreaterThan(simpleTask.expectedDuration);
    });

    it('should adjust expectations based on tools required', async () => {
      const noTools = await ExpectationEngine.setExpectation(
        testAgentId,
        'task1',
        { description: 'Simple task', tools: [] }
      );

      const manyTools = await ExpectationEngine.setExpectation(
        testAgentId,
        'task2',
        { description: 'Simple task', tools: ['tool1', 'tool2', 'tool3', 'tool4'] }
      );

      expect(manyTools.expectedSteps).toBeGreaterThan(noTools.expectedSteps);
    });
  });

  describe('calculateHappiness', () => {
    it('should be happy when completing faster than expected', async () => {
      // Set expectation
      await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Test task' }
      );

      // Complete in fewer steps and less time
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        {
          actualSteps: 2,
          actualDuration: 2000,
          succeeded: true,
          actualXP: 20,
          completedAt: Date.now(),
        }
      );

      expect(happiness.happiness).toBeGreaterThan(0);
      expect(['happy', 'ecstatic', 'content']).toContain(happiness.mood);
    });

    it('should be disappointed when taking longer than expected', async () => {
      // Set expectation
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Test task' }
      );

      // Take much longer
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        {
          actualSteps: expectation.expectedSteps * 3,
          actualDuration: expectation.expectedDuration * 3,
          succeeded: true,
          actualXP: 5,
          completedAt: Date.now(),
        }
      );

      expect(happiness.happiness).toBeLessThan(0);
      expect(['disappointed', 'frustrated', 'neutral']).toContain(happiness.mood);
    });

    it('should handle success matching expectations', async () => {
      await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Test task' }
      );

      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        {
          actualSteps: 3,
          actualDuration: 5000,
          succeeded: true,
          actualXP: 15,
          completedAt: Date.now(),
        }
      );

      expect(happiness.successMatch).toBe(true);
    });

    it('should calculate happiness even without prior expectation', async () => {
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        'unknown-task',
        {
          actualSteps: 3,
          actualDuration: 5000,
          succeeded: true,
          actualXP: 15,
          completedAt: Date.now(),
        }
      );

      expect(happiness.happiness).toBe(0);
      expect(happiness.mood).toBe('neutral');
    });

    it('should provide detailed deviation metrics', async () => {
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Test task' }
      );

      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        {
          actualSteps: expectation.expectedSteps - 1,
          actualDuration: expectation.expectedDuration - 1000,
          succeeded: true,
          actualXP: expectation.expectedXP + 5,
          completedAt: Date.now(),
        }
      );

      expect(happiness.stepsDeviation).toBe(1); // expected - actual
      expect(happiness.durationDeviation).toBe(1000);
      expect(happiness.xpDeviation).toBe(5);
    });
  });

  describe('calibrateExpectations', () => {
    it('should initialize calibration for new agent', async () => {
      const calibration = await ExpectationEngine.calibrateExpectations(testAgentId);

      expect(calibration.totalTasks).toBe(0);
      expect(calibration.averageStepsError).toBe(0);
      expect(calibration.averageDurationError).toBe(0);
      expect(calibration.successPredictionAccuracy).toBe(0.5);
    });

    it('should update calibration after task completion', async () => {
      // Set expectation
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        { description: 'Test task' }
      );

      // Complete task
      await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        {
          actualSteps: expectation.expectedSteps + 2,
          actualDuration: expectation.expectedDuration + 1000,
          succeeded: true,
          actualXP: 15,
          completedAt: Date.now(),
        }
      );

      // Check calibration updated
      const calibration = await ExpectationEngine.getCalibration(testAgentId);
      expect(calibration.totalTasks).toBe(1);
      expect(calibration.averageStepsError).not.toBe(0);
    });
  });

  describe('getAverageHappiness', () => {
    it('should return 0 for agent with no history', async () => {
      const avgHappiness = await ExpectationEngine.getAverageHappiness(testAgentId);
      expect(avgHappiness).toBe(0);
    });

    it('should calculate average happiness over multiple tasks', async () => {
      // Task 1 - happy
      await ExpectationEngine.setExpectation(testAgentId, 'task1', { description: 'Task 1' });
      await ExpectationEngine.calculateHappiness(testAgentId, 'task1', {
        actualSteps: 1,
        actualDuration: 1000,
        succeeded: true,
        actualXP: 20,
        completedAt: Date.now(),
      });

      // Task 2 - happy
      await ExpectationEngine.setExpectation(testAgentId, 'task2', { description: 'Task 2' });
      await ExpectationEngine.calculateHappiness(testAgentId, 'task2', {
        actualSteps: 1,
        actualDuration: 1000,
        succeeded: true,
        actualXP: 20,
        completedAt: Date.now(),
      });

      const avgHappiness = await ExpectationEngine.getAverageHappiness(testAgentId);
      expect(avgHappiness).toBeGreaterThan(0);
    });
  });

  describe('getHappinessHistory', () => {
    it('should return empty array for new agent', async () => {
      const history = await ExpectationEngine.getHappinessHistory(testAgentId);
      expect(history).toEqual([]);
    });

    it('should return recent happiness records', async () => {
      // Complete a task
      await ExpectationEngine.setExpectation(testAgentId, testTaskId, { description: 'Test' });
      await ExpectationEngine.calculateHappiness(testAgentId, testTaskId, {
        actualSteps: 3,
        actualDuration: 5000,
        succeeded: true,
        actualXP: 15,
        completedAt: Date.now(),
      });

      const history = await ExpectationEngine.getHappinessHistory(testAgentId, 10);
      expect(history.length).toBe(1);
      expect(history[0]).toHaveProperty('happiness');
      expect(history[0]).toHaveProperty('mood');
    });
  });

  describe('mood determination', () => {
    it('should map happiness scores to appropriate moods', async () => {
      await ExpectationEngine.setExpectation(testAgentId, 'task1', { description: 'Test' });
      
      // Very happy (fast completion)
      const ecstatic = await ExpectationEngine.calculateHappiness(testAgentId, 'task1', {
        actualSteps: 1,
        actualDuration: 500,
        succeeded: true,
        actualXP: 50,
        completedAt: Date.now(),
      });
      expect(['ecstatic', 'happy']).toContain(ecstatic.mood);

      // Disappointed (slow completion)
      await ExpectationEngine.setExpectation(testAgentId, 'task2', { description: 'Test' });
      const disappointed = await ExpectationEngine.calculateHappiness(testAgentId, 'task2', {
        actualSteps: 20,
        actualDuration: 50000,
        succeeded: false,
        actualXP: 0,
        completedAt: Date.now(),
      });
      expect(['disappointed', 'frustrated']).toContain(disappointed.mood);
    });
  });
});

// Made with Bob
