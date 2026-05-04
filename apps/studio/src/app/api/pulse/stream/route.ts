import { NextRequest } from "next/server";
import { PulseEngine } from "@aix-core/storage";

/**
 * GET /api/pulse/stream
 * Server-Sent Events (SSE) stream for the Live Heartbeat Feed.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial heartbeat
      sendEvent({ type: 'CONNECTED', message: 'Pulse stream established' });

      // Poll loop (since Upstash doesn't support blocking BRPOP in serverless easily)
      const interval = setInterval(async () => {
        try {
          const events = await PulseEngine.getLatest(5);
          if (events.length > 0) {
            sendEvent({ type: 'PULSE', events });
          }
        } catch (error) {
          console.error("[Pulse Stream] Error fetching events:", error);
        }
      }, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

import { NextResponse } from "next/server";
