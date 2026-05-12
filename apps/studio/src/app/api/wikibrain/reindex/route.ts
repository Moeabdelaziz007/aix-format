import { NextRequest, NextResponse } from "next/server";
import { indexAgent } from "@aix-core";
import { SovereignHealthService } from "@aix-core";

/**
 * POST /api/wikibrain/reindex
 * Batch re-index all agents in the global registry
 */
export async function POST(req: NextRequest) {
  try {
    // In a real scenario, check admin privileges here.
    const health = new SovereignHealthService();
    const agents = await health.getRegistry();
    let indexed = 0;

    for (const agent of agents) {
      if (agent.yaml) {
        try {
          await indexAgent({
            did: agent.did,
            identity_layer: {
              name: agent.name,
              role: agent.role,
            },
            capabilities: agent.capabilities
          });
          indexed++;
        } catch (e) {
          console.warn(`Failed to index agent ${agent.did}`, e);
        }
      }
    }

    return NextResponse.json({ success: true, indexed });
  } catch (error: any) {
    console.error("[WikiBrain Reindex API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
