import { NextRequest, NextResponse } from "next/server";
import { ReadableMemory, GatewaySecurity } from "@aix-core";

/**
 * GET /api/agents/[id]/memory/tree
 * Fetches the WikiBrain Memory Tree for an agent.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Security check
    if (!GatewaySecurity.validateRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;
    const tree = await ReadableMemory.getMemoryTree(agentId);

    return NextResponse.json({ success: true, tree });
  } catch (error: unknown) {
    console.error("[Memory Tree API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
