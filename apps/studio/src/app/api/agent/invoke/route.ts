import { NextRequest, NextResponse } from "next/server";
import { getGateway } from "@aix-core";

/**
 * POST /api/agent/invoke
 * Invokes an agent via the Sovereign Gateway
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, taskDescription, systemPrompt } = body;

    if (!agentId || !taskDescription) {
      return NextResponse.json({ error: "Missing agentId or taskDescription" }, { status: 400 });
    }

    const gateway = getGateway();
    
    // In a real scenario, we'd pass the systemPrompt to the agent runtime
    // For now, we use the Gateway to run the task
    const result = await gateway.run(agentId, taskDescription);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Agent Invoke API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
