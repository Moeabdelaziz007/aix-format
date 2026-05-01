import { z } from 'zod';
import { kv, NS, TTL } from '../../aix-core/src/index';

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

  constructor(options: MCPGatewayOptions) {
    this.options = options;
  }

   * Execute a tool call through the gateway with security checks.
   */
  async executeToolCall(tenantId: string, agentId: string, agentTier: string, serverUrl: string, toolName: string, params: any) {
    const cost = 0.05; // Mock cost per call in π
    // 1. Check Allowlist
    if (!this.options.allowlist.includes(serverUrl)) {
      throw new Error(`Security Violation: Server ${serverUrl} is not in the AIX verified allowlist.`);
    }

    // 2. Check Tool Authorization
    if (!this.options.policies.toolAuthorization(agentTier, toolName)) {
      throw new Error(`Authorization Failed: Agent tier '${agentTier}' is not permitted to use tool '${toolName}'.`);
    }

    // 3. Rate Limiting
    const quotaState = await this.enforceQuotas(agentId);

    // 4. Parameter Sanitization
    const sanitization = this.options.policies.parameterSanitization(params);
    if (!sanitization.safe) {
      throw new Error(`Malicious Input Detected: Parameters blocked due to patterns: ${sanitization.blockedPatterns.join(', ')}`);
    }

    // 5. Audit Logging
    const startTime = Date.now();
    
    // 6. Forward to Actual MCP Server (Simulation)
    console.log(`[MCP-GATEWAY] Routing safe call to ${serverUrl}/${toolName}`);
    const result = { success: true, data: `Result from ${toolName}`, sanitized: true };
    
    const duration = Date.now() - startTime;

    if (this.options.auditLog.logEveryCall) {
      this.logToSIEM(tenantId, agentId, toolName, cost, quotaState, sanitization.sanitizedParams);
    }

    // 7. Record Metrics in Redis
    await this.recordMetrics(agentId, toolName, duration);

    return result;
  }

  private async enforceQuotas(agentId: string) {
    const key = `${NS.MCP}:quota:${agentId}`;
    const count = await kv.incr(key);
    
    if (count === 1) {
      await kv.expire(key, this.options.quotas.perAgent.maxCallsPerMinute === 0 ? 60 : TTL.QUOTA_WINDOW);
    }

    if (count > this.options.quotas.perAgent.maxCallsPerMinute) {
      throw new Error(`Quota Exceeded: Agent ${agentId} has exceeded the max calls per minute.`);
    }

    return { used: count, limit: this.options.quotas.perAgent.maxCallsPerMinute };
  }

  private async recordMetrics(agentId: string, toolName: string, duration: number) {
    const dailyKey = `${NS.METRICS}:${agentId}:${new Date().toISOString().split('T')[0]}`;
    
    await Promise.all([
      kv.incr(`${dailyKey}:calls`),
      kv.incr(`${dailyKey}:tool:${toolName}`),
      kv.set(`${dailyKey}:latency`, duration) 
    ]);
  }

  private logToSIEM(tenantId: string, agentId: string, toolName: string, cost: number, quotaState: any, params: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      tenantId,
      agentId,
      toolName,
      cost,
      quotaState,
      params,
      integration: this.options.auditLog.siemIntegration
    };
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
