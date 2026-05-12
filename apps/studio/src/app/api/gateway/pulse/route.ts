import { NextRequest, NextResponse } from "next/server";
import { 
  GatewayManager, 
  PulseEngine,
} from "@aix-core";
import { SwarmProcessor } from "@/lib/pulse/processor";

/**
 * POST /api/gateway/pulse
 * The "Heartbeat" of the Sovereign Agent Gateway.
 * Now orchestrated by the SwarmProcessor (Micro-Agent Pattern).
 */
export async function POST(req: NextRequest) {
  try {
    const { processId, agentId, task, actionResult } = await req.json();

    let targetProcessId = processId;

    // 1. Resolve or Spawn Process
    if (!targetProcessId) {
      if (!agentId || !task) return NextResponse.json({ error: "Missing agentId or task" }, { status: 400 });
      const process = await GatewayManager.spawn(agentId, task);
      targetProcessId = process.id;
      
      // Initial Pulse Event
      await PulseEngine.emit({
        type: 'INVOCATION',
        agentId: process.agentId,
        agentName: agentId,
        message: `New swarm initiated: ${task.slice(0, 30)}...`
      });
    }

    // 2. Execute Swarm Turn
    const result = await SwarmProcessor.executeTurn(targetProcessId, actionResult);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error, 
        status: result.status 
      }, { status: result.status === 'QUARANTINE' ? 423 : 403 });
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("[Gateway Pulse Swarm] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
