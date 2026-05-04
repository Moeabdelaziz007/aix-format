import { kv, KEYS, TTL } from '@/lib/redis';
import { NextResponse } from 'next/server';

/**
 * Voice Wizard Session API (B4)
 * GET  → Retrieve session history and step
 * POST → Save session state
 */

export async function GET(req: Request) {
  try {
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: "Missing x-session-id" }, { status: 400 });
    }

    const sessionKey = KEYS.wizardSession(sessionId);
    const session = await kv.get<any>(sessionKey);
    
    return NextResponse.json(session ? session : { messages: [], step: 0, partialManifest: {} });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, messages, step, partialManifest } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const sessionKey = KEYS.wizardSession(sessionId);
    const sessionState = { 
      messages, 
      step, 
      partialManifest, 
      updatedAt: Date.now() 
    };
    
    await kv.set(sessionKey, sessionState, { ex: TTL.SESSIONS }); // 24h TTL from core
    
    return NextResponse.json({ saved: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
