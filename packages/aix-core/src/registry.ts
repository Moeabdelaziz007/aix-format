import { kv, KEYS } from './memory/storage';
import { AbomScanner } from './scanner';
import { ValidationResult } from './domain';
import { nanoid } from 'nanoid';

/**
 * 📇 AGENT_REGISTRY
 * Centralized service for agent registration, discovery, and lifecycle.
 * Enforces protocol standards and security scans.
 * 
 * Made with Moe Abdelaziz
 */

export interface RegisterOptions {
  userId: string;
  isShadow?: boolean;
}

export class AgentRegistry {
  /**
   * Registers a new agent in the protocol.
   * Performs real-time security scanning and protocol validation.
   */
  async register(manifest: any, options: RegisterOptions) {
    // 1. Security & Protocol Scan
    const scanResult = await AbomScanner.scan(manifest);
    if (!scanResult.valid) {
      throw new Error(`Protocol Violation: ${scanResult.errors.map((e: any) => e.message).join(', ')}`);
    }

    const agentId = manifest.id || `aix_${nanoid(10)}`;
    const did = manifest.identity_layer?.id || agentId;

    // 2. Persist Manifest (SSoT)
    await kv.set(KEYS.registry(did), manifest);

    // 3. Update User Fleet
    const userAgentsKey = `user:${options.userId}:agents`;
    const fleet = await kv.get<string[]>(userAgentsKey) || [];
    if (!fleet.includes(did)) {
      fleet.push(did);
      await kv.set(userAgentsKey, fleet);
    }

    // 4. Update Marketplace (If not shadow)
    if (!options.isShadow && !manifest.is_shadow_clone) {
      await kv.set(`marketplace:agent:${did}`, {
        did,
        name: manifest.meta?.name || 'Unnamed Agent',
        role: manifest.persona?.role || 'Sovereign Agent',
        risk_score: scanResult.riskScore,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      agentId,
      did,
      risk_score: scanResult.riskScore
    };
  }

  /**
   * Fetches an agent by its DID.
   */
  async getAgent(did: string) {
    const manifest = await kv.get(KEYS.registry(did));
    if (!manifest) return null;

    // Perform real-time integrity check
    const scan = await AbomScanner.scan(manifest);
    if (!scan.valid) {
      (manifest as any).status = 'compromised';
    }

    return manifest;
  }

  /**
   * Lists all agents for a user.
   */
  async listUserAgents(userId: string) {
    const userAgentsKey = `user:${userId}:agents`;
    const agentIds = await kv.get<string[]>(userAgentsKey) || [];
    
    const manifests = await Promise.all(
      agentIds.map(id => this.getAgent(id))
    );

    return manifests.filter(Boolean);
  }

  /**
   * Updates an existing agent.
   */
  async updateAgent(did: string, body: any) {
    const existing = await this.getAgent(did);
    if (!existing) throw new Error('Agent not found');

    const updated = { ...existing, ...body, did };
    await kv.set(KEYS.registry(did), updated);
    
    // Update marketplace cache
    await kv.set(`marketplace:agent:${did}`, {
      did,
      name: updated.meta?.name || 'Unnamed Agent',
      role: updated.persona?.role || 'Sovereign Agent',
      timestamp: Date.now()
    });

    return updated;
  }

  /**
   * Removes an agent from the registry.
   */
  async deleteAgent(did: string) {
    await kv.del(KEYS.registry(did));
    await kv.del(`marketplace:agent:${did}`);
  }
}

export const registry = new AgentRegistry();
