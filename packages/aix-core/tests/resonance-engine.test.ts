/**
 * AIX Resonance Engine - Comprehensive Test Suite
 * Tests for Tesla's Frequency Matching algorithm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ResonanceEngine,
  TaskPerformance,
  AgentResonance
} from '../src/resonance-engine';
import { kv } from '../src/storage/adapter';

// Mock Redis
vi.mock('../src/storage/adapter', () => ({
  kv: {
    lpush: vi.fn(),
    ltrim: vi.fn(),
    lrange: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    sadd: vi.fn(),
    smembers: vi.fn()
  }
}));

describe('Resonance Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordPerformance', () => {
    it('should record task performance', async () => {
      vi.mocked(kv.smembers).mockResolvedValue([]);
      
      const performance: TaskPerformance = {
        taskId: 'task_1',
        taskType: 'code_review',
        agentId: 'agent_1',
        success: true,
        duration: 5000,
        quality: 0.9,
        timestamp: Date.now()
      };

      await ResonanceEngine.recordPerformance(performance);

      expect(kv.lpush).toHaveBeenCalledWith(
        'resonance:performance:agent_1:code_review',
        JSON.stringify(performance)
      );
      expect(kv.ltrim).toHaveBeenCalledWith(
        'resonance:performance:agent_1:code_review',
        0,
        99
      );
    });

    it('should trigger resonance recomputation', async () => {
      vi.mocked(kv.smembers).mockResolvedValue(['code_review']);
      vi.mocked(kv.lrange).mockResolvedValue([]);

      const performance: TaskPerformance = {
        taskId: 'task_1',
        taskType: 'code_review',
        agentId: 'agent_1',
        success: true,
        duration: 5000,
        quality: 0.9,
        timestamp: Date.now()
      };

      await ResonanceEngine.recordPerformance(performance);

      expect(kv.set).toHaveBeenCalled();
    });
  });

  describe('computeResonance', () => {
    it('should compute resonance with sufficient samples', async () => {
      const performances = [
        { taskId: '1', taskType: 'code_review', agentId: 'agent_1', success: true, duration: 3000, quality: 0.9, timestamp: Date.now() },
        { taskId: '2', taskType: 'code_review', agentId: 'agent_1', success: true, duration: 2500, quality: 0.95, timestamp: Date.now() },
        { taskId: '3', taskType: 'code_review', agentId: 'agent_1', success: true, duration: 2800, quality: 0.92, timestamp: Date.now() }
      ];

      vi.mocked(kv.smembers).mockResolvedValue(['code_review']);
      vi.mocked(kv.lrange).mockResolvedValue(performances.map(p => JSON.stringify(p)));

      const result = await ResonanceEngine.computeResonance('agent_1');

      expect(result.agentId).toBe('agent_1');
      expect(result.peakFrequency).toBe('code_review');
      expect(result.frequencies['code_review']).toBeGreaterThan(0.5);
      expect(result.amplification).toBeGreaterThan(1.5);
    });

    it('should return zero resonance with insufficient samples', async () => {
      const performances = [
        { taskId: '1', taskType: 'code_review', agentId: 'agent_1', success: true, duration: 3000, quality: 0.9, timestamp: Date.now() }
      ];

      vi.mocked(kv.smembers).mockResolvedValue(['code_review']);
      vi.mocked(kv.lrange).mockResolvedValue(performances.map(p => JSON.stringify(p)));

      const result = await ResonanceEngine.computeResonance('agent_1');

      expect(result.frequencies['code_review']).toBeUndefined();
    });

    it('should identify peak frequency', async () => {
      const codeReviewPerfs = Array(5).fill(null).map((_, i) => ({
        taskId: `cr_${i}`,
        taskType: 'code_review',
        agentId: 'agent_1',
        success: true,
        duration: 2000,
        quality: 0.95,
        timestamp: Date.now()
      }));

      const bugFixPerfs = Array(5).fill(null).map((_, i) => ({
        taskId: `bf_${i}`,
        taskType: 'bug_fix',
        agentId: 'agent_1',
        success: true,
        duration: 5000,
        quality: 0.7,
        timestamp: Date.now()
      }));

      vi.mocked(kv.smembers).mockResolvedValue(['code_review', 'bug_fix']);
      vi.mocked(kv.lrange)
        .mockResolvedValueOnce(codeReviewPerfs.map(p => JSON.stringify(p)))
        .mockResolvedValueOnce(bugFixPerfs.map(p => JSON.stringify(p)));

      const result = await ResonanceEngine.computeResonance('agent_1');

      expect(result.peakFrequency).toBe('code_review');
      expect(result.frequencies['code_review']).toBeGreaterThan(result.frequencies['bug_fix']);
    });

    it('should identify harmonics', async () => {
      const taskTypes = ['code_review', 'refactoring', 'documentation'];
      const highQualityPerfs = (taskType: string) => Array(5).fill(null).map((_, i) => ({
        taskId: `${taskType}_${i}`,
        taskType,
        agentId: 'agent_1',
        success: true,
        duration: 2000,
        quality: 0.9,
        timestamp: Date.now()
      }));

      vi.mocked(kv.smembers).mockResolvedValue(taskTypes);
      vi.mocked(kv.lrange)
        .mockResolvedValueOnce(highQualityPerfs('code_review').map(p => JSON.stringify(p)))
        .mockResolvedValueOnce(highQualityPerfs('refactoring').map(p => JSON.stringify(p)))
        .mockResolvedValueOnce(highQualityPerfs('documentation').map(p => JSON.stringify(p)));

      const result = await ResonanceEngine.computeResonance('agent_1');

      expect(result.harmonics.length).toBeGreaterThan(0);
    });

    it('should calculate amplification correctly', async () => {
      const performances = Array(5).fill(null).map((_, i) => ({
        taskId: `task_${i}`,
        taskType: 'code_review',
        agentId: 'agent_1',
        success: true,
        duration: 1000,
        quality: 1.0,
        timestamp: Date.now()
      }));

      vi.mocked(kv.smembers).mockResolvedValue(['code_review']);
      vi.mocked(kv.lrange).mockResolvedValue(performances.map(p => JSON.stringify(p)));

      const result = await ResonanceEngine.computeResonance('agent_1');

      // Amplification = 1.5 + (resonance × 1.5), max should be close to 3x
      expect(result.amplification).toBeGreaterThan(1.5);
      expect(result.amplification).toBeLessThanOrEqual(3);
    });
  });

  describe('getResonance', () => {
    it('should retrieve stored resonance', async () => {
      const resonance: AgentResonance = {
        agentId: 'agent_1',
        frequencies: { 'code_review': 0.85 },
        peakFrequency: 'code_review',
        harmonics: [],
        amplification: 2.5,
        lastUpdated: Date.now()
      };

      vi.mocked(kv.get).mockResolvedValue(resonance);

      const result = await ResonanceEngine.getResonance('agent_1');

      expect(result).toEqual(resonance);
    });

    it('should return null for non-existent agent', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await ResonanceEngine.getResonance('agent_unknown');

      expect(result).toBeNull();
    });
  });

  describe('findResonantAgent', () => {
    it('should find best agent by resonance', async () => {
      const resonance1: AgentResonance = {
        agentId: 'agent_1',
        frequencies: { 'code_review': 0.7 },
        peakFrequency: 'code_review',
        harmonics: [],
        amplification: 2.0,
        lastUpdated: Date.now()
      };

      const resonance2: AgentResonance = {
        agentId: 'agent_2',
        frequencies: { 'code_review': 0.9 },
        peakFrequency: 'code_review',
        harmonics: [],
        amplification: 2.8,
        lastUpdated: Date.now()
      };

      vi.mocked(kv.get)
        .mockResolvedValueOnce(resonance1)
        .mockResolvedValueOnce(resonance2);

      const result = await ResonanceEngine.findResonantAgent(
        ['agent_1', 'agent_2'],
        'code_review'
      );

      expect(result).not.toBeNull();
      expect(result!.agentId).toBe('agent_2');
      expect(result!.score).toBe(0.9);
    });

    it('should return null for empty agent list', async () => {
      const result = await ResonanceEngine.findResonantAgent([], 'code_review');

      expect(result).toBeNull();
    });

    it('should return null when no agents have resonance', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const result = await ResonanceEngine.findResonantAgent(
        ['agent_1', 'agent_2'],
        'code_review'
      );

      expect(result).toBeNull();
    });

    it('should filter out agents without task type resonance', async () => {
      const resonance1: AgentResonance = {
        agentId: 'agent_1',
        frequencies: { 'bug_fix': 0.8 },
        peakFrequency: 'bug_fix',
        harmonics: [],
        amplification: 2.5,
        lastUpdated: Date.now()
      };

      const resonance2: AgentResonance = {
        agentId: 'agent_2',
        frequencies: { 'code_review': 0.7 },
        peakFrequency: 'code_review',
        harmonics: [],
        amplification: 2.0,
        lastUpdated: Date.now()
      };

      vi.mocked(kv.get)
        .mockResolvedValueOnce(resonance1)
        .mockResolvedValueOnce(resonance2);

      const result = await ResonanceEngine.findResonantAgent(
        ['agent_1', 'agent_2'],
        'code_review'
      );

      expect(result!.agentId).toBe('agent_2');
    });
  });

  describe('trackTaskType', () => {
    it('should add task type to agent set', async () => {
      await ResonanceEngine.trackTaskType('agent_1', 'code_review');

      expect(kv.sadd).toHaveBeenCalledWith(
        'resonance:agent:agent_1:task_types',
        'code_review'
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard', async () => {
      const resonances = [
        {
          agentId: 'agent_1',
          frequencies: { 'code_review': 0.6 },
          peakFrequency: 'code_review',
          harmonics: [],
          amplification: 1.9,
          lastUpdated: Date.now()
        },
        {
          agentId: 'agent_2',
          frequencies: { 'code_review': 0.9 },
          peakFrequency: 'code_review',
          harmonics: [],
          amplification: 2.8,
          lastUpdated: Date.now()
        },
        {
          agentId: 'agent_3',
          frequencies: { 'code_review': 0.75 },
          peakFrequency: 'code_review',
          harmonics: [],
          amplification: 2.3,
          lastUpdated: Date.now()
        }
      ];

      vi.mocked(kv.get)
        .mockResolvedValueOnce(resonances[0])
        .mockResolvedValueOnce(resonances[1])
        .mockResolvedValueOnce(resonances[2]);

      const result = await ResonanceEngine.getLeaderboard(
        'code_review',
        ['agent_1', 'agent_2', 'agent_3']
      );

      expect(result).toHaveLength(3);
      expect(result[0].agentId).toBe('agent_2');
      expect(result[0].score).toBe(0.9);
      expect(result[1].agentId).toBe('agent_3');
      expect(result[2].agentId).toBe('agent_1');
    });

    it('should respect limit parameter', async () => {
      const resonances = Array(5).fill(null).map((_, i) => ({
        agentId: `agent_${i}`,
        frequencies: { 'code_review': 0.5 + (i * 0.1) },
        peakFrequency: 'code_review',
        harmonics: [],
        amplification: 2.0,
        lastUpdated: Date.now()
      }));

      resonances.forEach(r => {
        vi.mocked(kv.get).mockResolvedValueOnce(r);
      });

      const result = await ResonanceEngine.getLeaderboard(
        'code_review',
        resonances.map(r => r.agentId),
        3
      );

      expect(result).toHaveLength(3);
    });

    it('should filter out agents without task type', async () => {
      vi.mocked(kv.get)
        .mockResolvedValueOnce({
          agentId: 'agent_1',
          frequencies: { 'bug_fix': 0.8 },
          peakFrequency: 'bug_fix',
          harmonics: [],
          amplification: 2.5,
          lastUpdated: Date.now()
        })
        .mockResolvedValueOnce({
          agentId: 'agent_2',
          frequencies: { 'code_review': 0.7 },
          peakFrequency: 'code_review',
          harmonics: [],
          amplification: 2.0,
          lastUpdated: Date.now()
        });

      const result = await ResonanceEngine.getLeaderboard(
        'code_review',
        ['agent_1', 'agent_2']
      );

      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe('agent_2');
    });
  });
});

// Made with Moe Abdelaziz