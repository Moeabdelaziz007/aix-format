import { kv, KEYS, NS } from '@/lib/storage/redis';
import { NextResponse } from 'next/server';

/**
 * Agent Invocation API (TASK 5)
 * The "run" endpoint for sovereign agents.
 * Connects manifest, memory, and skills via the MCP Router.
 */

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message, context, sessionId } = await req.json();
    const agentId = params.id;

    // 1. Fetch Agent Manifest from Registry
    // Using core standardized registry key
    const registryKey = KEYS.registry(agentId);
    const agentData = await kv.get<any>(registryKey);
    
    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found in registry' }, { status: 404 });
    }

    // 2. Fetch Agent Memory (Last 10 interactions)
    const memoryKey = KEYS.memory(agentId);
    const memory = await kv.lrange<string>(memoryKey, 0, 10);
    const parsedMemory = memory.map(e => JSON.parse(e));

    // 3. Fetch Agent Skills (Set members)
    const skillsKey = `${NS.SKILLS}:agent:${agentId}`;
    const skills = await kv.smembers<string>(skillsKey);

    // 4. Route via MCP Router
    // Note: We use absolute URL for internal fetch in Next.js if available, 
    // or call the logic. For now, following the user's fetch pattern.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const routerResponse = await fetch(`${baseUrl}/api/mcp-router`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agentDid: agentData.did || agentId,
        agent: agentData, 
        message, 
        memory: parsedMemory, 
        skills, 
        context,
        userId: sessionId || 'anonymous' // Standardizing on sessionId for quota
      })
    });

    const routerResult = await routerResponse.json();

    // 5. Update Memory with the new interaction (Fire and forget)
    void kv.lpush(memoryKey, JSON.stringify({ 
      role: 'user', 
      content: message, 
      timestamp: Date.now() 
    })).then(() => {
      kv.ltrim(memoryKey, 0, 49); // Keep MAX_ENTRIES limit
    });

    return NextResponse.json(routerResult);
  } catch (err: any) {
    console.error("[Invoke Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
