import { NextResponse } from 'next/server';
import { kv, KEYS, TTL } from '@/lib/storage/redis';
import { nanoid } from 'nanoid';

/**
 * Agent-to-Agent Invocation Interface
 * Flow:
 * 1. Authenticate Source Agent
 * 2. Resolve Target Agent via Registry
 * 3. Route Request through MCP Gateway
 * 4. Persist Trace for Settlement
 */

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const targetAgentDid = params.id;
    const body = await req.json();
    const { sourceDid, payload } = body;

    if (!sourceDid) {
      return NextResponse.json({ error: "Unauthorized: Missing sourceDid" }, { status: 401 });
    }

    // 1. Generate Trace ID for the cross-agent call
    const traceId = `trace_${nanoid()}`;
    const invokeKey = KEYS.invoke(traceId);

    // 2. Prepare Invocation Record
    const record = {
      traceId,
      sourceDid,
      targetDid: targetAgentDid,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // 3. Persist Trace (TTL 1hr for ephemeral routing)
    await kv.set(invokeKey, record, { ex: TTL.INVOKE });

    // 4. Mock Routing (In production, this hits the MCP Gateway/Router)
    // Here we simulate a successful handoff to the registry/gateway
    console.log(`[Invoke] ${sourceDid} -> ${targetAgentDid} | Trace: ${traceId}`);

    return NextResponse.json({
      success: true,
      traceId,
      target: targetAgentDid,
      status: 'routed'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
