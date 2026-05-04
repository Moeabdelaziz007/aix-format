import { NextRequest, NextResponse } from "next/server";
import { stakeAgent } from "../../../../../../../packages/aix-core/src/economics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, stakerAddress, amount } = body;

    if (!agentId || !stakerAddress || typeof amount !== 'number') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stake = await stakeAgent(agentId, stakerAddress, amount);
    return NextResponse.json({ success: true, stake });
  } catch (error) {
    console.error("Stake API Error:", error);
    return NextResponse.json(
      { error: "Failed to stake" },
      { status: 500 }
    );
  }
}
