import { kv, KEYS, TTL } from '@/lib/storage/redis';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * AIX Voice Wizard - Conversational Logic with Session Persistence (B4)
 * Uses Redis to persist conversation history and session context.
 */

const SYSTEM_PROMPT = `
You are the AIX Sovereign Wizard, a friendly architect for AI agents.
Your goal is to help users create a valid AIX v1.3.0 manifest (.aix.json) via conversation.

Collect the following information ONE STEP AT A TIME:
1. Agent Name
2. Role/Purpose
3. Capabilities
4. Identity Preference
5. Monetization Tier

RULES:
- Ask only ONE question at a time.
- Be concise.
- If all data is collected, respond with "MANIFEST_COMPLETE:" followed by JSON.
`;

export async function POST(req: Request) {
  try {
    const { messages, sessionId, agentId = 'wizard-default', userId = 'anonymous' } = await req.json();
    
    // 1. Identify Session (B4)
    // If sessionId is provided, we use it for persistence across browser reloads
    const sessionKey = sessionId ? KEYS.wizardSession(sessionId) : null;
    const memoryKey = KEYS.memory(agentId, userId);
    
    // 2. Retrieve Context from Redis (Prefer session-specific context if available)
    let history = [];
    if (sessionKey) {
      history = await kv.get<any[]>(sessionKey) || [];
    } else {
      history = await kv.get<any[]>(memoryKey) || [];
    }
    
    // 3. Merge current messages with history (sliding window)
    const fullContext = [...history, ...messages].slice(-10);
    
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: SYSTEM_PROMPT,
      messages: fullContext,
      onFinish: async (completion) => {
        // 4. Persist updated history with 24h TTL (B4)
        const newHistory = [...fullContext, { role: 'assistant', content: completion.text }].slice(-10);
        
        if (sessionKey) {
          await kv.set(sessionKey, newHistory, { ex: TTL.SESSIONS });
        }
        await kv.set(memoryKey, newHistory, { ex: TTL.MEMORY });
      }
    });
    
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[Voice Chat] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
