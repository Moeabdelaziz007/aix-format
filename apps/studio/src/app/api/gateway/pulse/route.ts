import { NextRequest, NextResponse } from "next/server";
import { 
  GatewayManager, 
  GatewaySecurity, 
  KEYS, 
  kv, 
  evaluateAgent, 
  executeDeadHand, 
  sendHeartbeat 
} from "@aix-core/storage";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * POST /api/gateway/pulse
 * The "Heartbeat" of the Sovereign Agent Gateway.
 * Progresses the agentic loop (Reason -> Act -> Observe).
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Address CVE-2026-25253
    if (!GatewaySecurity.validateRequest(req)) {
      return NextResponse.json({ error: "Sovereign Shield: Unauthorized Gateway Access" }, { status: 403 });
    }

    const { processId, agentId, task, actionResult } = await req.json();

    // 1. Resolve or Spawn Process
    let process;
    if (processId) {
      process = await GatewayManager.getProcess(processId);
      if (!process) return NextResponse.json({ error: "Process expired" }, { status: 404 });
      
      if (actionResult) {
        await GatewayManager.recordObservation(processId, process.lastAction || 'unknown', actionResult);
        process = await GatewayManager.getProcess(processId); 
      }
    } else {
      if (!agentId || !task) return NextResponse.json({ error: "Missing agentId or task" }, { status: 400 });
      process = await GatewayManager.spawn(agentId, task);
    }

    if (!process) return NextResponse.json({ error: "Failed to initialize process" }, { status: 500 });

    // 2. SAFETY: Dead Hand Protocol Evaluation
    const actualAgentId = process.agentId;
    
    // Check if agent is already frozen or killed
    const frozen = await kv.get(KEYS.frozen(actualAgentId));
    if (frozen) {
      return NextResponse.json({ 
        error: "Sovereign Emergency: Agent memory frozen by Dead Hand Protocol",
        status: 'QUARANTINE' 
      }, { status: 423 });
    }

    const threat = await evaluateAgent(actualAgentId);
    if (threat) {
      await executeDeadHand(threat);
      return NextResponse.json({ 
        error: `Dead Hand Triggered: ${threat.reason}`,
        threatLevel: threat.threatLevel 
      }, { status: 403 });
    }

    // Send heartbeat to prevent Dead Hand timeout
    await sendHeartbeat(actualAgentId);

    // 3. FETCH AGENT MANIFEST
    const agentData = await kv.get<any>(KEYS.registry(actualAgentId));
    if (!agentData) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // 4. EXECUTE REASONING STEP (The "Thought")
    const systemPrompt = `
      ${agentData.persona?.instructions || 'You are a sovereign agent.'}
      
      REACT LOOP GUIDELINES:
      - Always start with a THOUGHT about the current state.
      - If you need information, specify an ACTION.
      - If the task is finished, specify FINAL_ANSWER.
      
      SENTINEL TOKENS:
      - Output NO_REPLY at the start if this turn is purely background work.
      
      FORMAT:
      THOUGHT: <your reasoning>
      ACTION: <tool_name>(<params>)
      FINAL_ANSWER: <your result>
    `;

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: process.history.map(h => ({ role: h.role as any, content: h.content }))
    });

    // 5. PARSE REASONING & SENTINEL TOKENS
    let status: any = 'THINKING';
    let action = undefined;
    let thought = undefined;
    const isSilent = text.includes('NO_REPLY');

    if (text.includes('ACTION:')) {
      status = 'ACTING';
      action = text.split('ACTION:')[1].trim();
      thought = text.split('ACTION:')[0].replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    } else if (text.includes('FINAL_ANSWER:')) {
      status = 'COMPLETED';
      thought = text.split('FINAL_ANSWER:')[0].replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    } else {
      thought = text.replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    }

    // 6. UPDATE PROCESS STATE
    const updatedProcess = await GatewayManager.pulse(process.id, {
      status,
      lastThought: thought,
      lastAction: action,
      history: [
        ...process.history,
        { role: 'assistant', content: text, timestamp: Date.now() }
      ]
    });

    return NextResponse.json({
      success: true,
      process: updatedProcess,
      nextStep: status === 'ACTING' ? 'EXECUTE_ACTION' : status === 'COMPLETED' ? 'DONE' : 'PULSE',
      silent: isSilent
    });

  } catch (error: any) {
    console.error("[Gateway Pulse] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
