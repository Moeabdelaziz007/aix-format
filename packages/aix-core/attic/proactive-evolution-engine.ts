import { z } from 'zod';
import { getTrustChain } from './trust-chain';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { abomScanner } from './mcp-gate';

/**
 * ProactiveEvolutionEngine - Sovereign Self-Evolving Intelligence
 * MISSION: Transform reactive → proactive self-evolving
 * 
 * Made with Moe Abdelaziz
 */

// RULE 1: Evolution Trigger Schema
export const EvolutionTriggerSchema = z.object({
  agentDid: z.string(),
  reason: z.enum(['failure_pattern', 'improvement_opportunity', 'topology_insight', 'scheduled_scan']),
  confidence: z.number().min(0).max(1),
  suggestedAction: z.string().min(5),
  timestamp: z.string().datetime(),
});

export type EvolutionTrigger = z.infer<typeof EvolutionTriggerSchema>;

export class ProactiveEvolutionEngine {
  private scanIntervalMs = 5 * 60 * 1000; // 5 minutes
  private intervalId?: NodeJS.Timeout;

  /**
   * E1.3: PROACTIVE SCAN
   * Uses Redis state to find improvement vectors
   */
  async proactiveScan(agentDid: string): Promise<EvolutionTrigger | null> {
    const evolution: any = await kv.get(KEYS.agentEvolution(agentDid)) || { lessons: [], loops_completed: 0, trust_delta: 0 };
    
    // 1. Check failure patterns
    const recentFailures = evolution.lessons.filter((l: string) => l.toLowerCase().includes('failure')).length;
    if (recentFailures > 2) {
      return EvolutionTriggerSchema.parse({
        agentDid,
        reason: 'failure_pattern',
        confidence: 0.9,
        suggestedAction: 'Isolate failing topology, fallback to secure primitives',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Trust Decline Check
    if (evolution.loops_completed >= 3 && evolution.trust_delta < -3) {
      return EvolutionTriggerSchema.parse({
        agentDid,
        reason: 'improvement_opportunity',
        confidence: 0.8,
        suggestedAction: 'Trust deficit detected - initiating identity re-verification',
        timestamp: new Date().toISOString()
      });
    }

    return null;
  }

  /**
   * E1.2: DECISION - Should we evolve NOW?
   */
  async shouldEvolveNow(trigger: EvolutionTrigger): Promise<boolean> {
    // RULE 0: Safety check
    const safetyScore = await abomScanner.getSafetyScore(trigger.agentDid);
    if (safetyScore < 7) return false;

    // Rate limiting via Redis
    const lastEvo = await kv.get<number>(`evo:last:${trigger.agentDid}`);
    if (lastEvo && (Date.now() - lastEvo < 60000)) return false;

    return trigger.confidence >= 0.7;
  }

  /**
   * EXECUTE: Apply evolution with audit trail (RULE 3)
   */
  async executeEvolution(trigger: EvolutionTrigger): Promise<void> {
    // RULE 3: Secure Audit Trail
    const trustChain = getTrustChain();
    const auditHash = await trustChain.append(trigger.agentDid, 'EVOLUTION_STEP', {
      reason: trigger.reason,
      action: trigger.suggestedAction,
      confidence: trigger.confidence
    });

    // Persist Lesson in Redis
    const evolution: any = await kv.get(KEYS.agentEvolution(trigger.agentDid)) || { lessons: [], loops_completed: 0, trust_delta: 0 };
    evolution.lessons.push(`[${auditHash.slice(0,8)}] ${trigger.suggestedAction}`);
    evolution.loops_completed++;
    evolution.last_improved = Date.now();
    
    await kv.set(KEYS.agentEvolution(trigger.agentDid), evolution);
    await kv.set(`evo:last:${trigger.agentDid}`, Date.now());

    console.log(`[ProactiveEvolution] ✅ Sovereign Evolution Recorded: ${auditHash}`);
  }

  /**
   * Background job
   */
  startBackgroundLoop(activeAgentIds: string[]): void {
    console.log('[ProactiveEvolution] 🚀 Sovereign Loop Active (5 min)');
    this.intervalId = setInterval(async () => {
      for (const agentDid of activeAgentIds) {
        try {
          const trigger = await this.proactiveScan(agentDid);
          if (trigger && await this.shouldEvolveNow(trigger)) {
            await this.executeEvolution(trigger);
          }
        } catch (e) {
          console.error(`[ProactiveEvolution] Failed for ${agentDid}:`, e);
        }
      }
    }, this.scanIntervalMs);
  }

  stopBackgroundLoop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

export const proactiveEvolutionEngine = new ProactiveEvolutionEngine();

// Made with Moe Abdelaziz
