import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { agentId, task, tools } = await req.json();
    if (!agentId || !task) {
      return NextResponse.json({ error: 'agentId and task required' }, { status: 400 });
    }

    // Dynamic import — keeps bundle small, only loads when called
    const { aix } = await import('@aix-core');

    const result = await aix(agentId, task, { tools: tools ?? {} });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
