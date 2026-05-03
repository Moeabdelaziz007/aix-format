/**
 * 🔬 ModelDatabase Tests
 * 
 * Tests for model performance tracking and metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ModelDatabase, ModelProfile, ModelMetrics } from '../src/model-database';

describe('ModelDatabase', () => {
  beforeEach(async () => {
    // Reset metrics before each test
    await ModelDatabase.resetMetrics();
  });

  describe('getAllModels', () => {
    it('should return all available models', async () => {
      const models = await ModelDatabase.getAllModels();

      expect(models.length).toBeGreaterThan(0);
      
      // Check model structure
      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.avgQuality).toBeGreaterThanOrEqual(0);
        expect(model.avgQuality).toBeLessThanOrEqual(1);
        expect(model.avgLatency).toBeGreaterThan(0);
        expect(model.costPer1kTokens).toBeGreaterThan(0);
      }
    });

    it('should include models from multiple providers', async () => {
      const models = await ModelDatabase.getAllModels();
      const providers = new Set(models.map(m => m.provider));

      // Should have OpenAI, Anthropic, Meta, Google
      expect(providers.size).toBeGreaterThanOrEqual(3);
      expect(providers.has('openai')).toBe(true);
      expect(providers.has('anthropic')).toBe(true);
    });
  });

  describe('getModel', () => {
    it('should retrieve specific model by ID', async () => {
      const model = await ModelDatabase.getModel('gpt-4-turbo');

      expect(model).toBeDefined();
      expect(model?.id).toBe('gpt-4-turbo');
      expect(model?.name).toBe('GPT-4 Turbo');
      expect(model?.provider).toBe('openai');
    });

    it('should return undefined for unknown model', async () => {
      const model = await ModelDatabase.getModel('unknown-model');
      expect(model).toBeUndefined();
    });
  });

  describe('updateMetrics', () => {
    it('should update model quality with exponential moving average', async () => {
      const modelId = 'gpt-3.5-turbo';
      const initialModel = await ModelDatabase.getModel(modelId);
      const initialQuality = initialModel!.avgQuality;

      // Update with higher quality
      await ModelDatabase.updateMetrics(modelId, {
        quality: 0.95,
        success: true
      });

      const updatedModel = await ModelDatabase.getModel(modelId);
      
      // Quality should have moved toward 0.95
      expect(updatedModel!.avgQuality).toBeGreaterThan(initialQuality);
      expect(updatedModel!.avgQuality).toBeLessThan(0.95); // EMA, not direct replacement
      expect(updatedModel!.totalCalls).toBe(1);
    });

    it('should update model latency with exponential moving average', async () => {
      const modelId = 'claude-3-haiku';
      const initialModel = await ModelDatabase.getModel(modelId);
      const initialLatency = initialModel!.avgLatency;

      // Update with different latency
      const newLatency = 500;
      await ModelDatabase.updateMetrics(modelId, {
        latency: newLatency,
        success: true
      });

      const updatedModel = await ModelDatabase.getModel(modelId);
      
      // Latency should have moved toward new value
      expect(updatedModel!.avgLatency).not.toBe(initialLatency);
      expect(Math.abs(updatedModel!.avgLatency - newLatency)).toBeLessThan(Math.abs(initialLatency - newLatency));
    });

    it('should update success rate', async () => {
      const modelId = 'gpt-4';
      const initialModel = await ModelDatabase.getModel(modelId);
      const initialSuccessRate = initialModel!.successRate;

      // Record a failure
      await ModelDatabase.updateMetrics(modelId, {
        success: false
      });

      const updatedModel = await ModelDatabase.getModel(modelId);
      
      // Success rate should decrease
      expect(updatedModel!.successRate).toBeLessThan(initialSuccessRate);
    });

    it('should track quality history', async () => {
      const modelId = 'claude-3-sonnet';

      // Add multiple quality measurements
      const qualities = [0.8, 0.85, 0.9, 0.75, 0.88];
      for (const quality of qualities) {
        await ModelDatabase.updateMetrics(modelId, {
          quality,
          success: true
        });
      }

      const model = await ModelDatabase.getModel(modelId);
      
      // Should have recorded all quality values
      expect(model!.qualityHistory.length).toBe(qualities.length);
      expect(model!.qualityHistory).toEqual(qualities);
    });

    it('should track latency history', async () => {
      const modelId = 'llama-3-70b';

      // Add multiple latency measurements
      const latencies = [2000, 2100, 1900, 2050, 2200];
      for (const latency of latencies) {
        await ModelDatabase.updateMetrics(modelId, {
          latency,
          success: true
        });
      }

      const model = await ModelDatabase.getModel(modelId);
      
      // Should have recorded all latency values
      expect(model!.latencyHistory.length).toBe(latencies.length);
      expect(model!.latencyHistory).toEqual(latencies);
    });

    it('should limit history size', async () => {
      const modelId = 'gpt-3.5-turbo';
      const historySize = 100;

      // Add more than history size
      for (let i = 0; i < historySize + 20; i++) {
        await ModelDatabase.updateMetrics(modelId, {
          quality: 0.8,
          latency: 1500,
          success: true
        });
      }

      const model = await ModelDatabase.getModel(modelId);
      
      // Should not exceed history size
      expect(model!.qualityHistory.length).toBe(historySize);
      expect(model!.latencyHistory.length).toBe(historySize);
    });

    it('should handle missing model gracefully', async () => {
      // Should not throw
      await expect(
        ModelDatabase.updateMetrics('unknown-model', {
          quality: 0.8,
          success: true
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getModelsByCapability', () => {
    it('should filter models by tool support', async () => {
      const models = await ModelDatabase.getModelsByCapability('tools');

      expect(models.length).toBeGreaterThan(0);
      
      // All returned models should support tools
      for (const model of models) {
        expect(model.supportsTools).toBe(true);
      }
    });

    it('should filter models by streaming support', async () => {
      const models = await ModelDatabase.getModelsByCapability('streaming');

      expect(models.length).toBeGreaterThan(0);
      
      // All returned models should support streaming
      for (const model of models) {
        expect(model.supportsStreaming).toBe(true);
      }
    });

    it('should filter models by long context', async () => {
      const models = await ModelDatabase.getModelsByCapability('long-context');

      expect(models.length).toBeGreaterThan(0);
      
      // All returned models should have large context windows
      for (const model of models) {
        expect(model.maxTokens).toBeGreaterThanOrEqual(100000);
      }
    });

    it('should return all models for unknown capability', async () => {
      const allModels = await ModelDatabase.getAllModels();
      const filtered = await ModelDatabase.getModelsByCapability('unknown');

      expect(filtered.length).toBe(allModels.length);
    });
  });

  describe('getModelsByProvider', () => {
    it('should filter models by OpenAI', async () => {
      const models = await ModelDatabase.getModelsByProvider('openai');

      expect(models.length).toBeGreaterThan(0);
      
      // All should be OpenAI models
      for (const model of models) {
        expect(model.provider).toBe('openai');
      }
    });

    it('should filter models by Anthropic', async () => {
      const models = await ModelDatabase.getModelsByProvider('anthropic');

      expect(models.length).toBeGreaterThan(0);
      
      // All should be Anthropic models
      for (const model of models) {
        expect(model.provider).toBe('anthropic');
      }
    });
  });

  describe('getTopModelsByQuality', () => {
    it('should return top N models by quality', async () => {
      const top5 = await ModelDatabase.getTopModelsByQuality(5);

      expect(top5.length).toBe(5);
      
      // Should be sorted by quality (descending)
      for (let i = 1; i < top5.length; i++) {
        expect(top5[i].avgQuality).toBeLessThanOrEqual(top5[i - 1].avgQuality);
      }
    });

    it('should include highest quality models', async () => {
      const top3 = await ModelDatabase.getTopModelsByQuality(3);

      // Should include premium models like GPT-4 Turbo, Claude 3 Opus
      const modelNames = top3.map(m => m.name);
      const hasPremium = modelNames.some(name => 
        name.includes('GPT-4') || name.includes('Claude 3 Opus')
      );
      expect(hasPremium).toBe(true);
    });
  });

  describe('getCheapestModels', () => {
    it('should return cheapest N models', async () => {
      const cheapest5 = await ModelDatabase.getCheapestModels(5);

      expect(cheapest5.length).toBe(5);
      
      // Should be sorted by cost (ascending)
      for (let i = 1; i < cheapest5.length; i++) {
        expect(cheapest5[i].costPer1kTokens).toBeGreaterThanOrEqual(cheapest5[i - 1].costPer1kTokens);
      }
    });

    it('should include budget models', async () => {
      const cheapest3 = await ModelDatabase.getCheapestModels(3);

      // Should include models like Llama, Claude Haiku, GPT-3.5
      const modelNames = cheapest3.map(m => m.name);
      const hasBudget = modelNames.some(name => 
        name.includes('Llama') || name.includes('Haiku') || name.includes('3.5')
      );
      expect(hasBudget).toBe(true);
    });
  });

  describe('getFastestModels', () => {
    it('should return fastest N models', async () => {
      const fastest5 = await ModelDatabase.getFastestModels(5);

      expect(fastest5.length).toBe(5);
      
      // Should be sorted by latency (ascending)
      for (let i = 1; i < fastest5.length; i++) {
        expect(fastest5[i].avgLatency).toBeGreaterThanOrEqual(fastest5[i - 1].avgLatency);
      }
    });

    it('should include fast models', async () => {
      const fastest3 = await ModelDatabase.getFastestModels(3);

      // Fastest models should have low latency
      for (const model of fastest3) {
        expect(model.avgLatency).toBeLessThan(2000);
      }
    });
  });

  describe('upsertModel', () => {
    it('should add new model', async () => {
      const newModel: ModelProfile = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'test',
        avgQuality: 0.8,
        avgLatency: 2000,
        costPer1kTokens: 0.005,
        maxTokens: 8192,
        supportsStreaming: true,
        supportsTools: true,
        totalCalls: 0,
        successRate: 1.0,
        lastUsed: Date.now(),
        qualityHistory: [],
        latencyHistory: []
      };

      await ModelDatabase.upsertModel(newModel);

      const retrieved = await ModelDatabase.getModel('test-model');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Model');
    });

    it('should update existing model', async () => {
      const model = await ModelDatabase.getModel('gpt-3.5-turbo');
      const updated = { ...model!, avgQuality: 0.99 };

      await ModelDatabase.upsertModel(updated);

      const retrieved = await ModelDatabase.getModel('gpt-3.5-turbo');
      expect(retrieved?.avgQuality).toBe(0.99);
    });
  });

  describe('removeModel', () => {
    it('should remove model from database', async () => {
      const removed = await ModelDatabase.removeModel('gpt-3.5-turbo');
      expect(removed).toBe(true);

      const retrieved = await ModelDatabase.getModel('gpt-3.5-turbo');
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent model', async () => {
      const removed = await ModelDatabase.removeModel('unknown-model');
      expect(removed).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return database statistics', async () => {
      const stats = await ModelDatabase.getStats();

      expect(stats.totalModels).toBeGreaterThan(0);
      expect(stats.totalCalls).toBeGreaterThanOrEqual(0);
      expect(stats.avgQuality).toBeGreaterThan(0);
      expect(stats.avgQuality).toBeLessThanOrEqual(1);
      expect(stats.avgLatency).toBeGreaterThan(0);
      expect(stats.avgCost).toBeGreaterThan(0);
    });

    it('should update stats after metrics updates', async () => {
      const initialStats = await ModelDatabase.getStats();

      // Update some models
      await ModelDatabase.updateMetrics('gpt-4', { success: true });
      await ModelDatabase.updateMetrics('claude-3-opus', { success: true });

      const updatedStats = await ModelDatabase.getStats();

      // Total calls should increase
      expect(updatedStats.totalCalls).toBeGreaterThan(initialStats.totalCalls);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all model metrics', async () => {
      // Add some metrics
      await ModelDatabase.updateMetrics('gpt-4', {
        quality: 0.9,
        latency: 3000,
        success: true
      });

      const beforeReset = await ModelDatabase.getModel('gpt-4');
      expect(beforeReset!.totalCalls).toBeGreaterThan(0);

      // Reset
      await ModelDatabase.resetMetrics();

      const afterReset = await ModelDatabase.getModel('gpt-4');
      expect(afterReset!.totalCalls).toBe(0);
      expect(afterReset!.qualityHistory.length).toBe(0);
      expect(afterReset!.latencyHistory.length).toBe(0);
    });
  });

  describe('Integration: Performance Tracking', () => {
    it('should track model performance over time', async () => {
      const modelId = 'claude-3-sonnet';

      // Simulate usage over time
      const measurements = [
        { quality: 0.85, latency: 2400, success: true },
        { quality: 0.88, latency: 2500, success: true },
        { quality: 0.82, latency: 2600, success: true },
        { quality: 0.90, latency: 2300, success: true },
        { quality: 0.87, latency: 2450, success: true }
      ];

      for (const measurement of measurements) {
        await ModelDatabase.updateMetrics(modelId, measurement);
      }

      const model = await ModelDatabase.getModel(modelId);

      // Should have tracked all measurements
      expect(model!.totalCalls).toBe(measurements.length);
      expect(model!.qualityHistory.length).toBe(measurements.length);
      expect(model!.latencyHistory.length).toBe(measurements.length);

      // Average should reflect measurements
      const avgQuality = measurements.reduce((sum, m) => sum + m.quality, 0) / measurements.length;
      const avgLatency = measurements.reduce((sum, m) => sum + m.latency, 0) / measurements.length;

      // EMA won't match exactly, but should be in reasonable range
      expect(Math.abs(model!.avgQuality - avgQuality)).toBeLessThan(0.1);
      expect(Math.abs(model!.avgLatency - avgLatency)).toBeLessThan(200);
    });

    it('should adapt to changing performance', async () => {
      const modelId = 'llama-3-70b';
      const initialModel = await ModelDatabase.getModel(modelId);
      const initialQuality = initialModel!.avgQuality;

      // Simulate performance degradation
      for (let i = 0; i < 10; i++) {
        await ModelDatabase.updateMetrics(modelId, {
          quality: 0.5, // Lower than initial
          success: true
        });
      }

      const degradedModel = await ModelDatabase.getModel(modelId);

      // Quality should have decreased
      expect(degradedModel!.avgQuality).toBeLessThan(initialQuality);

      // Simulate performance improvement
      for (let i = 0; i < 10; i++) {
        await ModelDatabase.updateMetrics(modelId, {
          quality: 0.95, // Higher quality
          success: true
        });
      }

      const improvedModel = await ModelDatabase.getModel(modelId);

      // Quality should have increased
      expect(improvedModel!.avgQuality).toBeGreaterThan(degradedModel!.avgQuality);
    });
  });

  describe('Research Validation: Data-Driven Routing', () => {
    it('should enable cost-quality tradeoff analysis', async () => {
      const models = await ModelDatabase.getAllModels();

      // Calculate cost-quality ratio for each model
      const ratios = models.map(m => ({
        id: m.id,
        name: m.name,
        quality: m.avgQuality,
        cost: m.costPer1kTokens,
        ratio: m.avgQuality / m.costPer1kTokens
      }));

      // Sort by best ratio (highest quality per cost)
      ratios.sort((a, b) => b.ratio - a.ratio);

      // Best value models should have high quality/cost ratio
      const bestValue = ratios[0];
      expect(bestValue.ratio).toBeGreaterThan(100); // At least 100x quality per cost unit

      console.log('Top 3 value models (quality/cost):');
      for (let i = 0; i < 3; i++) {
        console.log(`  ${ratios[i].name}: ${ratios[i].ratio.toFixed(0)}x`);
      }
    });

    it('should support multi-objective optimization', async () => {
      // Find models that balance quality, latency, and cost
      const models = await ModelDatabase.getAllModels();

      // Normalize metrics to 0-1 scale
      const maxQuality = Math.max(...models.map(m => m.avgQuality));
      const maxLatency = Math.max(...models.map(m => m.avgLatency));
      const maxCost = Math.max(...models.map(m => m.costPer1kTokens));

      const scored = models.map(m => ({
        id: m.id,
        name: m.name,
        // Composite score: maximize quality, minimize latency and cost
        score: (m.avgQuality / maxQuality) * 0.4 +
               (1 - m.avgLatency / maxLatency) * 0.3 +
               (1 - m.costPer1kTokens / maxCost) * 0.3
      }));

      scored.sort((a, b) => b.score - a.score);

      // Best balanced model
      const best = scored[0];
      expect(best.score).toBeGreaterThan(0.5);

      console.log('Top 3 balanced models (quality + speed + cost):');
      for (let i = 0; i < 3; i++) {
        console.log(`  ${scored[i].name}: ${scored[i].score.toFixed(3)}`);
      }
    });
  });
});

// Made with Moe Abdelaziz
