import { describe, it, expect, beforeEach } from 'vitest';
import { CuriosityEngine, CURIOSITY_REWARDS } from '../src/curiosity-engine';
import { kv } from '../src/index';

describe('CuriosityEngine', () => {
  const testAgentId = 'test-agent-curiosity';
  const testAction = 'test-action';

  beforeEach(async () => {
    // Clean up test data
    await kv.del(`agent:${testAgentId}:exploration_history`);
    await kv.del(`agent:${testAgentId}:explorations`);
    await kv.del(`agent:${testAgentId}:curiosity_score`);
    await kv.del(`agent:${testAgentId}:skill_combos`);
    await kv.del(`agent:${testAgentId}:action_count:${testAction}`);
  });

  describe('calculateCuriosityReward', () => {
    it('should reward trying a new tool', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        testAction,
        { params: {} }
      );

      expect(reward).toBe(CURIOSITY_REWARDS.NEW_TOOL_TRIED);
      
      const history = await CuriosityEngine.getExplorationHistory(testAgentId);
      expect(history.size).toBe(1);
    });

    it('should not reward using the same tool twice', async () => {
      // First use
      const reward1 = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        testAction,
        { params: {} }
      );
      expect(reward1).toBe(CURIOSITY_REWARDS.NEW_TOOL_TRIED);

      // Second use - no reward
      const reward2 = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        testAction,
        { params: {} }
      );
      expect(reward2).toBe(0);
    });

    it('should reward new skill combinations', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'combo-action',
        {
          params: {},
          skillSequence: ['skill1', 'skill2', 'skill3']
        }
      );

      expect(reward).toBeGreaterThanOrEqual(CURIOSITY_REWARDS.NEW_SKILL_COMBO);
    });

    it('should reward unexpected success', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'unexpected-action',
        {
          params: {},
          unexpected: true,
          success: true
        }
      );

      expect(reward).toBeGreaterThanOrEqual(CURIOSITY_REWARDS.UNEXPECTED_SUCCESS);
    });

    it('should reward exploring edge cases', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'edge-action',
        {
          params: {},
          edgeCase: true,
          edgeCaseType: 'boundary-condition'
        }
      );

      expect(reward).toBeGreaterThanOrEqual(CURIOSITY_REWARDS.EXPLORED_EDGE_CASE);
    });

    it('should reward pattern discovery', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'pattern-action',
        {
          params: {},
          patternDiscovered: true,
          patternType: 'data-correlation'
        }
      );

      expect(reward).toBeGreaterThanOrEqual(CURIOSITY_REWARDS.FOUND_PATTERN);
    });

    it('should accumulate multiple rewards', async () => {
      const reward = await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'multi-reward-action',
        {
          params: {},
          unexpected: true,
          success: true,
          edgeCase: true,
          patternDiscovered: true
        }
      );

      const expectedTotal = 
        CURIOSITY_REWARDS.NEW_TOOL_TRIED +
        CURIOSITY_REWARDS.UNEXPECTED_SUCCESS +
        CURIOSITY_REWARDS.EXPLORED_EDGE_CASE +
        CURIOSITY_REWARDS.FOUND_PATTERN;

      expect(reward).toBe(expectedTotal);
    });
  });

  describe('suggestExploration', () => {
    it('should suggest unexplored actions', async () => {
      const availableActions = ['action1', 'action2', 'action3', 'action4'];
      
      // Use action1
      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'action1',
        { params: {} }
      );

      const suggestions = await CuriosityEngine.suggestExploration(
        testAgentId,
        availableActions
      );

      expect(suggestions).toContain('action2');
      expect(suggestions).toContain('action3');
      expect(suggestions).toContain('action4');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getCuriosityScore', () => {
    it('should return 0 for new agent', async () => {
      const score = await CuriosityEngine.getCuriosityScore(testAgentId);
      expect(score).toBe(0);
    });

    it('should accumulate curiosity score', async () => {
      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'action1',
        { params: {} }
      );

      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'action2',
        { params: {} }
      );

      const score = await CuriosityEngine.getCuriosityScore(testAgentId);
      expect(score).toBe(CURIOSITY_REWARDS.NEW_TOOL_TRIED * 2);
    });
  });

  describe('getRecentExplorations', () => {
    it('should return recent explorations', async () => {
      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'action1',
        { params: {} }
      );

      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'action2',
        { params: {} }
      );

      const explorations = await CuriosityEngine.getRecentExplorations(testAgentId, 10);
      expect(explorations.length).toBe(2);
      expect(explorations[0].actionType).toBe('NEW_TOOL_TRIED');
    });
  });

  describe('getSkillCombos', () => {
    it('should track skill combinations', async () => {
      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'combo1',
        {
          params: {},
          skillSequence: ['skill1', 'skill2']
        }
      );

      const combos = await CuriosityEngine.getSkillCombos(testAgentId);
      expect(combos.length).toBe(1);
      expect(combos[0].skills).toContain('skill1');
      expect(combos[0].skills).toContain('skill2');
    });

    it('should not duplicate skill combinations', async () => {
      // Use same combo twice
      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'combo1',
        {
          params: {},
          skillSequence: ['skill1', 'skill2']
        }
      );

      await CuriosityEngine.calculateCuriosityReward(
        testAgentId,
        'combo2',
        {
          params: {},
          skillSequence: ['skill1', 'skill2']
        }
      );

      const combos = await CuriosityEngine.getSkillCombos(testAgentId);
      expect(combos.length).toBe(1);
      expect(combos[0].successCount).toBe(2);
    });
  });

  describe('incrementActionUsage', () => {
    it('should track action usage count', async () => {
      await CuriosityEngine.incrementActionUsage(testAgentId, testAction);
      await CuriosityEngine.incrementActionUsage(testAgentId, testAction);
      await CuriosityEngine.incrementActionUsage(testAgentId, testAction);

      const count = await kv.get<number>(`agent:${testAgentId}:action_count:${testAction}`);
      expect(count).toBe(3);
    });
  });
});

// Made with Bob
