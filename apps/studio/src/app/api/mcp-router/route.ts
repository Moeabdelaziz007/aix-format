import { NextRequest, NextResponse } from "next/server";
import { kv, NS } from "@/lib/redis";
import { scanAgent } from "@/lib/abom-scanner";
import { getRegistry } from "@/lib/registry";
import { calculatePrice, isQuotaExceeded, PI_SCALE, DEFAULT_PRICING } from "@/lib/pricing";

/**
 * MCP Revenue Router — POST /api/mcp-router
 *
 * Flow:
 *  1. Identify user tier & quota
 *  2. Scan target agent ABOM for risk
 *  3. Calculate price & platform fee via Pricing Engine
 *  4. Update quota & track spend metrics
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userId, agentDid, endpointType, tier = "free" } = body;

    if (!userId || !agentDid) {
      return NextResponse.json(
        { error: "Missing required fields: userId, agentDid" },
        { status: 400 }
      );
    }

    // 1. Quota check (Redis-backed)
    const quotaKey = KEYS.mcpQuota(userId);
    const usedQuota = (await kv.get<number>(quotaKey)) ?? 0;
    
    if (isQuotaExceeded(usedQuota, tier)) {
      const config = DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free;
      if (config.cutoff === "hard") {
        return NextResponse.json(
          { error: "Quota exceeded", code: "QUOTA_EXHAUSTED", limit: config.quota }, 
          { status: 429 }
        );
      }
    }

    // 2. Agent risk scoring & Registry lookup
    const registry = await getRegistry();
    const agent = registry.find((a: { did: string }) => a.did === agentDid);
    
    // Default to a neutral score if agent not found or YAML missing
    let riskScore = 50; 
    try {
      if (agent && (agent as any).yaml) {
        const report = scanAgent(JSON.parse((agent as any).yaml));
        riskScore = report.score;
      }
    } catch (e) {
      console.warn(`[MCP Router] Failed to scan agent ${agentDid}, using default risk.`);
    }

    // 3. Price calculation via Unified Engine
    const { totalCost, platformFee, developerShare, riskMultiplier } = calculatePrice(
      tier,
      riskScore,
      endpointType
    );

    // 4. Atomic quota increment
    const newUsed = await kv.incr(quotaKey);

    // 5. Metric tracking (fire-and-forget)
    const spendKey   = `${NS.METRICS}:spend:${userId}`;
    const earningKey = `${NS.METRICS}:earnings:${agentDid}`;
    const globalCallsKey = `${NS.METRICS}:global:calls`;

    void Promise.all([
      kv.incr(globalCallsKey),
      kv.get<number>(spendKey).then((cur) =>
        kv.set(spendKey, ((cur ?? 0) + totalCost * PI_SCALE))
      ),
      kv.get<number>(earningKey).then((cur) =>
        kv.set(earningKey, ((cur ?? 0) + developerShare * PI_SCALE))
      ),
    ]).catch((err) => console.error("[MCP Router] Telemetry Error:", err));

    return NextResponse.json({
      success: true,
      price:    totalCost,
      currency: "Pi",
      quota: {
        used:      newUsed,
        total:     (DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free).quota,
        remaining: (DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free).quota === -1 
          ? -1 
          : (DEFAULT_PRICING[tier] ?? DEFAULT_PRICING.free).quota - newUsed,
      },
      routing: {
        target:    agentDid,
        riskScore: riskScore,
        premium:   riskMultiplier,
      },
    });
  } catch (error) {
    console.error("[MCP Router] Fatal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
