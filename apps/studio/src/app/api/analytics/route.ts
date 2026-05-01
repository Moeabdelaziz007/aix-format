import { NextRequest, NextResponse } from 'next/server';
import { kv, NS } from '@/lib/storage/redis';

/**
 * GET /api/analytics
 * Fetches real-time metrics for a specific agent or the entire fleet.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const today = new Date().toISOString().split('T')[0];

    if (agentId) {
      const dailyKey = `${NS.METRICS}:${agentId}:${today}`;
      const [calls, latency] = await Promise.all([
        kv.get<number>(`${dailyKey}:calls`),
        kv.get<number>(`${dailyKey}:latency`)
      ]);

      return NextResponse.json({
        agentId,
        calls: calls || 0,
        avgLatency: latency || 0,
        timestamp: new Date().toISOString()
      });
    }

    // Default: Fleet-wide aggregation (Simplified for demonstration)
    return NextResponse.json({
      totalCalls: 8421, // Mocking aggregated for now, would be a sum in production
      avgLatency: "142ms",
      uptime: "99.99%",
      payoutDue: "74.2π"
    });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
