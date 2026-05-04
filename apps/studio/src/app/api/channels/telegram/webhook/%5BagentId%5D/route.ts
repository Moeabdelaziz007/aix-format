import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/channels/telegram/webhook/[agentId]
 * Handlers incoming messages from Telegram and forwards them to the AIX Invoke Engine.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const body = await req.json();

    if (!body.message) return NextResponse.json({ ok: true });

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    console.log(`[Telegram Webhook] Message for ${agentId} from ${chatId}: ${userMessage}`);

    // 1. Forward to Internal Invoke API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invokeRes = await fetch(`${baseUrl}/api/agents/${agentId}/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userMessage, 
        sessionId: `tg:${chatId}`,
        context: { platform: 'telegram', chatId }
      })
    });

    const result = await invokeRes.json();
    const botResponse = result.success ? result.response : "Error: Failed to reach agent.";

    // 2. Send response back to Telegram
    // Note: In production, we'd use the stored telegram_token for this agent
    // For this pattern, we'll simulate the successful response back
    console.log(`[Telegram Webhook] Sending response back to ${chatId}: ${botResponse.slice(0, 50)}...`);

    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: botResponse,
    });

  } catch (error: any) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: true }); // Telegram needs 200 OK to stop retries
  }
}
