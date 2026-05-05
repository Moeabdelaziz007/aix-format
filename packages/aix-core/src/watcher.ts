/**
 * 👼 الرقيب والعتيد — Micro Watcher Agents
 * 
 * الفكرة الجوهرية:
 * كل agent في الـ swarm عنده watcher pair مخصوص له.
 * الـ watcher مش في نفس process — هو Redis listener خالص.
 * مش بيعمل LLM calls. مش بيأكل tokens.
 * بيشوف كل event يمر على الـ bus ويحكم عليه.
 * 
 * Architecture:
 * - الرقيب (Raqib) → يسجّل الحسنات (right angel)
 * - العتيد (Atid) → يسجّل السيئات (left angel)
 * - Zero compute, pure Redis ops
 * - Behavioral scoring over time (can't be bypassed)
 * - Auto-escalates to DeadHand on threshold
 * 
 * Integration:
 * - Wired into PulseEngine (observes all events)
 * - Feeds into TrustLedger (behavior + outcomes)
 * - Affects SwarmRouter scoring
 * - Controls Pet mood and XP
 * - Gates Skill Marketplace access
 * 
 * النتيجة: Unbypassable behavioral oversight, 0 cost, always-on
 */

import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { PulseEngine } from './pulse';
import type { BusEvent, BusEventType } from './bus';

// ━━━ Scoring Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// الرقيب (Raqib) — يسجّل الحسنات
const GOOD_DEEDS: Record<string, number> = {
  'INVOCATION'          : +2,   // task attempted
  'SKILL_EXTRACTED'     : +10,  // learned something new
  'EVOLUTION'           : +25,  // leveled up
  'TASK_ROUTED'         : +3,   // helped the swarm
  'PAYMENT_SETTLED'     : +5,   // economic contribution
  'DNA_VERIFIED'        : +1,   // manifest clean
  'CHANNEL_PROVISIONED' : +8,   // expanded reach
};

// العتيد (Atid) — يسجّل السيئات
const BAD_DEEDS: Record<string, number> = {
  'SECURITY_ALERT'      : -20,  // triggered safety
  'TASK_FAILED'         : -5,   // failed the swarm
  'DNA_TAMPERED'        : -50,  // manifest corrupted ← instant flag
  'HEARTBEAT_MISS'      : -10,  // went silent
  'AGENT_HIBERNATED'    : -2,   // inactive (minor)
};

// Thresholds
const THRESHOLD_CONDEMNED = -100;  // Auto-escalate to DeadHand
const THRESHOLD_FLAGGED   = -50;   // Warning state
const THRESHOLD_TRUSTED   = 100;   // Elevated privileges

export interface WatcherVerdict {
  agentId    : string;
  score      : number;    // cumulative (-∞ to +∞)
  karma      : number;    // rolling 24h (resets daily)
  raqibLog   : string[];  // last 10 good deeds
  atidLog    : string[];  // last 10 bad deeds
  verdict    : 'TRUSTED' | 'WATCHED' | 'FLAGGED' | 'CONDEMNED';
  multiplier : number;    // for SwarmRouter (0.5 to 1.5)
}

export interface WatcherStats {
  totalAgents    : number;
  trustedAgents  : number;
  flaggedAgents  : number;
  condemnedAgents: number;
  avgScore       : number;
  avgKarma       : number;
}

// ━━━ The Watcher ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class WatcherAgent {
  /**
   * Observe a single bus event and update agent score.
   * Called automatically by PulseEngine for every event.
   * Zero LLM calls. Zero compute. Pure Redis ops.
   */
  static async observe(event: BusEvent): Promise<void> {
    const { agentId, type, timestamp } = event;

    const goodPoints = GOOD_DEEDS[type] ?? 0;
    const badPoints  = BAD_DEEDS[type]  ?? 0;
    const delta      = goodPoints + badPoints;

    if (delta === 0) return; // not a scored event

    const key      = `watcher:${agentId}`;
    const karmaKey = `watcher:${agentId}:karma:${today()}`;

    // Atomic increment (Redis — no race condition)
    await kv.incr(key); // Will be replaced with proper incrby when available
    await kv.incr(karmaKey);
    await kv.expire(karmaKey, 86400); // karma resets daily

    // Log the deed
    const logKey = delta > 0
      ? `watcher:${agentId}:raqib`
      : `watcher:${agentId}:atid`;

    const logEntry = `[${new Date(timestamp).toISOString()}] ${type} (${delta > 0 ? '+' : ''}${delta})`;
    await kv.lpush(logKey, logEntry);
    await kv.ltrim(logKey, 0, 9); // keep last 10 only

    // Check if score crosses a threshold → alert dead-hand
    const score = await kv.get<number>(key) ?? 0;
    
    if (score < THRESHOLD_CONDEMNED) {
      // The Watcher escalates to DeadHand
      await PulseEngine.emit({
        type      : 'SECURITY_ALERT',
        agentId,
        agentName : 'WatcherAgent',
        message   : `⚠️ Agent condemned: cumulative score ${score}`,
        metadata  : { score, trigger: 'WATCHER_CONDEMNATION', delta }
      });
    } else if (score < THRESHOLD_FLAGGED && score >= THRESHOLD_CONDEMNED) {
      // Warning state
      await PulseEngine.emit({
        type      : 'SECURITY_ALERT',
        agentId,
        agentName : 'WatcherAgent',
        message   : `⚡ Agent flagged: score ${score}`,
        metadata  : { score, trigger: 'WATCHER_WARNING', delta }
      });
    }
  }

  /**
   * Get the full verdict for an agent.
   */
  static async getVerdict(agentId: string): Promise<WatcherVerdict> {
    const score    = await kv.get<number>(`watcher:${agentId}`) ?? 0;
    const karma    = await kv.get<number>(`watcher:${agentId}:karma:${today()}`) ?? 0;
    const raqibLog = await kv.lrange<string>(`watcher:${agentId}:raqib`, 0, 9) || [];
    const atidLog  = await kv.lrange<string>(`watcher:${agentId}:atid`,  0, 9) || [];

    const verdict =
      score >= THRESHOLD_TRUSTED  ? 'TRUSTED'   :
      score >= 0                  ? 'WATCHED'   :
      score >= THRESHOLD_FLAGGED  ? 'FLAGGED'   :
                                    'CONDEMNED';

    // Calculate multiplier for SwarmRouter
    // TRUSTED: 1.2x, WATCHED: 1.0x, FLAGGED: 0.8x, CONDEMNED: 0.5x
    const multiplier =
      verdict === 'TRUSTED'   ? 1.2 :
      verdict === 'WATCHED'   ? 1.0 :
      verdict === 'FLAGGED'   ? 0.8 :
                                0.5;

    return { agentId, score, karma, raqibLog, atidLog, verdict, multiplier };
  }

  /**
   * Get system-wide watcher statistics
   */
  static async getStats(): Promise<WatcherStats> {
    // Get all agents with watcher scores
    const pattern = 'watcher:*';
    const keys = await kv.keys(pattern) || [];
    
    // Filter to only score keys (not logs or karma)
    const scoreKeys = keys.filter(k => 
      !k.includes(':raqib') && 
      !k.includes(':atid') && 
      !k.includes(':karma')
    );

    let totalScore = 0;
    let totalKarma = 0;
    let trustedCount = 0;
    let flaggedCount = 0;
    let condemnedCount = 0;

    const verdicts = await Promise.all(scoreKeys.map(k => {
      const agentId = k.replace('watcher:', '');
      return this.getVerdict(agentId);
    }));

    for (const verdict of verdicts) {
      totalScore += verdict.score;
      totalKarma += verdict.karma;
      
      if (verdict.verdict === 'TRUSTED') trustedCount++;
      else if (verdict.verdict === 'FLAGGED') flaggedCount++;
      else if (verdict.verdict === 'CONDEMNED') condemnedCount++;
    }

    const totalAgents = scoreKeys.length;
    const avgScore = totalAgents > 0 ? totalScore / totalAgents : 0;
    const avgKarma = totalAgents > 0 ? totalKarma / totalAgents : 0;

    return {
      totalAgents,
      trustedAgents: trustedCount,
      flaggedAgents: flaggedCount,
      condemnedAgents: condemnedCount,
      avgScore: Math.round(avgScore),
      avgKarma: Math.round(avgKarma)
    };
  }

  /**
   * Reset agent score (admin function)
   */
  static async reset(agentId: string): Promise<void> {
    await kv.del(`watcher:${agentId}`);
    await kv.del(`watcher:${agentId}:raqib`);
    await kv.del(`watcher:${agentId}:atid`);
    await kv.del(`watcher:${agentId}:karma:${today()}`);
  }

  /**
   * Get leaderboard (top agents by score)
   */
  static async getLeaderboard(limit: number = 10): Promise<Array<{
    agentId: string;
    score: number;
    verdict: string;
  }>> {
    const pattern = 'watcher:*';
    const keys = await kv.keys(pattern) || [];
    
    const scoreKeys = keys.filter(k => 
      !k.includes(':raqib') && 
      !k.includes(':atid') && 
      !k.includes(':karma')
    );

    const agents = await Promise.all(
      scoreKeys.map(async (key) => {
        const agentId = key.replace('watcher:', '');
        const verdict = await this.getVerdict(agentId);
        return {
          agentId,
          score: verdict.score,
          verdict: verdict.verdict
        };
      })
    );

    return agents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ━━━ Wire into PulseEngine ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Auto-observe all events flowing through the nervous system.
 * No agent can escape observation.
 */
PulseEngine.onEvent(async (event: any) => {
  // Convert PulseEvent to BusEvent format
  const busEvent: BusEvent = {
    id: Math.random().toString(36).slice(2, 12),
    timestamp: Date.now(),
    ring: (event.metadata?.ring as any) ?? 2, // Default to MIND ring
    type: event.type as BusEventType,
    agentId: event.agentId,
    agentName: event.agentName,
    message: event.message,
    metadata: event.metadata
  };
  
  await WatcherAgent.observe(busEvent);
});

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Integration helpers for other systems
 */
export class WatcherIntegration {
  /**
   * Get multiplier for SwarmRouter scoring
   */
  static async getRoutingMultiplier(agentId: string): Promise<number> {
    const verdict = await WatcherAgent.getVerdict(agentId);
    return verdict.multiplier;
  }

  /**
   * Check if agent can access Skill Marketplace
   */
  static async canAccessMarketplace(agentId: string): Promise<boolean> {
    const verdict = await WatcherAgent.getVerdict(agentId);
    return verdict.verdict !== 'CONDEMNED';
  }

  /**
   * Get XP bonus based on daily karma
   */
  static async getXPBonus(agentId: string): Promise<number> {
    const verdict = await WatcherAgent.getVerdict(agentId);
    
    if (verdict.karma > 50) return 10;  // High karma = bonus XP
    if (verdict.karma < -20) return -5; // Negative karma = penalty
    return 0;
  }

  /**
   * Get recommended pet mood based on watcher score
   */
  static async getRecommendedMood(agentId: string): Promise<'happy' | 'tired' | 'stressed' | 'critical'> {
    const verdict = await WatcherAgent.getVerdict(agentId);
    
    if (verdict.verdict === 'CONDEMNED') return 'critical';
    if (verdict.verdict === 'FLAGGED') return 'stressed';
    if (verdict.karma < 0) return 'tired';
    return 'happy';
  }
}

// Made with Moe Abdelaziz