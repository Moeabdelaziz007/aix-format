/**
 * 🛡️ AIX MCP Gate (Sovereign Implementation)
 * 
 * Integrated security layer for Tool and MCP calls.
 * Protects against Prompt Injection, Tool Poisoning, and Resource Exhaustion.
 * 
 * Made with Moe Abdelaziz
 */

import { health } from './health';
import { AbomScanner } from './scanner';
import { kv } from './memory/storage';

export interface SanitizationResult {
  safe: boolean;
  blockedPatterns: string[];
}

export type ToolCall = { tool: string; params: Record<string, unknown> };
export type ToolResult = { success: boolean; data: unknown };

export class MCPGate {
  /**
   * Execute a tool call with multi-layered security.
   * NO MOCKS. Uses real Health and Abom metrics.
   */
  static async checkClearance(agentId: string, toolCall: ToolCall): Promise<void> {
    const trustScore = await health.getTrustScore(agentId);
    
    // 1. Trust Barrier
    if (trustScore < 5) {
      await health.decrementTrust(agentId, 0.2);
      throw new Error(`[Security Violation] Trust Score ${trustScore.toFixed(1)} too low for tool '${toolCall.tool}'`);
    }

    // 2. Parameter Sanitization (Prompt Injection Protection)
    const sanitization = this.sanitizeParams(toolCall.params);
    if (!sanitization.safe) {
      await health.decrementTrust(agentId, 0.5);
      throw new Error(`[Security Violation] Malicious patterns detected in tool parameters: ${sanitization.blockedPatterns.join(', ')}`);
    }

    // 3. ABOM Manifest Check (Integrity)
    const registryData = await kv.get(`agent:${agentId}`);
    if (registryData) {
      const report = await AbomScanner.scan(registryData);
      if (!report.valid && report.riskScore > 70) {
        throw new Error(`[Security Violation] Agent manifest failed ABOM scan (Risk: ${report.riskScore})`);
      }
    }

    // 4. Quota Enforcement (Anti-DDoS)
    await this.enforceQuotas(agentId, toolCall.tool);

    console.log(`🛡️ [MCP_GATE] Clearance Granted for ${agentId} -> ${toolCall.tool} (Trust: ${trustScore.toFixed(1)})`);
  }

  private static sanitizeParams(params: any): SanitizationResult {
    const suspiciousPatterns = [
      /\b(ignore|disregard)\b.*\binstructions\b/i,
      /`|\$\(|\$\{/,
      /admin/i
    ];

    const jsonString = JSON.stringify(params);
    const blocked = suspiciousPatterns.filter(p => p.test(jsonString)).map(p => p.source);

    return {
      safe: blocked.length === 0,
      blockedPatterns: blocked
    };
  }

  private static async enforceQuotas(agentId: string, tool: string) {
    const minuteKey = `quota:${agentId}:minute`;
    const count = await kv.incr(minuteKey);
    
    if (count === 1) {
      await kv.expire(minuteKey, 60);
    }

    if (count > 20) { // Limit to 20 calls per minute
      throw new Error(`[Quota Exceeded] Agent ${agentId} exceeded rate limit for tool calls.`);
    }
  }
}

/**
 * Functional wrapper for backward compatibility
 */
export async function mcpGate(toolCall: ToolCall, agentId: string): Promise<ToolResult> {
  await MCPGate.checkClearance(agentId, toolCall);
  return { success: true, data: `Authorized ${toolCall.tool}` };
}
