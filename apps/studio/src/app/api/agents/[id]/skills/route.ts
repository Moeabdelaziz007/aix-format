import { kv, NS } from '@/lib/redis';

/**
 * Agent Skills Attachment API
 * POST   → Attach skill to agent
 * DELETE → Detach skill from agent
 * GET    → List agent's current skills
 */

const AGENT_SKILLS_KEY = (id: string) => `${NS.SKILLS}:agent:${id}`;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skills = await kv.smembers(AGENT_SKILLS_KEY(params.id));
    return Response.json({ agentId: params.id, skills });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { skillId } = await req.json();
    if (!skillId) return Response.json({ error: "Missing skillId" }, { status: 400 });
    
    await kv.sadd(AGENT_SKILLS_KEY(params.id), skillId);
    return Response.json({ attached: skillId });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { skillId } = await req.json();
    if (!skillId) return Response.json({ error: "Missing skillId" }, { status: 400 });
    
    await kv.srem(AGENT_SKILLS_KEY(params.id), skillId);
    return Response.json({ detached: skillId });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
