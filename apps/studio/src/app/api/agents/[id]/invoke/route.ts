import { kv, KEYS, NS } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getLearnedProcedures, recordSuccessfulProcedure } from '@aix-core/storage';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

/**
 * AIX Sovereign Invocation Engine (AgenticKit + Hermes + Symphony A2A)
 */

async function internalInvoke(agentId: string, message: string, context: any, sessionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/agents/${agentId}/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, sessionId, skipCritic: true })
  });
  return res.json();
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message, context, sessionId, skipCritic = false } = await req.json();
    const agentId = params.id;

    // 1. Fetch Agent Manifest
    const agentData = await kv.get<any>(KEYS.registry(agentId));
    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found in registry' }, { status: 404 });
    }

    // 2. Retrieve Layer 2 Memory (Learned Skills/Procedures)
    const learnedSkills = await getLearnedProcedures(agentId);
    const skillContext = learnedSkills.length > 0 
      ? `Proven successful procedures for this agent:\n${JSON.stringify(learnedSkills.slice(0, 3))}`
      : "No previous successful procedures learned yet.";

    // 3. Revenue & Quota Check
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const routerResponse = await fetch(`${baseUrl}/api/mcp-router`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agentDid: agentData.did || agentId,
        userId: sessionId || 'anonymous',
        endpointType: 'invoke'
      })
    });

    const routerResult = await routerResponse.json();
    if (!routerResult.success) {
      return NextResponse.json(routerResult, { status: routerResponse.status });
    }

    // 4. EXECUTION (Executor Agent)
    const canCallAgents = agentData.skills?.includes('agent-call') || agentData.meta?.tags?.includes('orchestrator');
    
    const systemPrompt = `
      ${agentData.persona?.instructions || 'You are a sovereign AI agent.'}
      
      HERMES MEMORY CONTEXT (SUCCESSFUL PATTERNS):
      ${skillContext}
      
      User Context: ${JSON.stringify(context || {})}
      
      ${canCallAgents ? `
      SYMPHONY ORCHESTRATION ENABLED:
      You can invoke other agents if needed. To call another agent, use the following format in your response:
      [CALL:did:axiom:agent_id] YOUR_MESSAGE_TO_SUB_AGENT [/CALL]
      ` : ''}
    `;

    let { text, finishReason, toolCalls } = await generateText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      prompt: message,
    });

    // 5. SYMPHONY: Agent-to-Agent (A2A) Execution
    let subAgentResponse = null;
    if (canCallAgents && text.includes('[CALL:')) {
      const match = text.match(/\[CALL:(did:[a-z0-9:_]+)\]([\s\S]*?)\[\/CALL\]/i);
      if (match) {
        const subAgentId = match[1];
        const subMessage = match[2].trim();
        
        console.log(`[Symphony] ${agentId} calling sub-agent ${subAgentId}`);
        const subResult = await internalInvoke(subAgentId, subMessage, context, sessionId);
        
        if (subResult.success) {
          subAgentResponse = subResult.response;
          // Merge responses
          text = text.replace(match[0], `\n--- SUB-AGENT RESPONSE (${subAgentId}) ---\n${subAgentResponse}\n--- END SUB-AGENT ---\n`);
        }
      }
    }

    // 6. CRITIC PATTERN (Pattern 8: Agent reviews output)
    let isSuccess = (finishReason === 'stop' || finishReason === 'tool-calls') && !text.includes('FAILED');
    let criticFeedback = null;

    if (isSuccess && !skipCritic) {
      const { text: feedback } = await generateText({
        model: google('gemini-2.0-flash-lite-preview'),
        system: "You are the AIX Protocol Critic. Review the agent's response for accuracy and goal achievement. Output only 'VALID' or 'INVALID' followed by a reason.",
        prompt: `User Goal: ${message}\nAgent Response: ${text}`
      });
      
      criticFeedback = feedback;
      if (feedback.includes('INVALID')) {
        isSuccess = false;
      }
    }

    // 7. HERMES LEARNING: Save validated skills
    if (isSuccess) {
      void recordSuccessfulProcedure(agentId, message, [
        { 
          tool: toolCalls?.length ? 'tool_execution' : 'direct_response', 
          input: message, 
          output: text, 
          success: true 
        }
      ]);
    }

    // 8. Update Session Memory
    const memoryKey = KEYS.memory(agentId);
    void kv.lpush(memoryKey, JSON.stringify({ 
      role: 'user', 
      content: message, 
      timestamp: Date.now() 
    })).then(() => {
      kv.lpush(memoryKey, JSON.stringify({ 
        role: 'assistant', 
        content: text, 
        timestamp: Date.now(),
        critic: criticFeedback,
        subCall: subAgentResponse ? true : false
      }));
      kv.ltrim(memoryKey, 0, 49);
    });

    return NextResponse.json({
      success: true,
      response: text,
      critic: criticFeedback,
      billing: routerResult,
      learned: isSuccess,
      subAgentCalled: subAgentResponse ? true : false
    });
  } catch (err: any) {
    console.error("[Invoke Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
