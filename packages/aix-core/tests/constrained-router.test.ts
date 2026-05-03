/**
 * 🔬 ConstrainedRouter Tests
 * 
 * Tests for IPR + Harvard SCORE integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConstrainedRouter, Task, TaskConstraints } from '../src/constrained-router';
import { ModelDatabase } from '../src/model-database';

describe('ConstrainedRouter', () => {
  beforeEach(async () => {
    // Reset model metrics before each test
    await ModelDatabase.resetMetrics();
  });

  describe('findFeasibleModels', () => {
    it('should find models that satisfy all constraints', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000,
        requiresTools: false,
        requiresStreaming: false
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.7,
        maxLatency: 3000,
        maxCost: 0.01
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);

      // Should have evaluated multiple models
      expect(scored.length).toBeGreaterThan(0);

      // Check that feasible models meet all constraints
      const feasible = scored.filter(s => s.feasible);
      for (const model of feasible) {
        expect(model.quality).toBeGreaterThanOrEqual(constraints.qualityThreshold);
        expect(model.latency).toBeLessThanOrEqual(constraints.maxLatency);
        expect(model.cost).toBeLessThanOrEqual(constraints.maxCost);
      }
    });

    it('should filter out models missing required capabilities', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000,
        requiresTools: true, // Requires tool support
        requiresStreaming: false
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.5,
        maxLatency: 5000,
        maxCost: 0.1
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);

      // Models without tool support should be marked infeasible
      const noToolSupport = scored.filter(s => !s.feasible && s.reason?.includes('tool support'));
      expect(noToolSupport.length).toBeGreaterThan(0);
    });

    it('should mark models as infeasible when constraints not met', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000
      };

      // Very strict constraints
      const constraints: TaskConstraints = {
        qualityThreshold: 0.99, // Very high quality
        maxLatency: 100,        // Very low latency
        maxCost: 0.0001         // Very low cost
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);

      // Most models should be infeasible with such strict constraints
      const infeasible = scored.filter(s => !s.feasible);
      expect(infeasible.length).toBeGreaterThan(0);

      // Check that reasons are provided
      for (const model of infeasible) {
        expect(model.reason).toBeDefined();
      }
    });

    it('should sort models by cost (cheapest first)', async () => {
      const task: Task = {
        type: 'text_analysis',
        complexity: 0.3,
        tokenEstimate: 500
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.5,
        maxLatency: 10000,
        maxCost: 0.1
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);
      const feasible = scored.filter(s => s.feasible);

      // Feasible models should be sorted by cost
      for (let i = 1; i < feasible.length; i++) {
        expect(feasible[i].cost).toBeGreaterThanOrEqual(feasible[i - 1].cost);
      }
    });
  });

  describe('selectOptimal', () => {
    it('should select cheapest feasible model', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.7,
        maxLatency: 5000,
        maxCost: 0.01
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);
      const modelId = await ConstrainedRouter.selectOptimal(scored);

      // Should select a model
      expect(modelId).toBeDefined();
      expect(typeof modelId).toBe('string');

      // Selected model should be feasible
      const selected = scored.find(s => s.modelId === modelId);
      expect(selected?.feasible).toBe(true);

      // Should be the cheapest feasible option
      const feasible = scored.filter(s => s.feasible);
      expect(selected?.cost).toBe(feasible[0].cost);
    });

    it('should throw error when no feasible models', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000
      };

      // Impossible constraints
      const constraints: TaskConstraints = {
        qualityThreshold: 1.0,
        maxLatency: 1,
        maxCost: 0.00001
      };

      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);

      await expect(
        ConstrainedRouter.selectOptimal(scored)
      ).rejects.toThrow('No feasible models found');
    });
  });

  describe('predictQuality', () => {
    it('should predict quality based on model and task', async () => {
      const quality = await ConstrainedRouter.predictQuality(
        'code_generation',
        'gpt-4-turbo',
        0.5
      );

      expect(quality).toBeGreaterThanOrEqual(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('should reduce quality for small models on complex tasks', async () => {
      const simpleQuality = await ConstrainedRouter.predictQuality(
        'code_generation',
        'llama-3-8b',
        0.3 // Simple task
      );

      const complexQuality = await ConstrainedRouter.predictQuality(
        'code_generation',
        'llama-3-8b',
        0.9 // Complex task
      );

      // Quality should be lower for complex tasks on small models
      expect(complexQuality).toBeLessThan(simpleQuality);
    });

    it('should return 0 for unknown models', async () => {
      const quality = await ConstrainedRouter.predictQuality(
        'code_generation',
        'unknown-model',
        0.5
      );

      expect(quality).toBe(0);
    });
  });

  describe('route', () => {
    it('should complete full routing pipeline', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000,
        requiresTools: true
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.7,
        maxLatency: 5000,
        maxCost: 0.01
      };

      const result = await ConstrainedRouter.route(task, constraints);

      // Should return complete routing result
      expect(result.modelId).toBeDefined();
      expect(result.quality).toBeGreaterThanOrEqual(constraints.qualityThreshold);
      expect(result.latency).toBeLessThanOrEqual(constraints.maxLatency);
      expect(result.cost).toBeLessThanOrEqual(constraints.maxCost);
      expect(result.feasibleCount).toBeGreaterThan(0);
      expect(result.totalEvaluated).toBeGreaterThan(0);
    });

    it('should optimize for cost within feasible set', async () => {
      const task: Task = {
        type: 'text_analysis',
        complexity: 0.3,
        tokenEstimate: 500
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.6,
        maxLatency: 10000,
        maxCost: 0.1 // High budget
      };

      const result = await ConstrainedRouter.route(task, constraints);

      // Should select a cheaper model even though budget allows expensive ones
      expect(result.cost).toBeLessThan(0.05);
    });
  });

  describe('explainRouting', () => {
    it('should generate human-readable explanation', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.7,
        tokenEstimate: 2000
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.8,
        maxLatency: 3000,
        maxCost: 0.015
      };

      const result = await ConstrainedRouter.route(task, constraints);
      const explanation = ConstrainedRouter.explainRouting(task, constraints, result);

      // Should contain key information
      expect(explanation).toContain('ConstrainedRouter');
      expect(explanation).toContain(task.type);
      expect(explanation).toContain(constraints.qualityThreshold.toString());
      expect(explanation).toContain(result.modelId);
      expect(explanation).toContain('Cheapest model from feasible set');
    });
  });

  describe('Integration: Constraint Satisfaction', () => {
    it('should respect quality threshold τ', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000
      };

      // Test different τ values
      const tauValues = [0.3, 0.5, 0.7, 0.9];

      for (const tau of tauValues) {
        const constraints: TaskConstraints = {
          qualityThreshold: tau,
          maxLatency: 10000,
          maxCost: 0.1
        };

        const result = await ConstrainedRouter.route(task, constraints);
        
        // Selected model must meet quality threshold
        expect(result.quality).toBeGreaterThanOrEqual(tau);
      }
    });

    it('should respect latency constraints', async () => {
      const task: Task = {
        type: 'text_analysis',
        complexity: 0.3,
        tokenEstimate: 500
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.5,
        maxLatency: 2000, // Strict latency
        maxCost: 0.1
      };

      const result = await ConstrainedRouter.route(task, constraints);
      
      // Selected model must meet latency constraint
      expect(result.latency).toBeLessThanOrEqual(constraints.maxLatency);
    });

    it('should respect cost constraints', async () => {
      const task: Task = {
        type: 'text_analysis',
        complexity: 0.3,
        tokenEstimate: 500
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.5,
        maxLatency: 10000,
        maxCost: 0.001 // Very strict cost
      };

      const result = await ConstrainedRouter.route(task, constraints);
      
      // Selected model must meet cost constraint
      expect(result.cost).toBeLessThanOrEqual(constraints.maxCost);
    });

    it('should satisfy ALL constraints simultaneously', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.6,
        tokenEstimate: 1500,
        requiresTools: true
      };

      const constraints: TaskConstraints = {
        qualityThreshold: 0.75,
        maxLatency: 3500,
        maxCost: 0.005
      };

      const result = await ConstrainedRouter.route(task, constraints);
      
      // Must satisfy ALL constraints
      expect(result.quality).toBeGreaterThanOrEqual(constraints.qualityThreshold);
      expect(result.latency).toBeLessThanOrEqual(constraints.maxLatency);
      expect(result.cost).toBeLessThanOrEqual(constraints.maxCost);
    });
  });

  describe('Research Validation: IPR + Harvard SCORE', () => {
    it('should demonstrate cost optimization (IPR finding)', async () => {
      const task: Task = {
        type: 'text_analysis',
        complexity: 0.4,
        tokenEstimate: 800
      };

      // Relaxed constraints (many feasible models)
      const constraints: TaskConstraints = {
        qualityThreshold: 0.6,
        maxLatency: 10000,
        maxCost: 0.1
      };

      const result = await ConstrainedRouter.route(task, constraints);
      const scored = await ConstrainedRouter.findFeasibleModels(task, constraints);
      const feasible = scored.filter(s => s.feasible);

      // Should select cheapest, not highest quality
      const cheapest = feasible[0];
      const highest = feasible.reduce((max, m) => m.quality > max.quality ? m : max, feasible[0]);

      expect(result.modelId).toBe(cheapest.modelId);
      
      // Demonstrate cost savings
      if (cheapest.modelId !== highest.modelId) {
        const savings = ((highest.cost - cheapest.cost) / highest.cost) * 100;
        console.log(`Cost savings: ${savings.toFixed(1)}% by selecting ${cheapest.modelId} over ${highest.modelId}`);
        expect(savings).toBeGreaterThan(0);
      }
    });

    it('should handle dynamic τ adaptation (Harvard SCORE finding)', async () => {
      const task: Task = {
        type: 'code_generation',
        complexity: 0.5,
        tokenEstimate: 1000
      };

      // Simulate different system states (τ values)
      const scenarios = [
        { name: 'ecstatic', tau: 0.9 },
        { name: 'happy', tau: 0.7 },
        { name: 'tired', tau: 0.2 }
      ];

      const results = [];

      for (const scenario of scenarios) {
        const constraints: TaskConstraints = {
          qualityThreshold: scenario.tau,
          maxLatency: 5000,
          maxCost: 0.01
        };

        const result = await ConstrainedRouter.route(task, constraints);
        results.push({ scenario: scenario.name, ...result });
      }

      // Higher τ should select higher quality (and likely more expensive) models
      expect(results[0].quality).toBeGreaterThan(results[2].quality);
      
      // Lower τ should enable cheaper models
      expect(results[2].cost).toBeLessThanOrEqual(results[0].cost);

      console.log('Dynamic τ adaptation:');
      for (const r of results) {
        console.log(`  ${r.scenario}: ${r.modelId} (q=${r.quality.toFixed(2)}, c=${r.cost}π)`);
      }
    });
  });
});

// Made with Bob
