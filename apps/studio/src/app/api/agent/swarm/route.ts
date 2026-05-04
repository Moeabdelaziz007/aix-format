import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { agents, pattern = 'race', dryRun = false, aggregator } = await req.json();
    if (!agents?.length) {
      return NextResponse.json({ error: 'agents array required' }, { status: 400 });
    }

    const { aix } = await import('@aix-core');

    const result = await aix.swarm(agents, { pattern, dryRun, aggregator });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
