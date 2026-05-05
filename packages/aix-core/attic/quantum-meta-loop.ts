/**
 * AIX Quantum Topology Meta-Loop Engine
 * 
 * QUANTUM PHILOSOPHY:
 * "The system doesn't just improve - it observes itself improving,
 *  then improves the way it observes itself improving."
 * 
 * LOOP ARCHITECTURE:
 * Layer 0: Agent executes task (Gateway/Runtime)
 * Layer 1: Agent reviews own performance (AgentSelfReview)
 * Layer 2: Meta-loop reviews the review process itself (THIS FILE)
 * Layer 3: Topology analyzer finds patterns across ALL agents
 * Layer 4: Quantum optimizer suggests parallel evolution paths
 * 
 * TOPOLOGY CONCEPT:
 * We don't just track individual agent improvements.
 * We track the RELATIONSHIPS between improvements across agents.
 * If Agent A learns X and Agent B learns Y, what emerges at the intersection?
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { AgentSelfReview, SelfReviewRecord } from './meta-self-review';
import { CuriosityEngine } from './curiosity-engine';

/**
 * Meta-pattern discovered across multiple agents
 */
export interface MetaPattern {
  patternId: string;
  patternType: 'improvement' | 'failure' | 'innovation' | 'convergence';
  agentsInvolved: string[];
  description: string;
  confidence: number; // 0-1
  discoveredAt: number;
  
  // Topology data
  connections: Array<{
    fromAgent: string;
    toAgent: string;
    relationshipType: 'similar' | 'complementary' | 'divergent';
    strength: number; // 0-1
  }>;
}

/**
 * Quantum state: Multiple possible evolution paths
 */
export interface QuantumEvolutionPath {
  pathId: string;
  agentId: string;
  probability: number; // 0-1 (quantum superposition)
  
  // Possible futures
  scenarios: Array<{
    scenarioId: string;
    description: string;
    expectedOutcome: 'breakthrough' | 'incremental' | 'risky' | 'safe';
    requiredActions: string[];
    estimatedImpact: number; // 0-10
  }>;
  
  // Collapse function: Which path to take?
  recommendedScenario: string;
  collapseReason: string;
}

/**
 * Cross-agent topology graph
 */
export interface TopologyGraph {
  nodes: Array<{
    agentId: string;
    currentState: {
      avgScore: number;
      improvementTrend: 'up' | 'down' | 'stable';
      explorationRate: number;
      safetyScore: number;
    };
  }>;
  
  edges: Array<{
    from: string;
    to: string;
    relationshipType: 'learns_from' | 'competes_with' | 'collaborates_with';
    strength: number;
  }>;
  
  clusters: Array<{
    clusterId: string;
    members: string[];
    sharedPatterns: string[];
    emergentBehavior?: string;
  }>;
}

/**
 * Layer 2: Meta-Loop Observer
 * Watches how agents review themselves and improves the review process
 */
export class MetaLoopObserver {
  /**
   * Analyze quality of self-reviews across agents
   * Are agents being too harsh? Too lenient? Missing patterns?
   */
  static async analyzeReviewQuality(agentIds: string[]): Promise<{
    overallQuality: number;
    insights: string[];
    recommendations: string[];
  }> {
    const allReviews: SelfReviewRecord[] = [];
    
    for (const agentId of agentIds) {
      const reviews = await AgentSelfReview.getSelfReviewHistory(agentId, 10);
      allReviews.push(...reviews);
    }

    if (allReviews.length === 0) {
      return {
        overallQuality: 0,
        insights: ['No review data available'],
        recommendations: ['Start collecting self-review data'],
      };
    }

    // Check for review patterns
    const insights: string[] = [];
    const recommendations: string[] = [];

    // 1. Are agents being realistic in self-evaluation?
    const avgSelfScore = allReviews.reduce((sum, r) => sum + r.evaluation.overall, 0) / allReviews.length;
    if (avgSelfScore > 8.5) {
      insights.push('Agents may be overconfident (avg self-score: ' + avgSelfScore.toFixed(1) + ')');
      recommendations.push('Introduce external validation to calibrate self-assessment');
    } else if (avgSelfScore < 5.0) {
      insights.push('Agents may be too self-critical (avg self-score: ' + avgSelfScore.toFixed(1) + ')');
      recommendations.push('Encourage recognition of strengths alongside weaknesses');
    }

    // 2. Are improvement plans being followed?
    const plansWithNewTools = allReviews.filter(r => r.usedNewTool).length;
    const explorationRate = plansWithNewTools / allReviews.length;
    if (explorationRate < 0.2) {
      insights.push('Low exploration rate: ' + (explorationRate * 100).toFixed(0) + '% trying new tools');
      recommendations.push('Increase curiosity rewards to encourage exploration');
    }

    // 3. Are safety concerns being addressed?
    const unsafeReviews = allReviews.filter(r => !r.safeToEvolve).length;
    const safetyRate = 1 - (unsafeReviews / allReviews.length);
    if (safetyRate < 0.7) {
      insights.push('Safety concerns in ' + unsafeReviews + '/' + allReviews.length + ' reviews');
      recommendations.push('Review safety constraints - may be too restrictive or agents need guidance');
    }

    const overallQuality = (avgSelfScore / 10 + explorationRate + safetyRate) / 3;

    return {
      overallQuality,
      insights,
      recommendations,
    };
  }

  /**
   * Detect if review process itself needs improvement
   */
  static async detectReviewProcessIssues(agentId: string): Promise<{
    hasIssues: boolean;
    issues: string[];
    suggestedFixes: string[];
  }> {
    const reviews = await AgentSelfReview.getSelfReviewHistory(agentId, 20);
    const issues: string[] = [];
    const suggestedFixes: string[] = [];

    if (reviews.length < 5) {
      return {
        hasIssues: false,
        issues: ['Insufficient data for meta-analysis'],
        suggestedFixes: ['Continue collecting review data'],
      };
    }

    // Check for stagnation in self-scores
    const recentScores = reviews.slice(0, 5).map(r => r.evaluation.overall);
    const variance = this.calculateVariance(recentScores);
    if (variance < 0.5) {
      issues.push('Self-scores show no variance (stagnant self-assessment)');
      suggestedFixes.push('Introduce new evaluation dimensions or external benchmarks');
    }

    // Check if improvement plans are generic
    const plans = reviews.map(r => r.improvementPlan.try);
    const uniquePlans = new Set(plans).size;
    if (uniquePlans < plans.length * 0.5) {
      issues.push('Improvement plans are repetitive (' + uniquePlans + '/' + plans.length + ' unique)');
      suggestedFixes.push('Encourage more creative and specific improvement strategies');
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      suggestedFixes,
    };
  }

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
  }
}

/**
 * Layer 3: Topology Analyzer
 * Finds patterns and relationships across ALL agents
 */
export class TopologyAnalyzer {
  /**
   * Build topology graph of agent relationships
   */
  static async buildTopologyGraph(agentIds: string[]): Promise<TopologyGraph> {
    const nodes = await Promise.all(
      agentIds.map(async (agentId) => {
        const avgScores = await AgentSelfReview.getAverageScores(agentId);
        const trend = await AgentSelfReview.getImprovementTrend(agentId);
        const curiosityScore = await CuriosityEngine.getCuriosityScore(agentId);
        const safetyCheck = await AgentSelfReview.isSafeToEvolve(agentId);

        return {
          agentId,
          currentState: {
            avgScore: avgScores?.overall || 0,
            improvementTrend: trend?.trend || 'stable',
            explorationRate: curiosityScore / 1000, // Normalize
            safetyScore: safetyCheck.safetyScore,
          },
        };
      })
    );

    // Find edges (relationships between agents)
    const edges: TopologyGraph['edges'] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        // Calculate similarity
        const scoreDiff = Math.abs(nodeA.currentState.avgScore - nodeB.currentState.avgScore);
        const similarity = 1 - (scoreDiff / 10);

        if (similarity > 0.7) {
          edges.push({
            from: nodeA.agentId,
            to: nodeB.agentId,
            relationshipType: 'learns_from',
            strength: similarity,
          });
        }
      }
    }

    // Detect clusters (groups of similar agents)
    const clusters = this.detectClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  /**
   * Discover meta-patterns across agents
   */
  static async discoverMetaPatterns(agentIds: string[]): Promise<MetaPattern[]> {
    const patterns: MetaPattern[] = [];
    const allReviews = new Map<string, SelfReviewRecord[]>();

    // Collect all reviews
    for (const agentId of agentIds) {
      const reviews = await AgentSelfReview.getSelfReviewHistory(agentId, 20);
      allReviews.set(agentId, reviews);
    }

    // Pattern 1: Convergent improvement (multiple agents improving similarly)
    const improvingAgents = agentIds.filter(async (id) => {
      const trend = await AgentSelfReview.getImprovementTrend(id);
      return trend?.isImproving;
    });

    if (improvingAgents.length >= 3) {
      patterns.push({
        patternId: 'convergent-improvement-' + Date.now(),
        patternType: 'convergence',
        agentsInvolved: improvingAgents,
        description: `${improvingAgents.length} agents showing simultaneous improvement`,
        confidence: 0.8,
        discoveredAt: Date.now(),
        connections: improvingAgents.slice(0, -1).map((from, i) => ({
          fromAgent: from,
          toAgent: improvingAgents[i + 1],
          relationshipType: 'similar' as const,
          strength: 0.75,
        })),
      });
    }

    // Pattern 2: Innovation burst (agent trying many new tools)
    for (const [agentId, reviews] of allReviews) {
      const recentNewTools = reviews.slice(0, 5).filter(r => r.usedNewTool).length;
      if (recentNewTools >= 4) {
        patterns.push({
          patternId: 'innovation-burst-' + agentId + '-' + Date.now(),
          patternType: 'innovation',
          agentsInvolved: [agentId],
          description: `Agent ${agentId} in innovation burst (${recentNewTools}/5 reviews with new tools)`,
          confidence: 0.9,
          discoveredAt: Date.now(),
          connections: [],
        });
      }
    }

    return patterns;
  }

  private static detectClusters(
    nodes: TopologyGraph['nodes'],
    edges: TopologyGraph['edges']
  ): TopologyGraph['clusters'] {
    // Simple clustering: group nodes with strong connections
    const clusters: TopologyGraph['clusters'] = [];
    const visited = new Set<string>();

    for (const node of nodes) {
      if (visited.has(node.agentId)) continue;

      const cluster: string[] = [node.agentId];
      visited.add(node.agentId);

      // Find connected nodes
      const connectedEdges = edges.filter(
        e => (e.from === node.agentId || e.to === node.agentId) && e.strength > 0.7
      );

      for (const edge of connectedEdges) {
        const otherId = edge.from === node.agentId ? edge.to : edge.from;
        if (!visited.has(otherId)) {
          cluster.push(otherId);
          visited.add(otherId);
        }
      }

      if (cluster.length > 1) {
        clusters.push({
          clusterId: 'cluster-' + Date.now() + '-' + clusters.length,
          members: cluster,
          sharedPatterns: [],
        });
      }
    }

    return clusters;
  }
}

/**
 * Layer 4: Quantum Optimizer
 * Suggests parallel evolution paths (quantum superposition)
 */
export class QuantumOptimizer {
  /**
   * Generate quantum evolution paths for an agent
   * Multiple possible futures in superposition
   */
  static async generateEvolutionPaths(agentId: string): Promise<QuantumEvolutionPath> {
    const reviews = await AgentSelfReview.getSelfReviewHistory(agentId, 10);
    const avgScores = await AgentSelfReview.getAverageScores(agentId);
    const trend = await AgentSelfReview.getImprovementTrend(agentId);
    const safetyCheck = await AgentSelfReview.isSafeToEvolve(agentId);

    // Generate multiple scenarios based on current state
    const scenarios: QuantumEvolutionPath['scenarios'] = [];

    // Scenario 1: Conservative improvement (safe path)
    scenarios.push({
      scenarioId: 'conservative',
      description: 'Continue current approach with minor optimizations',
      expectedOutcome: 'safe',
      requiredActions: [
        'Maintain current exploration rate',
        'Focus on refining existing skills',
        'Incremental improvements only',
      ],
      estimatedImpact: 3,
    });

    // Scenario 2: Aggressive exploration (risky path)
    if (safetyCheck.safe && (avgScores?.overall || 0) > 6.0) {
      scenarios.push({
        scenarioId: 'aggressive',
        description: 'Dramatically increase exploration and try radical new approaches',
        expectedOutcome: 'risky',
        requiredActions: [
          'Double curiosity rewards',
          'Try 3+ new tools per task',
          'Experiment with unconventional solutions',
        ],
        estimatedImpact: 8,
      });
    }

    // Scenario 3: Breakthrough path (high risk, high reward)
    if (trend?.isImproving && reviews.some(r => r.patternDiscovery)) {
      scenarios.push({
        scenarioId: 'breakthrough',
        description: 'Leverage discovered patterns for breakthrough innovation',
        expectedOutcome: 'breakthrough',
        requiredActions: [
          'Focus on pattern-based solutions',
          'Combine multiple discovered patterns',
          'Share patterns with other agents',
        ],
        estimatedImpact: 10,
      });
    }

    // Scenario 4: Recovery path (if declining)
    if (trend?.trend === 'down') {
      scenarios.push({
        scenarioId: 'recovery',
        description: 'Return to basics and rebuild fundamentals',
        expectedOutcome: 'incremental',
        requiredActions: [
          'Review past successful approaches',
          'Reduce complexity',
          'Focus on safety and correctness',
        ],
        estimatedImpact: 5,
      });
    }

    // Calculate probabilities (quantum superposition)
    const totalImpact = scenarios.reduce((sum, s) => sum + s.estimatedImpact, 0);
    const probabilities = scenarios.map(s => s.estimatedImpact / totalImpact);

    // Recommend scenario (collapse the wave function)
    let recommendedScenario = 'conservative';
    let collapseReason = 'Default safe path';

    if (safetyCheck.safe && (avgScores?.overall || 0) > 7.0 && trend?.isImproving) {
      recommendedScenario = 'breakthrough';
      collapseReason = 'Agent is performing well and safe to push boundaries';
    } else if (trend?.trend === 'down') {
      recommendedScenario = 'recovery';
      collapseReason = 'Agent showing decline, needs to rebuild fundamentals';
    } else if ((avgScores?.overall || 0) > 6.0 && safetyCheck.safe) {
      recommendedScenario = 'aggressive';
      collapseReason = 'Agent is stable enough for increased exploration';
    }

    return {
      pathId: 'quantum-path-' + agentId + '-' + Date.now(),
      agentId,
      probability: probabilities[scenarios.findIndex(s => s.scenarioId === recommendedScenario)] || 0.25,
      scenarios,
      recommendedScenario,
      collapseReason,
    };
  }

  /**
   * Collapse quantum state: Choose the best evolution path
   */
  static async collapseQuantumState(path: QuantumEvolutionPath): Promise<{
    chosenScenario: QuantumEvolutionPath['scenarios'][0];
    actionPlan: string[];
  }> {
    const chosenScenario = path.scenarios.find(s => s.scenarioId === path.recommendedScenario);
    
    if (!chosenScenario) {
      throw new Error('Recommended scenario not found in quantum path');
    }

    return {
      chosenScenario,
      actionPlan: chosenScenario.requiredActions,
    };
  }
}

/**
 * Unified Quantum Meta-Loop Engine
 * Orchestrates all layers
 */
export class QuantumMetaLoop {
  /**
   * Run complete meta-loop cycle for all agents
   */
  static async runMetaCycle(agentIds: string[]): Promise<{
    layer2: Awaited<ReturnType<typeof MetaLoopObserver.analyzeReviewQuality>>;
    layer3: {
      topology: TopologyGraph;
      patterns: MetaPattern[];
    };
    layer4: Map<string, QuantumEvolutionPath>;
  }> {
    // Layer 2: Observe review quality
    const layer2 = await MetaLoopObserver.analyzeReviewQuality(agentIds);

    // Layer 3: Analyze topology and discover patterns
    const topology = await TopologyAnalyzer.buildTopologyGraph(agentIds);
    const patterns = await TopologyAnalyzer.discoverMetaPatterns(agentIds);

    // Layer 4: Generate quantum evolution paths
    const layer4 = new Map<string, QuantumEvolutionPath>();
    for (const agentId of agentIds) {
      const path = await QuantumOptimizer.generateEvolutionPaths(agentId);
      layer4.set(agentId, path);
    }

    return {
      layer2,
      layer3: { topology, patterns },
      layer4,
    };
  }
}

// Made with Moe Abdelaziz
