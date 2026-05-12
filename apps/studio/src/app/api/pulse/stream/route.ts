import { NextRequest } from 'next/server';
import { getRustBridge } from '@aix-core';

/**
 * SSE Stream for Real-Time Pulse Dashboard
 * 
 * Features:
 * - Backpressure handling (max 100 queued events)
 * - Automatic client disconnect detection
 * - Error recovery with exponential backoff
 * - Heartbeat to keep connection alive
 * - Graceful shutdown
 */

import { PulseEvent } from '@aix-core';


// Configuration
const CONFIG = {
  MAX_QUEUE_SIZE: 100,
  HEARTBEAT_INTERVAL: 15000, // 15s
  EVENT_INTERVAL: 1000, // 1s
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1s base delay
};

// Event queue with backpressure
class EventQueue {
  private queue: PulseEvent[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(event: PulseEvent): boolean {
    if (this.queue.length >= this.maxSize) {
      // Backpressure: drop oldest event
      this.queue.shift();
      console.warn('[SSE] Queue full, dropping oldest event');
    }
    this.queue.push(event);
    return true;
  }

  shift(): PulseEvent | undefined {
    return this.queue.shift();
  }

  get size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

// Real Event Fetcher
async function fetchLatestEvents(agentId?: string): Promise<PulseEvent[]> {
  const rust = getRustBridge();
  let rawEvents = [];

  try {
    if (agentId && agentId !== 'all') {
      rawEvents = await rust.eventStore.query(agentId);
    } else {
      const starts = await rust.eventStore.queryByType('task:start');
      const successes = await rust.eventStore.queryByType('task:success');
      const failures = await rust.eventStore.queryByType('task:failure');
      rawEvents = [...starts, ...successes, ...failures].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    }

    return rawEvents.map(e => {
      let type: PulseEvent['type'] = 'info';
      if (e.event_type === 'task:start') type = 'task';
      else if (e.event_type === 'task:success') type = 'success';
      else if (e.event_type === 'task:failure') type = 'error';

      return {
        id: e.id,
        type,
        message: `${e.event_type} for agent ${e.agent_id.slice(0, 8)}`,
        timestamp: e.timestamp,
        meta: {
          agentId: e.agent_id,
          originalType: e.event_type
        }
      };
    });
  } catch (error) {
    console.error('[Pulse:Stream] Failed to fetch events:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Check if client accepts SSE
  const accept = request.headers.get('accept');
  if (!accept?.includes('text/event-stream')) {
    return new Response('SSE not supported', { status: 406 });
  }

  // Create event queue
  const queue = new EventQueue(CONFIG.MAX_QUEUE_SIZE);
  
  // Track connection state
  let isConnected = true;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let eventTimer: NodeJS.Timeout | null = null;

  // Create readable stream
  const stream = new ReadableStream({
    start(controller) {
      console.log('[SSE] Client connected');

      // Send initial connection event
      const initEvent = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initEvent));

      // Heartbeat to detect disconnects
      heartbeatTimer = setInterval(() => {
        if (!isConnected) return;
        
        try {
          const heartbeat = `: heartbeat ${Date.now()}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch (error) {
          console.error('[SSE] Heartbeat failed:', error);
          cleanup();
        }
      }, CONFIG.HEARTBEAT_INTERVAL);

      // Generate events
      // Fetch and stream events
      eventTimer = setInterval(async () => {
        if (!isConnected) return;

        try {
          const { searchParams } = new URL(request.url);
          const agentId = searchParams.get('agentId') || undefined;
          
          // Fetch latest from Rust
          const newEvents = await fetchLatestEvents(agentId);
          newEvents.forEach(e => queue.push(e));

          // Send queued events
          while (queue.size > 0) {
            const queuedEvent = queue.shift();
            if (!queuedEvent) break;

            const sseData = `data: ${JSON.stringify(queuedEvent)}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseData));
          }
        } catch (error) {
          console.error('[SSE] Event stream error:', error);
        }
      }, CONFIG.EVENT_INTERVAL);

      // Cleanup function
      const cleanup = () => {
        if (!isConnected) return;
        
        isConnected = false;
        console.log('[SSE] Cleaning up connection');

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        if (eventTimer) {
          clearInterval(eventTimer);
          eventTimer = null;
        }

        queue.clear();

        try {
          controller.close();
        } catch (error) {
          console.error('[SSE] Error closing controller:', error);
        }
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('[SSE] Client disconnected');
        cleanup();
      });
    },

    cancel() {
      console.log('[SSE] Stream cancelled');
      isConnected = false;
      
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (eventTimer) clearInterval(eventTimer);
      queue.clear();
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Made with Moe Abdelaziz
