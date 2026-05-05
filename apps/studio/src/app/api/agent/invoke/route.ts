import { NextRequest, NextResponse } from "next/server";
import { getGateway } from "@aix-core";

/**
 * API: Agent Invoke
 * ENTRY: Official HTTP Gate.
 * 
 * Thin wrapper over SovereignGateway.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, taskDescription } = body;

    if (!agentId || !taskDescription) {
      return NextResponse.json({ error: "Missing agentId or taskDescription" }, { status: 400 });
    }

    const gateway = getGateway();
    
    // Standardize request for SovereignGateway
    const response = await gateway.execute({
      agentId,
      task: taskDescription
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Agent Invoke API] Error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
