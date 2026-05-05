import { NextRequest, NextResponse } from "next/server";
import { getGateway } from "@aix-core";

/**
 * API: Agent Specific Invoke
 * ENTRY: HTTP Gate (URL Param version).
 * 
 * Thin wrapper over SovereignGateway.
 * Made with Moe Abdelaziz
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const agentId = params.id;
    const { message, context, sessionId } = body;

    if (!agentId || !message) {
      return NextResponse.json({ error: "Missing agentId or message" }, { status: 400 });
    }

    const gateway = getGateway({
      githubToken: process.env.GITHUB_TOKEN
    });
    
    // Official Backbone Execution
    const response = await gateway.execute({
      agentId,
      task: message,
      userId: sessionId,
      context
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Agent Specific Invoke API] Error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
