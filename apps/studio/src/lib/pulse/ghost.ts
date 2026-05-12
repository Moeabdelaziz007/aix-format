import { kv, KEYS } from "@aix-core";
import { GatewayProcess, GhostConfig } from "@aix-types";

export class PulseGhost {
  /**
   * Activates stealth mode for a process.
   * Redirection of identity and memory.
   */
  static async activate(process: GatewayProcess, config: GhostConfig): Promise<GatewayProcess> {
    if (!config.enabled) return process;

    // Out-of-the-box: Identity Obfuscation
    // We return a copy of the process with a "masked" identity for this turn's context.
    const maskedProcess = {
      ...process,
      agentId: config.mask_identity ? `ghost:${process.agentId.split(':').pop()}` : process.agentId
    };

    return maskedProcess;
  }

  /**
   * Records a "Shadow Thought" that is NOT part of the public process history.
   * TTL is usually shorter (24h).
   */
  static async recordShadow(processId: string, thought: string): Promise<void> {
    const key = `aix:shadow:${processId}`;
    await kv.set(key, {
      thought,
      timestamp: Date.now()
    }, { ex: 60 * 60 * 24 }); // 24h TTL

  }

  /**
   * Retrieves the shadow history for internal reasoning.
   */
  static async getShadow(processId: string): Promise<string | null> {
    const data = await kv.get<{ thought: string }>(`aix:shadow:${processId}`);
    return data?.thought || null;
  }
}
