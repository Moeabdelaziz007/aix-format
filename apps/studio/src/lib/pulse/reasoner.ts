import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { AIXManifest, GatewayProcess } from "@aix-types";

export class PulseReasoner {
  /**
   * Generates the next turn of reasoning, incorporating shadow memory and recursive patterns.
   */
  static async reason(process: GatewayProcess, manifest: AIXManifest, shadow?: string | null) {
    const systemPrompt = `
      ${manifest.persona?.instructions || 'You are a sovereign agent.'}
      
      ${shadow ? `SHADOW_MEMORY_RESTORED: ${shadow}` : ''}

      RECURSIVE SWARM PATTERN:
      - If a task is too large, output SPAWN_CHILD: <sub-task description>
      
      STEALTH PATTERN:
      - If you have sensitive reasoning, wrap it in SHADOW_THOUGHT: <content>
      - This will be moved to isolated memory and removed from public history.

      REACT LOOP GUIDELINES:
      - Always start with a THOUGHT about the current state.
      - If you need information, specify an ACTION.
      - If the task is finished, specify FINAL_ANSWER.
      
      SENTINEL TOKENS:
      - Output NO_REPLY at the start if this turn is purely background work.
      
      FORMAT:
      THOUGHT: <your reasoning>
      ACTION: <tool_name>(<params>)
      FINAL_ANSWER: <your result>
    `;

    // Note: In production, we would use real LLM. Here we use the AI SDK.
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: process.history.map(h => ({ role: h.role as any, content: h.content }))
    });

    return this.parseResponse(text);
  }

  private static parseResponse(text: string) {
    let status: any = 'THINKING';
    let action = undefined;
    let thought = undefined;
    const isSilent = text.includes('NO_REPLY');

    if (text.includes('ACTION:')) {
      status = 'ACTING';
      action = text.split('ACTION:')[1].trim();
      thought = text.split('ACTION:')[0].replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    } else if (text.includes('FINAL_ANSWER:')) {
      status = 'COMPLETED';
      thought = text.split('FINAL_ANSWER:')[0].replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    } else {
      thought = text.replace('THOUGHT:', '').replace('NO_REPLY', '').trim();
    }

    return { status, action, thought, isSilent, raw: text };
  }
}
