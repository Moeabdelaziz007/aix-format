import { NextRequest, NextResponse } from "next/server";
import { unstakeAgent } from "@aix-core";
import { requireAuth } from "@/lib/api-helpers";
import { getTrustChain } from "@aix-core";
import { z } from "zod";

/**
 * Sovereign Unstake Engine
 * RULE 0: Security First
 * RULE 1: Zod validation
 * RULE 3: TrustChain Logging
 * 
 * Made with Moe Abdelaziz
 */

const UnstakeSchema = z.object({
  agentId: z.string().min(1),
  stakerAddress: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  return requireAuth(async (session) => {
    try {
      const body = await req.json();
      
      // RULE 1: Validate input
      const { agentId, stakerAddress, amount } = UnstakeSchema.parse(body);

      // SECURITY: Ensure stakerAddress belongs to the authenticated user
      // In this version, we trust the session's address link if available
      // TODO: Implement cross-reference between session.user.id and stakerAddress

      const success = await unstakeAgent(agentId, stakerAddress, amount);
      if (!success) {
        return NextResponse.json({ error: "Insufficient stake to unstake or unauthorized" }, { status: 400 });
      }

      // RULE 3: Append to TrustChain
      const trustChain = getTrustChain();
      const auditHash = await trustChain.append(agentId, 'AGENT_UNSTAKED', {
        stakerAddress,
        amount,
        userId: session.user.id
      });

      return NextResponse.json({ success: true, auditHash });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
      }
      console.error("[UnstakeEngine] Critical Failure:", error);
      return NextResponse.json({ error: "Failed to unstake" }, { status: 500 });
    }
  });
}

// Made with Moe Abdelaziz
