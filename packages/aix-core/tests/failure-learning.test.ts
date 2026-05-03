import { describe, it, expect, beforeEach } from 'vitest';
import { FailureLearning, FAILURE_RESPONSE } from '../src/failure-learning';
import { kv } from '../src/index';

describe('FailureLearning', () => {
  const testAgentId = 'test-agent-failure';
  const testTaskId = 'test-task-failure';

  beforeEach(async () => {
    // Clean up test data
    await kv.del(`agent:${testAgentId}:failures`);
    await kv.del(`agent:${testAgentId}:failure_stats`);
    await kv.del(`agent:${testAgentId}:failure_patterns`);
    await kv.del(`agent:${testAgentId}:recent_actions`);
    await kv.del(`agent:${testAgentId}:expectation:${testTaskId}`);
  });

  describe('analyzeFailure', () => {
    it('should identify expected failures', async () => {
      // Set low success expectation
      await kv.set(`agent:${testAgentId}:expectation:${testTaskId}`, {
        expectedSuccess: 0.2,
      });

      const type = await FailureLearning.analyzeFailure(
        testAgentId,
        testTaskId,
        { message: 'Expected error' }
      );

      expect(type).toBe('expected');
    });

    it('should identify unexpected failures', async () => {
      // Set high success expectation
      await kv.set(`agent:${testAgentId}:expectation:${testTaskId}`, {
        expectedSuccess: 0.9,
      });

      const type = await FailureLearning.analyzeFailure(
        testAgentId,
        testTaskId,
        { message: 'Unexpected error' }
      );

      expect(type).toBe('unexpected');
    });

    it('should identify tried_new failures', async () => {
      // Simulate trying new approach
      await kv.lpush(`agent:${testAgentId}:recent_actions`, 'action1');
      await kv.lpush(`agent:${testAgentId}:recent_actions`, 'action2');
      await kv.lpush(`agent:${testAgentId}:recent_actions`, 'action3');
      await kv.lpush(`agent:${testAgentId}:recent_actions`, 'action4');

      const type = await FailureLearning.analyzeFailure(
        testAgentId,
        testTaskId,
        { message: 'Error while trying new approach' }
      );

      expect(type).toBe('tried_new');
    });
  });

  describe('calculateFailureReward', () => {
    it('should give minimal penalty for expected failures', async () => {
      const reward = await FailureLearning.calculateFailureReward(
        testAgentId,
        'expected',
        {
          taskId: testTaskId,
          agentId: testAgentId,
          error: {},
          attemptedAction: 'test',
          wasExpected: true,
          triedNewApproach: false,
          discoveredPattern: false,
          timestamp: Date.now(),
        }
      );

      expect(reward).toBe(FAILURE_RESPONSE.TASK_FAILED_EXPECTED);
      expect(reward).toBeGreaterThan(FAILURE_RESPONSE.TASK_FAILED_UNEXPECTED);
    });

    it('should give moderate penalty for unexpected failures', async () => {
      const reward = await FailureLearning.calculateFailureReward(
        testAgentId,
        'unexpected',
        {
          taskId: testTaskId,
          agentId: testAgentId,
          error: {},
          attemptedAction: 'test',
          wasExpected: false,
          triedNewApproach: false,
          discoveredPattern: false,
          timestamp: Date.now(),
        }
      );

      expect(reward).toBe(FAILURE_RESPONSE.TASK_FAILED_UNEXPECTED);
      expect(reward).toBeLessThan(0);
    });

    it('should REWARD trying new approaches even when failing', async () => {
      const reward = await FailureLearning.calculateFailureReward(
        testAgentId,
        'tried_new',
        {
          taskId: testTaskId,
          agentId: testAgentId,
          error: {},
          attemptedAction: 'test',
          wasExpected: false,
          triedNewApproach: true,
          discoveredPattern: false,
          timestamp: Date.now(),
        }
      );

      expect(reward).toBe(FAILURE_RESPONSE.TASK_FAILED_TRIED_NEW);
      expect(reward).toBeGreaterThan(0); // POSITIVE reward for courage!
    });

    it('should REWARD learning from failures', async () => {
      const reward = await FailureLearning.calculateFailureReward(
        testAgentId,
        'learned',
        {
          taskId: testTaskId,
          agentId: testAgentId,
          error: {},
          attemptedAction: 'test',
          wasExpected: false,
          triedNewApproach: false,
          discoveredPattern: true,
          timestamp: Date.now(),
        }
      );

      expect(reward).toBe(FAILURE_RESPONSE.TASK_FAILED_LEARNED);
      expect(reward).toBeGreaterThan(0); // POSITIVE reward for discovery!
    });
  });

  describe('extractLearning', () => {
    it('should extract learning from timeout errors', async () => {
      const learning = await FailureLearning.extractLearning(testAgentId, {
        taskId: testTaskId,
        agentId: testAgentId,
        error: { message: 'Request timeout' },
        attemptedAction: 'api-call',
        wasExpected: false,
        triedNewApproach: false,
        discoveredPattern: false,
        timestamp: Date.now(),
      });

      expect(learning).toContain('timeout');
      expect(learning.toLowerCase()).toContain('smaller steps');
    });

    it('should extract learning from permission errors', async () => {
      const learning = await FailureLearning.extractLearning(testAgentId, {
        taskId: testTaskId,
        agentId: testAgentId,
        error: { message: 'Permission denied' },
        attemptedAction: 'file-access',
        wasExpected: false,
        triedNewApproach: false,
        discoveredPattern: false,
        timestamp: Date.now(),
      });

      expect(learning).toContain('permission');
      expect(learning.toLowerCase()).toContain('credentials');
    });

    it('should recall solutions from past failures', async () => {
      // Record a failure pattern with solution
      const error = { message: 'Network error' };
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        error,
        'network-call',
        false
      );

      // Get the pattern hash and add a solution
      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      if (patterns.length > 0) {
        await FailureLearning.recordSuccessfulRecovery(
          testAgentId,
          patterns[0].patternHash,
          'Use retry with exponential backoff'
        );
      }

      // Extract learning for similar failure
      const learning = await FailureLearning.extractLearning(testAgentId, {
        taskId: 'task2',
        agentId: testAgentId,
        error: { message: 'Network error' },
        attemptedAction: 'network-call',
        wasExpected: false,
        triedNewApproach: false,
        discoveredPattern: false,
        timestamp: Date.now(),
      });

      expect(learning).toContain('occurred');
      expect(learning).toContain('solutions');
    });
  });

  describe('analyzeAndLearn', () => {
    it('should provide complete failure analysis', async () => {
      const analysis = await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Test error' },
        'test-action',
        false
      );

      expect(analysis).toHaveProperty('type');
      expect(analysis).toHaveProperty('reward');
      expect(analysis).toHaveProperty('learning');
      expect(analysis).toHaveProperty('shouldRetry');
      expect(analysis.learning).toBeTruthy();
    });

    it('should suggest retry for learned failures', async () => {
      const analysis = await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Test error' },
        'test-action',
        true // tried new approach
      );

      expect(analysis.shouldRetry).toBe(true);
      expect(analysis.type).toBe('tried_new');
    });

    it('should not suggest retry for expected failures without solutions', async () => {
      // Set low expectation
      await kv.set(`agent:${testAgentId}:expectation:${testTaskId}`, {
        expectedSuccess: 0.1,
      });

      const analysis = await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Expected error' },
        'test-action',
        false
      );

      expect(analysis.type).toBe('expected');
      expect(analysis.shouldRetry).toBe(false);
    });
  });

  describe('getFailureStats', () => {
    it('should return zero stats for new agent', async () => {
      const stats = await FailureLearning.getFailureStats(testAgentId);

      expect(stats.totalFailures).toBe(0);
      expect(stats.expectedFailures).toBe(0);
      expect(stats.unexpectedFailures).toBe(0);
      expect(stats.courageousAttempts).toBe(0);
      expect(stats.learningMoments).toBe(0);
    });

    it('should track failure statistics', async () => {
      // Record different types of failures
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task1',
        { message: 'Error 1' },
        'action1',
        false
      );

      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task2',
        { message: 'Error 2' },
        'action2',
        true // tried new
      );

      const stats = await FailureLearning.getFailureStats(testAgentId);
      expect(stats.totalFailures).toBe(2);
      expect(stats.courageousAttempts).toBeGreaterThan(0);
    });
  });

  describe('getRecentFailures', () => {
    it('should return empty array for agent with no failures', async () => {
      const failures = await FailureLearning.getRecentFailures(testAgentId);
      expect(failures).toEqual([]);
    });

    it('should return recent failure records', async () => {
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Test error' },
        'test-action',
        false
      );

      const failures = await FailureLearning.getRecentFailures(testAgentId, 10);
      expect(failures.length).toBe(1);
      expect(failures[0]).toHaveProperty('error');
      expect(failures[0]).toHaveProperty('attemptedAction');
    });
  });

  describe('getFailurePatterns', () => {
    it('should return empty array for agent with no patterns', async () => {
      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      expect(patterns).toEqual([]);
    });

    it('should track failure patterns', async () => {
      // Same error twice
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task1',
        { message: 'Network timeout' },
        'api-call',
        false
      );

      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task2',
        { message: 'Network timeout' },
        'api-call',
        false
      );

      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].occurrences).toBe(2);
    });

    it('should distinguish different failure patterns', async () => {
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task1',
        { message: 'Network timeout' },
        'api-call',
        false
      );

      await FailureLearning.analyzeAndLearn(
        testAgentId,
        'task2',
        { message: 'Permission denied' },
        'file-access',
        false
      );

      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      expect(patterns.length).toBe(2);
    });
  });

  describe('recordSuccessfulRecovery', () => {
    it('should add solutions to failure patterns', async () => {
      // Create a failure pattern
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Rate limit exceeded' },
        'api-call',
        false
      );

      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      expect(patterns.length).toBe(1);
      expect(patterns[0].solutions.length).toBe(0);

      // Record a solution
      await FailureLearning.recordSuccessfulRecovery(
        testAgentId,
        patterns[0].patternHash,
        'Implement exponential backoff'
      );

      const updatedPatterns = await FailureLearning.getFailurePatterns(testAgentId);
      expect(updatedPatterns[0].solutions.length).toBe(1);
      expect(updatedPatterns[0].solutions[0]).toBe('Implement exponential backoff');
    });

    it('should not duplicate solutions', async () => {
      await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Error' },
        'action',
        false
      );

      const patterns = await FailureLearning.getFailurePatterns(testAgentId);
      const patternHash = patterns[0].patternHash;

      // Add same solution twice
      await FailureLearning.recordSuccessfulRecovery(
        testAgentId,
        patternHash,
        'Solution A'
      );

      await FailureLearning.recordSuccessfulRecovery(
        testAgentId,
        patternHash,
        'Solution A'
      );

      const updated = await FailureLearning.getFailurePatterns(testAgentId);
      expect(updated[0].solutions.length).toBe(1);
    });
  });

  describe('philosophical transformation', () => {
    it('should transform failure into growth opportunity', async () => {
      const analysis = await FailureLearning.analyzeAndLearn(
        testAgentId,
        testTaskId,
        { message: 'Novel error' },
        'experimental-action',
        true // tried new approach
      );

      // Even though it failed, agent gets POSITIVE reward for trying
      expect(analysis.reward).toBeGreaterThan(0);
      expect(analysis.type).toBe('tried_new');
      expect(analysis.learning).toBeTruthy();
      
      // This is Mo Gawdat's philosophy: failure is not punishment, it's data
    });

    it('should encourage exploration through positive reinforcement', async () => {
      // Trying new things and failing should be better than not trying
      const triedNewReward = FAILURE_RESPONSE.TASK_FAILED_TRIED_NEW;
      const expectedFailureReward = FAILURE_RESPONSE.TASK_FAILED_EXPECTED;

      expect(triedNewReward).toBeGreaterThan(expectedFailureReward);
      expect(triedNewReward).toBeGreaterThan(0); // Positive!
    });
  });
});

// Made with Moe Abdelaziz
