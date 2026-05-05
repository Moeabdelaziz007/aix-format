/**
 * 🛡️ AIX MCP Gate
 * Security layer for Tool and MCP calls.
 * Made with Moe Abdelaziz
 */

import { health } from './health';

type ToolCall = { tool: string; params: Record<string, unknown> }
type ToolResult = { success: boolean; data: unknown }

export const abomScanner = {
  getSafetyScore: async (agentId: string) => {
    // Basic safety logic: Combine trust score with static rules
    const trust = await health.getTrustScore(agentId);
    return trust; // Trust score is the safety score for now
  }
}

export async function mcpGate(
  toolCall: ToolCall,
  agentId: string
): Promise<ToolResult> {
  const score = await abomScanner.getSafetyScore(agentId);

  // RULE 5: safetyScore < 5 → STOP
  if (score < 5) {
    await health.decrementTrust(agentId, 0.2);
    throw new Error(`Safety Score ${score.toFixed(1)} too low for ${toolCall.tool}`);
  }

  // Log to audit chain
  // In a real sovereign world, this is a cryptographic record
  console.log(`[MCP_GATE] Agent ${agentId} calling ${toolCall.tool} (Score: ${score.toFixed(1)})`);

  return { success: true, data: `Authorized ${toolCall.tool}` };
}
