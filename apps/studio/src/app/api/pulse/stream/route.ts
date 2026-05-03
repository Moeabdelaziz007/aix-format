import { NextRequest, NextResponse } from 'next/server';
import { PulseEngine } from '@aix/core';
import { kv } from '@aix/core/storage/adapter';
import { KEYS } from '@aix/core/storage/keys';

export const runtime = 'edge';

/**
 * GET /api/pulse/stream?agentId=xxx&taskId=yyy
 * Server-Sent Events (SSE) stream for real-time agent events
 * 
 * @param agentId - Required. Filter events by agent ID
 * @param taskId - Optional. Further filter by task ID
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  const taskId = searchParams.get('taskId');

  // Validate required params
  if (!agentId) {
    return NextResponse.json(
      { error: 'agentId query parameter is required' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  let lastSeenIndex = 0;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial connection event
      sendEvent({
        type: 'connected',
        agentId,
        taskId: taskId || null,
        timestamp: Date.now()
      });

      // Heartbeat every 15 seconds
      heartbeatInterval = setInterval(() => {
        sendEvent({ type: 'heartbeat', timestamp: Date.now() });
      }, 15000);

      // Polling loop (PulseEngine doesn't have subscribe method)
      // Poll every 500ms for new events
      const pollInterval = setInterval(async () => {
        try {
          // Get latest events from global pulse
          const events = await PulseEngine.getLatest(100);
          
          // Filter by agentId and optionally taskId
          const filteredEvents = events.filter((event) => {
            if (event.agentId !== agentId) return false;
            if (taskId && event.metadata?.taskId !== taskId) return false;
            return true;
          });

          // Only send events we haven't seen yet
          const newEvents = filteredEvents.slice(0, filteredEvents.length - lastSeenIndex);
          
          if (newEvents.length > 0) {
            for (const event of newEvents) {
              sendEvent(event);
            }
            lastSeenIndex = filteredEvents.length;
          }
        } catch (error: unknown) {
          console.error('[Pulse Stream] Error fetching events:', error);
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          });
        }
      }, 500);

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        controller.close();
      });

      // Auto-close after 5 minutes to prevent zombie connections
      setTimeout(() => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        sendEvent({ type: 'timeout', message: 'Stream closed after 5 minutes' });
        controller.close();
      }, 5 * 60 * 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

// Made with Moe Abdelaziz
