/**
 * AIX Gateway - Comprehensive Test Suite
 * Tests for persistent agent processes, lifecycle management, and resource locking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GatewayManager,
  GatewayProcess,
  GatewayStatus
} from '../src/gateway';
import { kv } from '../src/storage/adapter';

// Mock Redis
vi.mock('../src/storage/adapter', () => ({
  kv: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn()
  },
  KEYS: {
    gateway: (id: string) => `aix:gateway:${id}`
  },
  TTL: {
    GATEWAY: 3600
  }
}));

describe('GatewayManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('spawn', () => {
    it('should create new gateway process', async () => {
      const process = await GatewayManager.spawn('agent_123', 'Test task');

      expect(process).toMatchObject({
        id: expect.stringMatching(/^proc_/),
        agentId: 'agent_123',
        status: 'THINKING',
        currentTask: 'Test task',
        observations: {},
        metadata: {},
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });

      expect(process.history).toHaveLength(1);
      expect(process.history[0]).toMatchObject({
        role: 'user',
        content: 'Test task',
        timestamp: expect.any(Number)
      });
    });

    it('should store process in Redis', async () => {
      await GatewayManager.spawn('agent_123', 'Test task');

      expect(kv.set).toHaveBeenCalledWith(
        expect.stringMatching(/^aix:gateway:proc_/),
        expect.objectContaining({
          agentId: 'agent_123',
          status: 'THINKING'
        }),
        { ex: 3600 }
      );
    });

    it('should generate unique process IDs', async () => {
      const process1 = await GatewayManager.spawn('agent_1', 'Task 1');
      const process2 = await GatewayManager.spawn('agent_1', 'Task 2');

      expect(process1.id).not.toBe(process2.id);
    });

    it('should accept custom metadata', async () => {
      const metadata = { priority: 'high', source: 'api' };
      const process = await GatewayManager.spawn('agent_123', 'Task', metadata);

      expect(process.metadata).toEqual(metadata);
    });

    it('should handle empty metadata', async () => {
      const process = await GatewayManager.spawn('agent_123', 'Task');

      expect(process.metadata).toEqual({});
    });

    it('should set initial status to THINKING', async () => {
      const process = await GatewayManager.spawn('agent_123', 'Task');

      expect(process.status).toBe('THINKING');
    });

    it('should initialize empty observations', async () => {
      const process = await GatewayManager.spawn('agent_123', 'Task');

      expect(process.observations).toEqual({});
    });

    it('should set timestamps', async () => {
      const before = Date.now();
      const process = await GatewayManager.spawn('agent_123', 'Task');
      const after = Date.now();

      expect(process.createdAt).toBeGreaterThanOrEqual(before);
      expect(process.createdAt).toBeLessThanOrEqual(after);
      expect(process.updatedAt).toBe(process.createdAt);
    });
  });

  describe('pulse', () => {
    let mockProcess: GatewayProcess;

    beforeEach(() => {
      mockProcess = {
        id: 'proc_test123',
        agentId: 'agent_123',
        status: 'THINKING',
        history: [{ role: 'user', content: 'Task', timestamp: Date.now() }],
        currentTask: 'Task',
        observations: {},
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    });

    it('should update process status', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'ACTING'
      });

      expect(updated.status).toBe('ACTING');
    });

    it('should update lastThought', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        lastThought: 'I need to analyze this'
      });

      expect(updated.lastThought).toBe('I need to analyze this');
    });

    it('should update lastAction', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        lastAction: 'search_database'
      });

      expect(updated.lastAction).toBe('search_database');
    });

    it('should update observations', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        observations: { result: 'found' }
      });

      expect(updated.observations).toEqual({ result: 'found' });
    });

    it('should update timestamp', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const before = Date.now();
      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'ACTING'
      });
      const after = Date.now();

      expect(updated.updatedAt).toBeGreaterThanOrEqual(before);
      expect(updated.updatedAt).toBeLessThanOrEqual(after);
      expect(updated.updatedAt).toBeGreaterThan(mockProcess.updatedAt);
    });

    it('should preserve unchanged fields', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'ACTING'
      });

      expect(updated.agentId).toBe(mockProcess.agentId);
      expect(updated.currentTask).toBe(mockProcess.currentTask);
      expect(updated.createdAt).toBe(mockProcess.createdAt);
    });

    it('should save updated process to Redis', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      await GatewayManager.pulse('proc_test123', { status: 'ACTING' });

      expect(kv.set).toHaveBeenCalledWith(
        'aix:gateway:proc_test123',
        expect.objectContaining({ status: 'ACTING' }),
        { ex: 3600 }
      );
    });

    it('should throw error if process not found', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      await expect(
        GatewayManager.pulse('proc_nonexistent', { status: 'ACTING' })
      ).rejects.toThrow('Process proc_nonexistent not found');
    });

    it('should handle multiple updates', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'ACTING',
        lastThought: 'Analyzing',
        lastAction: 'search'
      });

      expect(updated.status).toBe('ACTING');
      expect(updated.lastThought).toBe('Analyzing');
      expect(updated.lastAction).toBe('search');
    });
  });

  describe('getProcess', () => {
    it('should retrieve process from Redis', async () => {
      const mockProcess: GatewayProcess = {
        id: 'proc_test123',
        agentId: 'agent_123',
        status: 'THINKING',
        history: [],
        currentTask: 'Task',
        observations: {},
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const process = await GatewayManager.getProcess('proc_test123');

      expect(process).toEqual(mockProcess);
      expect(kv.get).toHaveBeenCalledWith('aix:gateway:proc_test123');
    });

    it('should return null if process not found', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const process = await GatewayManager.getProcess('proc_nonexistent');

      expect(process).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      vi.mocked(kv.get).mockRejectedValue(new Error('Redis error'));

      await expect(
        GatewayManager.getProcess('proc_test123')
      ).rejects.toThrow('Redis error');
    });
  });

  describe('recordObservation', () => {
    let mockProcess: GatewayProcess;

    beforeEach(() => {
      mockProcess = {
        id: 'proc_test123',
        agentId: 'agent_123',
        status: 'ACTING',
        history: [{ role: 'user', content: 'Task', timestamp: Date.now() }],
        currentTask: 'Task',
        observations: {},
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    });

    it('should add observation to process', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      await GatewayManager.recordObservation('proc_test123', 'action_1', {
        result: 'success'
      });

      expect(kv.set).toHaveBeenCalledWith(
        'aix:gateway:proc_test123',
        expect.objectContaining({
          observations: {
            action_1: { result: 'success' }
          }
        }),
        { ex: 3600 }
      );
    });

    it('should append to history', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      await GatewayManager.recordObservation('proc_test123', 'action_1', {
        data: 'test'
      });

      expect(kv.set).toHaveBeenCalledWith(
        'aix:gateway:proc_test123',
        expect.objectContaining({
          history: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Observation (action_1)')
            })
          ])
        }),
        { ex: 3600 }
      );
    });

    it('should set status to THINKING', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      await GatewayManager.recordObservation('proc_test123', 'action_1', {});

      expect(kv.set).toHaveBeenCalledWith(
        'aix:gateway:proc_test123',
        expect.objectContaining({ status: 'THINKING' }),
        { ex: 3600 }
      );
    });

    it('should handle null process gracefully', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      await expect(
        GatewayManager.recordObservation('proc_nonexistent', 'action_1', {})
      ).resolves.not.toThrow();
    });

    it('should preserve existing observations', async () => {
      mockProcess.observations = { action_0: { old: 'data' } };
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      await GatewayManager.recordObservation('proc_test123', 'action_1', {
        new: 'data'
      });

      expect(kv.set).toHaveBeenCalledWith(
        'aix:gateway:proc_test123',
        expect.objectContaining({
          observations: {
            action_0: { old: 'data' },
            action_1: { new: 'data' }
          }
        }),
        { ex: 3600 }
      );
    });
  });

  describe('Status Transitions', () => {
    let mockProcess: GatewayProcess;

    beforeEach(() => {
      mockProcess = {
        id: 'proc_test123',
        agentId: 'agent_123',
        status: 'IDLE',
        history: [],
        currentTask: 'Task',
        observations: {},
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    });

    it('should transition from IDLE to THINKING', async () => {
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'THINKING'
      });

      expect(updated.status).toBe('THINKING');
    });

    it('should transition from THINKING to ACTING', async () => {
      mockProcess.status = 'THINKING';
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'ACTING'
      });

      expect(updated.status).toBe('ACTING');
    });

    it('should transition from ACTING to WAITING', async () => {
      mockProcess.status = 'ACTING';
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'WAITING'
      });

      expect(updated.status).toBe('WAITING');
    });

    it('should transition to COMPLETED', async () => {
      mockProcess.status = 'ACTING';
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'COMPLETED'
      });

      expect(updated.status).toBe('COMPLETED');
    });

    it('should transition to FAILED', async () => {
      mockProcess.status = 'ACTING';
      vi.mocked(kv.get).mockResolvedValue(mockProcess);

      const updated = await GatewayManager.pulse('proc_test123', {
        status: 'FAILED'
      });

      expect(updated.status).toBe('FAILED');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete process lifecycle', async () => {
      // Spawn
      const process = await GatewayManager.spawn('agent_123', 'Complete task');
      expect(process.status).toBe('THINKING');

      // Update to ACTING
      vi.mocked(kv.get).mockResolvedValue(process);
      const acting = await GatewayManager.pulse(process.id, {
        status: 'ACTING',
        lastAction: 'execute'
      });
      expect(acting.status).toBe('ACTING');

      // Record observation
      vi.mocked(kv.get).mockResolvedValue(acting);
      await GatewayManager.recordObservation(process.id, 'action_1', {
        result: 'success'
      });

      // Complete
      vi.mocked(kv.get).mockResolvedValue(acting);
      const completed = await GatewayManager.pulse(process.id, {
        status: 'COMPLETED'
      });
      expect(completed.status).toBe('COMPLETED');
    });

    it('should handle multiple observations', async () => {
      const process = await GatewayManager.spawn('agent_123', 'Multi-step task');
      
      vi.mocked(kv.get).mockResolvedValue(process);
      await GatewayManager.recordObservation(process.id, 'step_1', { done: true });
      
      vi.mocked(kv.get).mockResolvedValue({
        ...process,
        observations: { step_1: { done: true } }
      });
      await GatewayManager.recordObservation(process.id, 'step_2', { done: true });

      expect(kv.set).toHaveBeenCalledTimes(3); // spawn + 2 observations
    });
  });
});

// Made with Moe Abdelaziz
