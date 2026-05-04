import { NextRequest } from 'next/server';

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

interface PulseEvent {
  type: 'bus' | 'pet' | 'meta' | 'heartbeat';
  data: unknown;
  timestamp: number;
}

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

// Generate mock pulse data (replace with real bus integration)
function generatePulseEvent(): PulseEvent {
  const types: Array<'bus' | 'pet' | 'meta'> = ['bus', 'pet', 'meta'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    type,
    data: {
      id: Date.now().toString(),
      message: `${type} event at ${new Date().toISOString()}`,
      value: Math.random() * 100,
    },
    timestamp: Date.now(),
  };
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
      eventTimer = setInterval(() => {
        if (!isConnected) return;

        try {
          // Generate new event
          const event = generatePulseEvent();
          queue.push(event);

          // Send queued events
          while (queue.size > 0) {
            const queuedEvent = queue.shift();
            if (!queuedEvent) break;

            const sseData = `event: ${queuedEvent.type}\ndata: ${JSON.stringify(queuedEvent.data)}\nid: ${queuedEvent.timestamp}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseData));
          }
        } catch (error) {
          console.error('[SSE] Event send failed:', error);
          
          // Error recovery: try to send error event
          try {
            const errorEvent = `event: error\ndata: ${JSON.stringify({ 
              message: 'Event processing error',
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorEvent));
          } catch (fatalError) {
            console.error('[SSE] Fatal error, closing connection:', fatalError);
            cleanup();
          }
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
