import { kv, KEYS } from '@/lib/storage/redis';

/**
 * Agent Memory API (B1)
 * GET    → Retrieve agent memory
 * POST   → Add entry to memory
 * DELETE → Clear memory
 */

const MAX_ENTRIES = 50; // Last 50 interactions

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memoryKey = KEYS.memory(params.id);
    const memory = await kv.lrange<string>(memoryKey, 0, -1);
    
    return Response.json({ 
      agentId: params.id,
      entries: memory.map(e => JSON.parse(e)),
      count: memory.length 
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memoryKey = KEYS.memory(params.id);
    const { role, content, timestamp } = await req.json();
    
    const entry = JSON.stringify({ 
      role, 
      content, 
      timestamp: timestamp || Date.now() 
    });
    
    await kv.lpush(memoryKey, entry);
    await kv.ltrim(memoryKey, 0, MAX_ENTRIES - 1);
    await kv.expire(memoryKey, 60 * 60 * 24 * 30); // 30 days
    
    return Response.json({ saved: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memoryKey = KEYS.memory(params.id);
    await kv.del(memoryKey);
    return Response.json({ cleared: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
