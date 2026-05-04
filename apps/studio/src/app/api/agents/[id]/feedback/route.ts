import { NextRequest, NextResponse } from "next/server";
import { kv, KEYS } from "@/lib/redis";
import { extractSkillFromFeedback } from "@aix-core/storage";

/**
 * POST /api/agents/[id]/feedback
 * Handles user feedback (thumbs up/down).
 * If positive, extracts a new skill for the agent (Hermes Pattern).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const { sessionId, isPositive } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!isPositive) {
      // For now, we just acknowledge negative feedback. 
      // Future: Use as negative reinforcement.
      return NextResponse.json({ message: "Feedback recorded" });
    }

    // 1. Retrieve the last interaction from session memory
    const memoryKey = KEYS.memory(agentId);
    const lastInteractions = await kv.lrange<string>(memoryKey, 0, 1);
    
    if (!lastInteractions || lastInteractions.length < 2) {
      return NextResponse.json({ error: "No recent interaction found to learn from" }, { status: 404 });
    }

    // Interactions are stored as JSON strings. Last is assistant, second to last is user.
    const assistantMsg = JSON.parse(lastInteractions[0]);
    const userMsg = JSON.parse(lastInteractions[1]);

    if (assistantMsg.role !== 'assistant' || userMsg.role !== 'user') {
      return NextResponse.json({ error: "Interaction state inconsistent" }, { status: 500 });
    }

    // 2. Extract Skill (Hermes Pattern)
    const skillHash = await extractSkillFromFeedback(
      agentId,
      userMsg.content,
      assistantMsg.content
    );

    return NextResponse.json({ 
      success: true, 
      message: "Skill learned from feedback",
      skillHash 
    });

  } catch (error: any) {
    console.error("[Feedback API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
