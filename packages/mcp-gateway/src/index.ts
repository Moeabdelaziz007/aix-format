import { z } from 'zod';

/**
 * AIX MCP Gateway - Secure intelligent proxy for MCP servers.
 * Protects against Prompt Injection, Tool Poisoning, and Resource Exhaustion.
 */

export interface SanitizationResult {
  safe: boolean;
  sanitizedParams: any;
  blockedPatterns: string[];
}

export interface MCPGatewayOptions {
  allowlist: string[];
  policies: {
    toolAuthorization: (agentTier: string, toolName: string) => boolean;
    parameterSanitization: (params: any) => SanitizationResult;
  };
  auditLog: {
    logEveryCall: boolean;
    siemIntegration: "splunk" | "datadog" | "custom";
  };
  quotas: {
    perAgent: { maxCallsPerMinute: number; maxDataPerDay: number };
    perTool: { maxCallsPerHour: number };
  };
}

export class MCPGateway {
  private options: MCPGatewayOptions;
  private callLogs: Map<string, { count: number; lastReset: number }> = new Map();

  constructor(options: MCPGatewayOptions) {
    this.options = options;
  }

  /**
   * Execute a tool call through the gateway with security checks.
   */
  async executeToolCall(agentId: string, agentTier: string, serverUrl: string, toolName: string, params: any) {
    // 1. Check Allowlist
    if (!this.options.allowlist.includes(serverUrl)) {
      throw new Error(`Security Violation: Server ${serverUrl} is not in the AIX verified allowlist.`);
    }

    // 2. Check Tool Authorization
    if (!this.options.policies.toolAuthorization(agentTier, toolName)) {
      throw new Error(`Authorization Failed: Agent tier '${agentTier}' is not permitted to use tool '${toolName}'.`);
    }

    // 3. Rate Limiting
    this.enforceQuotas(agentId);

    // 4. Parameter Sanitization
    const sanitization = this.options.policies.parameterSanitization(params);
    if (!sanitization.safe) {
      throw new Error(`Malicious Input Detected: Parameters blocked due to patterns: ${sanitization.blockedPatterns.join(', ')}`);
    }

    // 5. Audit Logging
    if (this.options.auditLog.logEveryCall) {
      this.logToSIEM(agentId, toolName, sanitization.sanitizedParams);
    }

    // 6. Forward to Actual MCP Server (Simulation)
    console.log(`[MCP-GATEWAY] Routing safe call to ${serverUrl}/${toolName}`);
    return { success: true, data: `Result from ${toolName}`, sanitized: true };
  }

  private enforceQuotas(agentId: string) {
    const now = Date.now();
    const stats = this.callLogs.get(agentId) || { count: 0, lastReset: now };

    if (now - stats.lastReset > 60000) {
      stats.count = 0;
      stats.lastReset = now;
    }

    if (stats.count >= this.options.quotas.perAgent.maxCallsPerMinute) {
      throw new Error(`Quota Exceeded: Agent ${agentId} has exceeded the max calls per minute.`);
    }

    stats.count++;
    this.callLogs.set(agentId, stats);
  }

  private logToSIEM(agentId: string, toolName: string, params: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      toolName,
      params,
      integration: this.options.auditLog.siemIntegration
    };
    // In a real implementation, this would send to a SIEM endpoint
    console.log(`[AUDIT-LOG] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Default AIX Policy Engine
 */
export const DefaultAIXPolicy = {
  toolAuthorization: (tier: string, tool: string) => {
    const criticalTools = ['delete_file', 'run_command', 'reset_system'];
    if (criticalTools.includes(tool) && tier !== 'sovereign') return false;
    return true;
  },
  parameterSanitization: (params: any): SanitizationResult => {
    const suspiciousPatterns = [
      /\b(ignore|disregard)\b.*\binstructions\b/i,
      /`|\$\(|\$\{/,
      /admin/i
    ];

    const jsonString = JSON.stringify(params);
    const blocked = suspiciousPatterns.filter(p => p.test(jsonString)).map(p => p.source);

    return {
      safe: blocked.length === 0,
      sanitizedParams: params,
      blockedPatterns: blocked
    };
  }
};
