import { NextRequest, NextResponse } from "next/server";
import { ChannelManager, kv, KEYS } from "@aix-core/storage";

/**
 * POST /api/channels/telegram/setup
 * Automates the creation of a Telegram bot for a specific agent.
 */
export async function POST(req: NextRequest) {
  try {
    const { agentId } = await req.json();
    if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

    const manifest = await kv.get<any>(KEYS.registry(agentId));
    if (!manifest) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const config = await ChannelManager.setupTelegram(agentId, manifest);

    return NextResponse.json({
      success: true,
      botUsername: config.username,
      botLink: config.link
    });

  } catch (error: any) {
    console.error("[Telegram Setup] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
