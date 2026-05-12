import { NextRequest } from 'next/server';
import { getBus } from '@aix-core';

/**
 * AIX Real-Time Agent Stream (SSE)
 * Streams live events from the Sovereign Bus to the Studio Dashboard
 * 
 * Made with Moe Abdelaziz
 */

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const bus = getBus();
  
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // 🌀 Subscribe to ALL bus events
  const subId = bus.subscribe('all', (event) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    writer.write(encoder.encode(data)).catch(() => {
        // Handle stream closure
    });
  });

  // Handle connection closure
  req.signal.onabort = () => {
    bus.unsubscribe(subId);
    writer.close().catch(() => {});
  };

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
