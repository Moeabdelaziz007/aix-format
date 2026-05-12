import { NextRequest, NextResponse } from "next/server";
import { kv, getRegistry, GatewaySecurity } from "@aix-core";

/**
 * GET /api/space/graph
 * Returns nodes (agents) and edges (connections) for the WorkFlow Canvas.
 */
export async function GET(req: NextRequest) {
  try {
    // Security check
    if (!GatewaySecurity.validateRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await getRegistry();
    const connectionsRaw = await kv.smembers<string>('aix:graph:connections');
    
    const nodes = await Promise.all(agents.map(async a => {
      const freq = await kv.get<number>(`agent:${a.did}:freq`) || 0;
      const status = (a as unknown).status || 'idle';
      
      return {
        id: a.did,
        name: a.name,
        role: a.role,
        status,
        pet: (a as unknown).pet,
        val: 5 + (freq * 2), // Size scales with frequency
        color: status === 'active' ? '#10B981' : status === 'flagged' ? '#EF4444' : '#F59E0B'
      };
    }));

    const edges = connectionsRaw.map((c, i) => {
      const { from, to } = JSON.parse(c);
      return {
        id: `e-${i}`,
        source: from,
        target: to,
        animated: true,
        value: 2 // Connection strength
      };
    });

    return NextResponse.json({ nodes, links: edges });
  } catch (error: unknown) {
    console.error("[Graph API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

