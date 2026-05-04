import { NextResponse } from 'next/server';
import { z } from 'zod';
import { kv, KEYS } from '@/lib/redis';
import { getGateway } from '@aix-core/gateway';

/**
 * AIX Stable Agent Run API
 * Sovereign Execution with Zod Validation
 * Made with Moe Abdelaziz
 */

const RunTaskSchema = z.object({
  input: z.union([z.string(), z.record(z.any())]),
  context: z.record(z.any()).optional().default({}),
  options: z.object({
    maxSteps: z.number().int().min(1).max(30).optional().default(9), // Tesla number
    useGroq: z.boolean().optional().default(true),
  }).optional().default({})
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const body = await req.json();
    
    // RULE 1: Zod Validation
    const validated = RunTaskSchema.parse(body);

    // 1. Fetch Agent
    const manifest = await kv.get<any>(KEYS.registry(agentId));
    if (!manifest) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 2. Access Gateway
    const gateway = getGateway();

    // 🌀 RULE 0: Security & Sovereign Execution
    // Wire to the actual agent runtime via gateway.run
    const result = await gateway.run(agentId, validated.input);

    return NextResponse.json({
      success: true,
      agentId,
      result: result.result || result.output,
      steps: result.steps,
      duration: result.duration,
      trustHash: result.trustHash // If available from TrustChain
    });

  } catch (error: any) {
    console.error(`[API:Run] Error for agent ${params.id}:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
