/**
 * 🧠 AIX Wisdom Extractor (v1.0.0)
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Distills raw audit logs into semantic wisdom patterns",
 *   "dynamic_behavior": "Scans TrustChain for success/failure clusters and indexes them",
 *   "topological_weight": "Strategic"
 * }
 * Made with Moe Abdelaziz
 */

import { getTrustChain } from '../trust-chain';
import { SemanticIndex } from './SemanticIndex';
import { kv } from '../storage/adapter';

export class WisdomExtractor {
  private static index = new SemanticIndex();

  /**
   * Scans recent TrustChain actions and extracts wisdom patterns
   */
  static async extract(agentId: string): Promise<{ patternsFound: number; indexed: boolean }> {
    const trustChain = getTrustChain();
    const actions = await trustChain.getActions(agentId, 100);
    let patternsFound = 0;

    if (actions.length < 10) return { patternsFound: 0, indexed: false };

    // 1. Detect Failure Patterns
    const failures = actions.filter(a => (a.data as any)?.success === false);
    if (failures.length > 0) {
      for (const failure of failures) {
        const failureReason = (failure.data as any)?.error || 'Unknown error';
        const context = (failure.data as any)?.input || 'No context';
        
        await this.index.index(
          `wisdom:failure:${failure.auditHash}`,
          'failure_pattern',
          `Agent ${agentId} failed during ${failure.action}. Reason: ${failureReason}. Context: ${JSON.stringify(context)}`,
          { agentId, action: failure.action, type: 'failure', severity: 'high' }
        );
        patternsFound++;
      }
    }

    // 2. Detect Success Paths (Wisdom)
    const successes = actions.filter(a => (a.data as any)?.success === true);
    if (successes.length > 5) {
      // Create a composite success pattern
      const commonActions = successes.map(s => s.action).slice(0, 5).join(' -> ');
      await this.index.index(
        `wisdom:success:${agentId}:${Date.now()}`,
        'success_path',
        `Proven success path for ${agentId}: ${commonActions}`,
        { agentId, type: 'wisdom', efficiency: 1.0 }
      );
      patternsFound++;
    }

    // Update agent's wisdom score
    const currentWisdom = await kv.get<number>(`wisdom:score:${agentId}`) || 0;
    await kv.set(`wisdom:score:${agentId}`, currentWisdom + (patternsFound * 0.1));

    return { patternsFound, indexed: true };
  }
}
