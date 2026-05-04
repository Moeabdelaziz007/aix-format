/**
 * ProactiveEvolutionEngine - Self-Evolving Intelligence System
 * 
 * MISSION: Transform reactive → proactive self-evolving
 * - Scans for evolution opportunities BEFORE failure
 * - Security-first with TrustChain validation
 * - Runs background job every 5 minutes
 * 
 * Made with Moe Abdelaziz
 */

import { trustChain } from './trust-chain/index';
import { recordLesson, incrementLoop, updateTrustDelta, getEvolution } from './evolution/tracker';
import { abomScanner } from './mcp-gate';

interface EvolutionTrigger {
  agentDid: string;
  reason: 'failure_pattern' | 'improvement_opportunity' | 'topology_insight' | 'scheduled_scan';
  confidence: number;
  suggestedAction: string;
  timestamp: string;
}

export class ProactiveEvolutionEngine {
  private scanIntervalMs = 5 * 60 * 1000; // 5 minutes
  private intervalId?: NodeJS.Timeout;

  /**
   * E1.3: PROACTIVE SCAN - "What should I learn?"
   * Scans agent for evolution opportunities BEFORE failure
   */
  async proactiveScan(agentDid: string): Promise<EvolutionTrigger | null> {
    const evolution = getEvolution(agentDid);
    
    // 1. Check failure patterns (CRITICAL)
    if (evolution && evolution.lessons.length > 0) {
      const recentFailures = evolution.lessons.filter(l => l.includes('failure')).length;
      if (recentFailures > 2) {
        return {
          agentDid,
          reason: 'failure_pattern',
          confidence: 0.9,
          suggestedAction: 'Reduce exploration rate, focus on proven patterns',
          timestamp: new Date().toISOString()
        };
      }
    }

    // 2. Check improvement trend (PROACTIVE)
    if (evolution && evolution.loops_completed >= 3) {
      const trustDelta = evolution.trust_delta;
      if (trustDelta < -3) {
        return {
          agentDid,
          reason: 'improvement_opportunity',
          confidence: 0.8,
          suggestedAction: 'Trust declining - review recent actions',
          timestamp: new Date().toISOString()
        };
      }
    }

    // 3. Check topology insights (QUANTUM)
    if (evolution && evolution.loops_completed > 10 && evolution.trust_delta > 5) {
      return {
        agentDid,
        reason: 'topology_insight',
        confidence: 0.7,
        suggestedAction: 'High trust - ready for advanced patterns',
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * E1.2: DECISION - Should we evolve NOW?
   * Security-first: checks TrustChain + ABOM safety score
   */
  async shouldEvolveNow(trigger: EvolutionTrigger): Promise<boolean> {
    // RULE 3: ABOM safety score validation
    const safetyScore = await abomScanner.getSafetyScore(trigger.agentDid);
    if (safetyScore < 7) {
      console.warn(`[ProactiveEvolution] Agent ${trigger.agentDid} safety score ${safetyScore} < 7 - evolution blocked`);
      return false;
    }

    // Check confidence threshold
    if (trigger.confidence < 0.7) {
      return false;
    }

    // Rate limiting: max 1 evolution per minute
    const evolution = getEvolution(trigger.agentDid);
    if (evolution) {
      const lastImproved = new Date(evolution.last_improved).getTime();
      const now = Date.now();
      if (now - lastImproved < 60000) {
        return false;
      }
    }

    return true;
  }

  /**
   * EXECUTE: Apply evolution with audit trail
   * Records in TrustChain for security
   */
  async executeEvolution(trigger: EvolutionTrigger): Promise<void> {
    // Record in TrustChain (SECURITY)
    trustChain.append('evolution.executed', trigger.agentDid, trigger);

    // Record lesson
    recordLesson(trigger.agentDid, `Evolution: ${trigger.suggestedAction}`);

    // Increment loop counter
    incrementLoop(trigger.agentDid);

    // Update trust delta based on confidence
    const trustChange = trigger.confidence > 0.8 ? 1 : 0;
    updateTrustDelta(trigger.agentDid, trustChange);

    console.log(`[ProactiveEvolution] ✅ Evolved agent ${trigger.agentDid}: ${trigger.suggestedAction}`);
  }

  /**
   * E1.4: Background job - runs every 5 minutes
   * Scans all active agents for evolution opportunities
   */
  startBackgroundLoop(activeAgentIds: string[]): void {
    console.log('[ProactiveEvolution] 🚀 Starting background loop (every 5 min)');
    
    this.intervalId = setInterval(async () => {
      try {
        console.log(`[ProactiveEvolution] 🔍 Scanning ${activeAgentIds.length} agents...`);
        
        for (const agentDid of activeAgentIds) {
          const trigger = await this.proactiveScan(agentDid);
          
          if (trigger && await this.shouldEvolveNow(trigger)) {
            await this.executeEvolution(trigger);
          }
        }
      } catch (error) {
        console.error('[ProactiveEvolution] ❌ Loop error:', error);
      }
    }, this.scanIntervalMs);
  }

  stopBackgroundLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('[ProactiveEvolution] 🛑 Background loop stopped');
    }
  }
}

export const proactiveEvolutionEngine = new ProactiveEvolutionEngine();

// Made with Bob
