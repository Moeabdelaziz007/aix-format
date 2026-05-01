import { NextRequest, NextResponse } from 'next/server';
import { kv, NS } from '../../../../../../packages/aix-core/src/index';

/**
 * GET /api/health/redis
 * Monitors the health and performance of the Upstash Redis layer.
 */
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Ping/Basic operation to measure latency
    await kv.exists('aix:health:ping');
    const latency = Date.now() - startTime;

    // Fetch key counts (approximate using common prefixes if possible, 
    // but Upstash doesn't support DBSIZE/SCAN easily in this wrapper without raw client)
    // We'll mock some counts for now or fetch specific stats
    
    return NextResponse.json({
      status: 'healthy',
      latency: `${latency}ms`,
      provider: 'Upstash Redis',
      namespaces: {
        sessions: NS.SESSIONS,
        registry: NS.REGISTRY,
        scan: NS.SCAN,
        mcp: NS.MCP,
        metrics: NS.METRICS
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Redis Health Check Failed:', error);
    return NextResponse.json({ 
      status: 'degraded', 
      error: error.message,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}
