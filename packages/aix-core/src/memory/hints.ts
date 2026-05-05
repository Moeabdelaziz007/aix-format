import { kv, StorageOrchestrator } from './storage';
import { KEYS } from '../../../core/storage/keys';
import { randomBytes } from 'crypto';
import { bus, RINGS } from './bus';

/**
 * 🔬 AgentHints System (v3.0) - Structural Navigation & Collaborative Memory
 * 
 * DESIGN PRINCIPLES (arXiv 2026):
 * 1. Breadcrumbs: Leaves persistent context on files/functions.
 * 2. Structural Navigation: Maps dependencies to prevent "retrieval failure".
 * 3. Asymmetric Access: Collaborative memory based on the 4-Ring topology.
 * 
 * Made with Moe Abdelaziz
 */

export interface Hint {
  id: string;
  authorAgent: string;
  type: 'intent' | 'warning' | 'discovery' | 'structural';
  content: string;
  relatedPath?: string;
  timestamp: number;
  epistemicLoad: number; // 0-10 (How hard was this to figure out?)
  quantumLink?: string;  // Link to a non-obvious dependency
}

export class AgentHints {
  private static orchestrator = StorageOrchestrator.getInstance();

  /**
   * Leaves a breadcrumb on a specific file path.
   */
  static async leaveHint(filePath: string, hint: Omit<Hint, 'id' | 'timestamp'>): Promise<string> {
    const id = `hint_${randomBytes(4).toString('hex')}`;
    const fullHint: Hint = {
      ...hint,
      id,
      timestamp: Date.now(),
    };

    const key = KEYS.fileHint(filePath);
    const existingHints = await this.orchestrator.load<Hint[]>(key) || [];
    
    // RULE 3: Asymmetric Access - We keep the most valuable hints (high epistemic load)
    const updatedHints = [...existingHints, fullHint]
      .sort((a, b) => b.epistemicLoad - a.epistemicLoad)
      .slice(0, 10); // Keep top 10 breadcrumbs per file

    await this.orchestrator.save(key, updatedHints);

    // 🌊 Quantum Resonance: Emit burst if it's a major discovery
    if (fullHint.epistemicLoad > 7 || fullHint.type === 'discovery') {
      await bus.emitPulse({
        ring: RINGS.MIND,
        type: 'QUANTUM_BURST',
        agentId: fullHint.authorAgent,
        agentName: 'MetaLoop',
        message: `✨ Structural discovery in ${filePath}`,
        metadata: { epistemicLoad: fullHint.epistemicLoad, filePath }
      });
    }

    return id;
  }

  /**
   * Reads all breadcrumbs for a file path to gain "structural foresight".
   */
  static async getHints(filePath: string): Promise<Hint[]> {
    return await this.orchestrator.load<Hint[]>(KEYS.fileHint(filePath)) || [];
  }

  /**
   * Tier 1 Memory: The Constitution (Hot Memory)
   * Injects the living rules of AIX into every session.
   */
  static async updateConstitution(content: string): Promise<void> {
    await this.orchestrator.save(KEYS.constitution(), {
      rules: content,
      updatedAt: Date.now(),
      version: '1.3.0-sovereign'
    });
  }

  static async getConstitution(): Promise<string> {
    const data = await this.orchestrator.load<{ rules: string }>(KEYS.constitution());
    return data?.rules || 'Standard AIX Operating Manual applies.';
  }

  /**
   * TurboQuant Visualization (Structural Navigation)
   * Finds non-obvious dependencies discovered by previous agents.
   */
  static async discoverHiddenTopology(filePath: string): Promise<string[]> {
    const hints = await this.getHints(filePath);
    return hints
      .filter(h => h.type === 'structural' || h.quantumLink)
      .map(h => h.quantumLink || h.relatedPath)
      .filter((v): v is string => !!v);
  }
}

// Made with Moe Abdelaziz
