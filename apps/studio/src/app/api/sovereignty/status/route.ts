import { NextRequest, NextResponse } from 'next/server';
import { SovereignGateway as Gateway } from '@aix-core';

/**
 * 🛰️ [SOVEREIGN_API]: /api/sovereignty/status
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Sovereign Health Reporter",
 *   "behavior": "Exposes real-time topological and security metrics from the Gateway.",
 *   "security": "Read-only access to TrustChain metadata."
 * }
 */
export async function GET(req: NextRequest) {
  const gateway = new Gateway();
  const topologyStatus = await gateway.verifyTopology('system-check');
  
  // Real health calculation based on topology score and recent trust chain events
  const health = topologyStatus.score;
  
  const trustChain = (await import('@aix-core')).getTrustChain();
  const actions = await trustChain.getActions('SOV-AGENT-001', 50);
  const currentRound = actions.filter(a => a.action.startsWith('SOV_ROUND_COMPLETE')).length;

  const auditTrail = actions.map(a => ({
    time: new Date(a.timestamp).toLocaleTimeString(),
    event: a.action,
    level: a.action.includes('ERROR') ? 'warning' : 'success'
  }));

  return NextResponse.json({
    health,
    gear: gateway.getSovereignGear('general'),
    currentRound,
    auditTrail,
    timestamp: new Date().toISOString()
  });
}
