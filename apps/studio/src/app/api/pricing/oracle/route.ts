import { NextRequest, NextResponse } from "next/server";
import { kv, getTotalAgentStake } from "../../../../../../../packages/aix-core/src/economics"
import { BondingCurve } from "../../../../../../../packages/aix-core/src/economics/BondingCurve";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const cacheKey = `aix:pricing:oracle:${agentId}`;
    const cached = await kv.get(cacheKey);
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const totalStake = await getTotalAgentStake(agentId);

    // In a full implementation, these would be agent-specific configurable parameters.
    const basePrice = 1.0;
    const k = 0.5;
    const supplyTarget = 1000;

    const currentPrice = BondingCurve.getCurrentPrice(basePrice, k, supplyTarget, totalStake);

    const responseData = {
      agentId,
      currentPrice,
      priceHistory: [], // Placeholder for actual history tracking
      surgeMultiplier: 1.0,
      trend: 'stable'
    };

    await kv.setex(cacheKey, 60, JSON.stringify(responseData));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Pricing Oracle API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing oracle" },
      { status: 500 }
    );
  }
}
