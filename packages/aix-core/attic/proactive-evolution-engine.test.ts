/**
 * E1.5: Tests for ProactiveEvolutionEngine
 * Verifies evolution triggers BEFORE failure occurs
 * 
 * Made with Moe Abdelaziz
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProactiveEvolutionEngine } from './proactive-evolution-engine';
import { recordLesson, incrementLoop, updateTrustDelta, clearEvolution } from './evolution/tracker';
import { trustChain } from './trust-chain/index';

describe('ProactiveEvolutionEngine', () => {
  let engine: ProactiveEvolutionEngine;
  const testAgentDid = 'did:aix:test-agent-123';

  beforeEach(() => {
    engine = new ProactiveEvolutionEngine();
    clearEvolution();
    trustChain.clear();
  });

  describe('proactiveScan', () => {
    it('should detect failure patterns', async () => {
      // Setup: record multiple failures
      recordLesson(testAgentDid, 'failure: task timeout');
      recordLesson(testAgentDid, 'failure: invalid input');
      recordLesson(testAgentDid, 'failure: network error');

      const trigger = await engine.proactiveScan(testAgentDid);

      expect(trigger).toBeDefined();
      expect(trigger?.reason).toBe('failure_pattern');
      expect(trigger?.confidence).toBe(0.9);
      expect(trigger?.suggestedAction).toContain('proven patterns');
    });

    it('should detect declining trust', async () => {
      // Setup: simulate declining trust
      incrementLoop(testAgentDid);
      incrementLoop(testAgentDid);
      incrementLoop(testAgentDid);
      updateTrustDelta(testAgentDid, -5);

      const trigger = await engine.proactiveScan(testAgentDid);

      expect(trigger).toBeDefined();
      expect(trigger?.reason).toBe('improvement_opportunity');
      expect(trigger?.confidence).toBe(0.8);
    });

    it('should detect high-trust agents ready for advanced patterns', async () => {
      // Setup: high trust, many loops
      for (let i = 0; i < 12; i++) {
        incrementLoop(testAgentDid);
      }
      updateTrustDelta(testAgentDid, 6);

      const trigger = await engine.proactiveScan(testAgentDid);

      expect(trigger).toBeDefined();
      expect(trigger?.reason).toBe('topology_insight');
      expect(trigger?.suggestedAction).toContain('advanced patterns');
    });

    it('should return null for healthy agents', async () => {
      // Setup: healthy agent with no issues
      incrementLoop(testAgentDid);
      recordLesson(testAgentDid, 'success: completed task');

      const trigger = await engine.proactiveScan(testAgentDid);

      expect(trigger).toBeNull();
    });
  });

  describe('shouldEvolveNow', () => {
    it('should block evolution if safety score < 7', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'failure_pattern' as const,
        confidence: 0.9,
        suggestedAction: 'test action',
        timestamp: new Date().toISOString()
      };

      // Mock low safety score
      vi.spyOn(require('./mcp-gate').abomScanner, 'getSafetyScore').mockResolvedValue(5);

      const shouldEvolve = await engine.shouldEvolveNow(trigger);

      expect(shouldEvolve).toBe(false);
    });

    it('should allow evolution if safety score >= 7', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'improvement_opportunity' as const,
        confidence: 0.8,
        suggestedAction: 'test action',
        timestamp: new Date().toISOString()
      };

      // Mock high safety score
      vi.spyOn(require('./mcp-gate').abomScanner, 'getSafetyScore').mockResolvedValue(8);

      const shouldEvolve = await engine.shouldEvolveNow(trigger);

      expect(shouldEvolve).toBe(true);
    });

    it('should block evolution if confidence < 0.7', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'scheduled_scan' as const,
        confidence: 0.5,
        suggestedAction: 'test action',
        timestamp: new Date().toISOString()
      };

      vi.spyOn(require('./mcp-gate').abomScanner, 'getSafetyScore').mockResolvedValue(8);

      const shouldEvolve = await engine.shouldEvolveNow(trigger);

      expect(shouldEvolve).toBe(false);
    });

    it('should rate-limit evolutions (max 1 per minute)', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'improvement_opportunity' as const,
        confidence: 0.8,
        suggestedAction: 'test action',
        timestamp: new Date().toISOString()
      };

      vi.spyOn(require('./mcp-gate').abomScanner, 'getSafetyScore').mockResolvedValue(8);

      // First evolution should succeed
      await engine.executeEvolution(trigger);
      const shouldEvolve1 = await engine.shouldEvolveNow(trigger);
      expect(shouldEvolve1).toBe(false); // Too soon

      // Wait 61 seconds (mock)
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000);
      const shouldEvolve2 = await engine.shouldEvolveNow(trigger);
      expect(shouldEvolve2).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('executeEvolution', () => {
    it('should record evolution in TrustChain', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'failure_pattern' as const,
        confidence: 0.9,
        suggestedAction: 'Reduce exploration',
        timestamp: new Date().toISOString()
      };

      await engine.executeEvolution(trigger);

      const chain = trustChain.getChain();
      const evolutionEntry = chain.find(e => e.action === 'evolution.executed');
      
      expect(evolutionEntry).toBeDefined();
      expect(evolutionEntry?.actor_did).toBe(testAgentDid);
    });

    it('should record lesson and increment loop', async () => {
      const trigger = {
        agentDid: testAgentDid,
        reason: 'improvement_opportunity' as const,
        confidence: 0.8,
        suggestedAction: 'Review actions',
        timestamp: new Date().toISOString()
      };

      await engine.executeEvolution(trigger);

      const evolution = require('./evolution/tracker').getEvolution(testAgentDid);
      
      expect(evolution.lessons).toContain('Evolution: Review actions');
      expect(evolution.loops_completed).toBe(1);
    });

    it('should update trust delta based on confidence', async () => {
      const highConfidenceTrigger = {
        agentDid: testAgentDid,
        reason: 'topology_insight' as const,
        confidence: 0.9,
        suggestedAction: 'Advanced patterns',
        timestamp: new Date().toISOString()
      };

      await engine.executeEvolution(highConfidenceTrigger);

      const evolution = require('./evolution/tracker').getEvolution(testAgentDid);
      expect(evolution.trust_delta).toBe(1);
    });
  });

  describe('Background Loop', () => {
    it('should start and stop background loop', () => {
      const agents = [testAgentDid];
      
      engine.startBackgroundLoop(agents);
      expect(engine['intervalId']).toBeDefined();

      engine.stopBackgroundLoop();
      expect(engine['intervalId']).toBeUndefined();
    });

    it('should scan agents every 5 minutes', async () => {
      vi.useFakeTimers();
      const scanSpy = vi.spyOn(engine, 'proactiveScan');
      
      engine.startBackgroundLoop([testAgentDid]);
      
      // Fast-forward 5 minutes
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      
      expect(scanSpy).toHaveBeenCalledWith(testAgentDid);
      
      engine.stopBackgroundLoop();
      vi.useRealTimers();
    });
  });
});

// Made with Moe Abdelaziz
