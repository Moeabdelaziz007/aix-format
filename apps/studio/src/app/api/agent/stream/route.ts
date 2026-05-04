import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId') ?? 'agent-1';
  const task    = searchParams.get('task') ?? '';

  if (!task) {
    return new Response('task param required', { status: 400 });
  }

  const { aix } = await import('@aix-core');

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of aix.stream(agentId, task)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err: unknown) {
        const error = err as Error;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ERROR', message: error.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
