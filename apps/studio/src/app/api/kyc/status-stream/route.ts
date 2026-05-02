import { NextRequest } from 'next/server';
import { requireAuth, ERR } from '@/lib/api-helpers';
import { kv, KEYS } from '@/lib/redis';

/**
 * GET /api/kyc/status-stream
 * 
 * Server-Sent Events (SSE) endpoint for real-time KYC status updates.
 * 
 * Features:
 * - Uses Server-Sent Events (no WebSocket dependencies)
 * - Implements ReadableStream for streaming
 * - Polls KYC status every 3 seconds
 * - Pushes real-time updates to clients
 * - Automatically closes stream upon verification completion
 * - Proper SSE headers and formatting
 * 
 * SECURITY: Requires authentication
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const userId = session.user.id;

    // 2. Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let lastStatus: string | null = null;

        // Helper to send SSE message
        const sendMessage = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Helper to close stream
        const closeStream = () => {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          controller.close();
        };

        try {
          // Send initial connection message
          sendMessage('connected', {
            userId,
            timestamp: new Date().toISOString(),
          });

          // Poll KYC status every 3 seconds
          intervalId = setInterval(async () => {
            try {
              // Fetch current KYC status
              const kycKey = KEYS.kycStatus(userId);
              const status = await kv.get<{
                verified: boolean;
                level: 'none' | 'basic' | 'kyc' | 'zkkyc';
                timestamp: string;
              }>(kycKey);

              const currentStatus = status?.verified ? 'verified' : 'pending';

              // Only send update if status changed
              if (currentStatus !== lastStatus) {
                lastStatus = currentStatus;

                sendMessage('status', {
                  userId,
                  verified: status?.verified ?? false,
                  level: status?.level ?? 'none',
                  timestamp: status?.timestamp ?? new Date().toISOString(),
                });

                // Close stream if verification is complete
                if (status?.verified) {
                  sendMessage('complete', {
                    userId,
                    level: status.level,
                    verifiedAt: status.timestamp,
                  });
                  
                  // Close after a short delay to ensure message is sent
                  setTimeout(() => {
                    closeStream();
                  }, 500);
                }
              } else {
                // Send heartbeat to keep connection alive
                sendMessage('heartbeat', {
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error('[kyc/status-stream] Poll error:', error);
              sendMessage('error', {
                message: 'Failed to fetch KYC status',
                timestamp: new Date().toISOString(),
              });
            }
          }, 3000); // Poll every 3 seconds

          // Handle client disconnect
          req.signal.addEventListener('abort', () => {
            closeStream();
          });

        } catch (error) {
          console.error('[kyc/status-stream] Stream error:', error);
          sendMessage('error', {
            message: 'Stream initialization failed',
            timestamp: new Date().toISOString(),
          });
          closeStream();
        }
      },

      cancel() {
        // Cleanup when stream is cancelled
        console.log('[kyc/status-stream] Stream cancelled by client');
      },
    });

    // 3. Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error: any) {
    console.error('[kyc/status-stream] Failed to create stream:', error);
    return ERR.INTERNAL('Failed to create status stream: ' + error.message);
  }
}

// Made with Bob