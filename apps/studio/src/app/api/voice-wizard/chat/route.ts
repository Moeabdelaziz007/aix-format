import { kv, KEYS, TTL } from '@/lib/redis';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * AIX Voice Wizard - Conversational Logic with Session Persistence & Fallback
 */

const SYSTEM_PROMPT = `
You are the AIX Sovereign Wizard, a friendly architect for AI agents.
Your goal is to help users create a valid AIX v0.369.0 manifest (.aix.json) via conversation.

Collect the following information ONE STEP AT A TIME:
1. Agent Name (required, 3+ characters)
2. Role/Purpose (required, what the agent does)
3. Capabilities (required, list of 1-5 specific capabilities)
4. Identity Preference (required: pi_network, web, key, or none)
5. Monetization Tier (required: free, basic, premium, or enterprise)
6. Optional: Tone (friendly, professional, formal, casual)
7. Optional: Description (brief summary)

RULES:
- Ask only ONE question at a time
- Be concise and encouraging
- Validate responses before moving to next question
- When all required data is collected, inform user that manifest generation is ready
- The user will then call the /api/voice-wizard/generate-manifest endpoint with collected data

IMPORTANT: Do NOT generate the manifest yourself. Simply collect the data and confirm completion.
`;

export async function POST(req: Request) {
  try {
    const { messages, sessionId, agentId = 'wizard-default', userId = 'anonymous' } = await req.json();
    
    // 1. Check for API Key (Sovereign Pattern 2: Fallback)
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {

      return new Response(JSON.stringify({ 
        error: "Voice Intelligence Offline",
        fallback: true,
        message: "I am currently in manual mode. Please provide your agent's name to begin."
      }), { 
        status: 503, // Service Unavailable
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionKey = sessionId ? KEYS.wizardSession(sessionId) : null;
    const memoryKey = KEYS.memory(agentId, userId);
    
    let history = [];
    if (sessionKey) {
      history = await kv.get<any[]>(sessionKey) || [];
    } else {
      history = await kv.get<any[]>(memoryKey) || [];
    }
    
    const fullContext = [...history, ...messages].slice(-10);
    
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: SYSTEM_PROMPT,
      messages: fullContext,
      onFinish: async (completion) => {
        const newHistory = [...fullContext, { role: 'assistant', content: completion.text }].slice(-10);
        
        if (sessionKey) {
          await kv.set(sessionKey, newHistory, { ex: TTL.SESSIONS });
        }
        await kv.set(memoryKey, newHistory, { ex: TTL.MEMORY });
      }
    });
    
    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error("[Voice Chat] Fatal Error:", error);
    // Graceful error response for UI handling
    return new Response(JSON.stringify({ 
      error: "Sovereign Circuit Breaker Active",
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
