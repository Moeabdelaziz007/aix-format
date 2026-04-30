import { NextRequest, NextResponse } from "next/server";
import { kv, NS, TTL } from "../../../../core/storage/redis.ts";
import { scanAgent } from "../../../../../../core/abom-scanner";
import { getRegistry } from "@/lib/registry";

// Internal scaling for currency to avoid floating point issues (1 = 0.000001 Pi)
const PI_SCALE = 1_000_000;

interface PricingConfig {
  base_price: number;
  platform_fee: number;
  quota: number;
  cutoff: "hard" | "grace" | "soft";
}

const DEFAULT_PRICING: Record<string, PricingConfig> = {
  free: { base_price: 0, platform_fee: 0.20, quota: 100, cutoff: "hard" },
  builder: { base_price: 0.005, platform_fee: 0.20, quota: 1000, cutoff: "hard" },
  pro: { base_price: 0.01, platform_fee: 0.10, quota: 10000, cutoff: "grace" },
  enterprise: { base_price: 0.05, platform_fee: 0.05, quota: -1, cutoff: "soft" }
};

const RISK_PREMIUMS = [
  { min: 90, multiplier: 0.0 },
  { min: 70, multiplier: 0.1 },
  { min: 40, multiplier: 0.25 },
  { min: 0, multiplier: 0.5 }
];

/**
 * MCP Revenue Router
 * POST /api/mcp-router
 * 
 * Flow:
 * 1. Identify User Tier & Quota
 * 2. Scan Target Agent ABOM for Risk
 * 3. Calculate Price & Fee
 * 4. Update Quota & Track Metrics
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, agentDid, endpointType, tier = "free" } = await req.json();

    if (!userId || !agentDid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get Pricing Configuration
    const config = DEFAULT_PRICING[tier] || DEFAULT_PRICING.free;
    const quotaKey = `${NS.REVENUE}:quota:${userId}`;

    // 2. Check Quota (Redis-backed)
    const usedQuota = (await kv.get<number>(quotaKey)) || 0;
    if (config.quota !== -1 && usedQuota >= config.quota) {
      if (config.cutoff === "hard") {
        return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
      }
    }

    // 3. Resolve Agent & Calculate Risk Premium
    const registry = await getRegistry();
    const agent = registry.find(a => a.did === agentDid);
    const abomReport = agent ? scanAgent(JSON.parse(agent.yaml)) : { score: 50 }; // Default to medium risk if unknown
    
    const riskMultiplier = RISK_PREMIUMS.find(p => abomReport.score >= p.min)?.multiplier || 0;

    // 4. Calculate Final Price (Formula from Spec)
    // Pt = (Bp * Mc) * (1 + Rp)
    const complexityMap: Record<string, number> = { stdio: 1.0, http: 1.2, sse: 1.5 };
    const complexityMultiplier = complexityMap[endpointType] || 1.0;
    
    const baseCost = config.base_price * complexityMultiplier;
    const totalCost = baseCost * (1 + riskMultiplier);
    
    const platformFee = totalCost * config.platform_fee;
    const developerShare = totalCost - platformFee;

    // 5. Atomic Update in Redis
    const newUsed = await kv.incr(quotaKey);
    
    // 6. Track Metrics
    const spendKey = `${NS.REVENUE}:spend:${userId}`;
    const devEarningKey = `${NS.REVENUE}:earnings:${agentDid}`;
    
    // Store in scaled integers to prevent float drifts
    await Promise.all([
      kv.incr(`${NS.REVENUE}:total_calls`),
      kv.exists(spendKey).then(async (exists) => {
          const currentSpend = (await kv.get<number>(spendKey)) || 0;
          await kv.set(spendKey, currentSpend + (totalCost * PI_SCALE));
      }),
      kv.exists(devEarningKey).then(async (exists) => {
          const currentEarnings = (await kv.get<number>(devEarningKey)) || 0;
          await kv.set(devEarningKey, currentEarnings + (developerShare * PI_SCALE));
      })
    ]);

    return NextResponse.json({
      success: true,
      price: totalCost,
      currency: "Pi",
      quota: {
        used: newUsed,
        total: config.quota,
        remaining: config.quota === -1 ? -1 : config.quota - newUsed
      },
      routing: {
        target: agentDid,
        riskScore: abomReport.score,
        premium: riskMultiplier
      }
    });

  } catch (error) {
    console.error("[MCP Router] Execution Error:", error);
    return NextResponse.json({ error: "Internal Router Error" }, { status: 500 });
  }
}
