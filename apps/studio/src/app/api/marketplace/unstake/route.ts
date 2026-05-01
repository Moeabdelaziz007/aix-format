import { NextRequest, NextResponse } from "next/server";
import { unstakeAgent } from "../../../../../../../packages/aix-core/src/economics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, stakerAddress, amount } = body;

    if (!agentId || !stakerAddress || typeof amount !== 'number') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await unstakeAgent(agentId, stakerAddress, amount);
    if (!success) {
      return NextResponse.json({ error: "Insufficient stake to unstake" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unstake API Error:", error);
    return NextResponse.json(
      { error: "Failed to unstake" },
      { status: 500 }
    );
  }
}
