import { NextResponse } from "next/server";
import { kv, KEYS, NS } from "@/lib/redis";
import { getRegistry } from "@/lib/registry";

/**
 * GET /api/fleet/metrics
 * Aggregates real-time metrics for the Orchestra Dashboard.
 */
export async function GET() {
  try {
    // 1. Fetch Registry to get all agent DIDs
    const registry = await getRegistry();
    
    // 2. Fetch metrics for each agent in parallel
    const agentMetrics = await Promise.all(
      registry.map(async (agent) => {
        const skillsKey = `agent:${agent.did}:skills`;
        const memoryKey = KEYS.memory(agent.did);
        
        // Count learned skills and session interactions
        const [skills, memoryCount] = await Promise.all([
          kv.smembers<string>(skillsKey),
          kv.lrange(memoryKey, 0, 0).then(list => list.length ? 1 : 0) // Just check if active
        ]);

        return {
          did: agent.did,
          name: agent.name,
          role: agent.role,
          learnedSkillsCount: skills.length,
          status: memoryCount > 0 ? 'active' : 'idle',
          kyc_tier: agent.kyc_tier
        };
      })
    );

    // 3. Global Stats
    const totalSkills = agentMetrics.reduce((acc, a) => acc + a.learnedSkillsCount, 0);
    const activeAgents = agentMetrics.filter(a => a.status === 'active').length;

    return NextResponse.json({
      summary: {
        totalAgents: registry.length,
        activeAgents,
        totalSkillsLearned: totalSkills,
        timestamp: new Date().toISOString()
      },
      agents: agentMetrics
    });

  } catch (error: any) {
    console.error("[Fleet Metrics API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
