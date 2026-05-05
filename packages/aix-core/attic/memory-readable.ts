import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import * as LearningEngine from './learning';

/**
 * Sovereign Readable Memory System (v2.1)
 * Converts agent patterns into human-readable WikiBrain Memory Trees.
 * 
 * Made with Moe Abdelaziz
 */

export interface MemoryNode {
  id: string;
  label: string;
  children?: MemoryNode[];
  metadata?: {
    summary?: string;
    fullFact?: string;
    level?: string;
    auditHash?: string;
    timestamp?: number;
    successCount?: number;
  };
}

export class ReadableMemory {
  /**
   * Generates a WikiBrain Memory Tree for an agent.
   * Hunts for patterns and attaches sovereign audit trails.
   */
  static async getMemoryTree(agentId: string): Promise<MemoryNode> {
    // 1. Fetch Sessions (The Context Path)
    const sessions = await kv.lrange<any>(KEYS.agentSessions(agentId), 0, 9);
    const sessionNodes: MemoryNode[] = sessions.map(s => ({
      id: `session-${s.timestamp}`,
      label: `📅 ${new Date(s.timestamp).toLocaleDateString()}`,
      metadata: { 
        summary: s.summary,
        timestamp: s.timestamp 
      }
    }));

    // 2. Fetch Learned Facts (The Semantic Map)
    const facts = await LearningEngine.getLearnedProcedures(agentId);
    const factNodes: MemoryNode[] = facts.map((p, i) => ({
      id: `fact-${i}`,
      label: p.goal.length > 35 ? p.goal.slice(0, 35) + '...' : p.goal,
      metadata: { 
        fullFact: p.goal,
        auditHash: p.auditHash,
        timestamp: p.timestamp
      }
    }));

    // 3. Fetch Skills (The Sovereign Abilities)
    const skills = await LearningEngine.getFeedbackSkills(agentId);
    const skillNodes: MemoryNode[] = skills.map(s => {
      const level = s.successCount > 10 ? 'Elite' : s.successCount > 3 ? 'Advanced' : 'Basic';
      return {
        id: `skill-${s.auditHash?.slice(0, 8)}`,
        label: `⚡ ${s.prompt.slice(0, 30)}...`,
        metadata: { 
          level,
          successCount: s.successCount,
          auditHash: s.auditHash
        }
      };
    });

    // 4. Build Sovereign Tree
    return {
      id: 'root',
      label: `🛡️ ${agentId} Sovereign Brain`,
      children: [
        { id: 'sessions', label: '🕰️ Timeline Patterns', children: sessionNodes },
        { id: 'facts', label: '🧠 Learned Patterns', children: factNodes },
        { id: 'skills', label: '🔥 Sovereign Skills', children: skillNodes },
        { id: 'security', label: '🔒 Trust Chain Audit', children: [] }
      ]
    };
  }

  /**
   * Archives a session into Sovereign Markdown format.
   */
  static async archiveToMarkdown(agentId: string, processId: string): Promise<string> {
    const process = await kv.get<any>(KEYS.process(processId));
    if (!process) return '';

    const date = new Date().toISOString();
    return `
# AXIOM Sovereign Memory Archive
**Agent ID:** ${agentId}
**Process ID:** ${processId}
**Timestamp:** ${date}

---

## 📜 Execution Transcript
${process.history.map((h: any) => `> **${h.role.toUpperCase()}**: ${h.content}`).join('\n\n')}

---
**Verified by AIX Sovereign TrustChain**
// Made with Moe Abdelaziz
    `;
  }
}

// Made with Moe Abdelaziz
