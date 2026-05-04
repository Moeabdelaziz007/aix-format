import { kv } from './storage/adapter';
import { KEYS, NS } from './storage/keys';
import { getTrustChain } from './trust-chain';
import { getBus } from './bus';

/**
 * AXIOM Sentinel - The Codebase Self-Improvement Intelligence
 * 
 * MISSION: Analyze system-wide patterns and evolve the infrastructure.
 * - Extracts winning strategies from successful tasks.
 * - Identifies structural bottlenecks in the event bus.
 * - Suggests security hardening for failing nodes.
 * 
 * Made with Moe Abdelaziz
 */

export class AxiomSentinel {
  private static instance: AxiomSentinel;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  private constructor() {}

  static getInstance(): AxiomSentinel {
    if (!AxiomSentinel.instance) {
      AxiomSentinel.instance = new AxiomSentinel();
    }
    return AxiomSentinel.instance;
  }

  /**
   * Start the proactive improvement loop
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🛡️ AXIOM Sentinel: Online. Monitoring codebase topology...');

    // Run deep analysis every 10 minutes
    this.intervalId = setInterval(() => this.analyzeSystemHealth(), 10 * 60 * 1000);
  }

  /**
   * Stop the sentinel loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('🛡️ AXIOM Sentinel: Offline.');
  }

  /**
   * Deep Analysis: TrustChain + Bus Patterns
   */
  async analyzeSystemHealth() {
    try {
      console.log('🔍 Sentinel: Mining patterns for self-improvement...');
      
      const insights = await this.generateEvolutionProposals();
      
      if (insights.length > 0) {
        await this.applySystemEvolution(insights);
      }
    } catch (error) {
      console.error('❌ Sentinel Error:', error);
    }
  }

  /**
   * Generate proposals based on real execution data
   */
  private async generateEvolutionProposals(): Promise<string[]> {
    const proposals: string[] = [];
    const trustChain = getTrustChain();
    
    // 1. Get all agents from registry to scan them
    const agents = await kv.get<string[]>(`${NS.REGISTRY}:index`) || [];
    
    for (const agentId of agents) {
      const actions = await trustChain.getActions(agentId, 100);
      
      // Pattern 1: Tool Reliability
      const failures = actions.filter(a => a.action === 'TOOL_FAILURE' || (a.data as any)?.success === false);
      if (failures.length > 5) {
        proposals.push(`TOOL_OPTIMIZATION_REQUIRED:${agentId}:failure_rate_high`);
      }

      // Pattern 2: Repetitive Success (Candidate for Skill Compression)
      const successPatterns = actions.filter(a => a.action === 'TASK_COMPLETE');
      if (successPatterns.length > 10) {
        proposals.push(`SKILL_COMPRESSION_CANDIDATE:${agentId}:stable_pattern_detected`);
      }

      // Pattern 3: Trust Deficit
      const score = await trustChain.getScore(agentId);
      if (score < 3 && actions.length > 10) {
        proposals.push(`SECURITY_HARDENING_REQUIRED:${agentId}:trust_deficit`);
      }
    }
    
    return [...new Set(proposals)]; // Deduplicate
  }

  /**
   * Apply improvements to the live system
   */
  private async applySystemEvolution(proposals: string[]) {
    for (const proposal of proposals) {
      // Avoid re-applying the same evolution if already in learned_patterns
      const existing = await this.getLearnedPatterns();
      if (existing.some(p => JSON.parse(p).pattern === proposal)) continue;

      console.log(`✨ Sentinel: Applying Evolution -> ${proposal}`);
      
      // RULE 3: Log evolution to TrustChain
      const trustChain = getTrustChain();
      await trustChain.append('sentinel', 'SYSTEM_EVOLUTION', {
        proposal,
        timestamp: Date.now()
      });

      // Update a global "Sovereign Knowledge" flag in Redis
      await kv.lpush('axiom:learned_patterns', JSON.stringify({
        pattern: proposal,
        appliedAt: Date.now()
      }));

      // If it's a security deficit, we might want to flag the agent
      if (proposal.includes('SECURITY_HARDENING')) {
        const agentId = proposal.split(':')[1];
        await kv.set(KEYS.frozen(agentId), true);
        console.log(`🚨 Sentinel: Agent ${agentId} frozen due to trust deficit.`);
      }
    }
  }

  /**
   * Helper: Get learned patterns for UI/Documentation
   */
  async getLearnedPatterns(): Promise<string[]> {
    return await kv.lrange('axiom:learned_patterns', 0, -1);
  }
}

export const sentinel = AxiomSentinel.getInstance();

// Made with Moe Abdelaziz
