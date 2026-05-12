import { NextRequest, NextResponse } from "next/server";
import { stakeAgent } from "@aix-core";
import { z } from 'zod';

// Zod validation schema
const StakeSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  stakerAddress: z.string().min(1, 'Staker address is required'),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large')
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    
    // Validate with Zod
    const validationResult = StakeSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request body",
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { agentId, stakerAddress, amount } = validationResult.data;

    const stake = await stakeAgent(agentId, stakerAddress, amount);
    return NextResponse.json({ success: true, stake });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Stake API Error:", err);
    return NextResponse.json(
      { error: "Failed to stake", message: err.message },
      { status: 500 }
    );
  }
}
