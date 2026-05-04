import { kv, KEYS } from './index';

/**
 * Readable Memory System (v1.3.6)
 * Converts flat agent memory into human-readable Markdown/JSONL
 * and interactive WikiBrain Memory Trees.
 */

export interface MemoryNode {
  id: string;
  label: string;
  children?: MemoryNode[];
  metadata?: any;
}

export class ReadableMemory {
  /**
   * Generates a WikiBrain Memory Tree for an agent.
   */
  static async getMemoryTree(agentId: string): Promise<MemoryNode> {
    // 1. Fetch Sessions
    const sessions = await kv.lrange<any>(`agent:${agentId}:sessions`, 0, 9);
    const sessionNodes: MemoryNode[] = sessions.map(s => ({
      id: `session-${s.timestamp}`,
      label: new Date(s.timestamp).toLocaleDateString(),
      metadata: { summary: s.summary }
    }));

    // 2. Fetch Learned Facts
    const facts = await kv.lrange<string>(`agent:${agentId}:mem:epi`, 0, -1);
    const factNodes: MemoryNode[] = facts.map((f, i) => ({
      id: `fact-${i}`,
      label: f.length > 30 ? f.slice(0, 30) + '...' : f,
      metadata: { fullFact: f }
    }));

    // 3. Fetch Skills
    const skills = await kv.smembers<string>(`agent:${agentId}:skills`);
    const skillNodes: MemoryNode[] = skills.map(s => ({
      id: `skill-${s}`,
      label: s,
      metadata: { level: 'Advanced' }
    }));

    // 4. Build Tree
    return {
      id: 'root',
      label: `${agentId} WikiBrain`,
      children: [
        { id: 'sessions', label: '📅 Sessions (Timeline)', children: sessionNodes },
        { id: 'facts', label: '🧠 Learned Facts', children: factNodes },
        { id: 'skills', label: '⚡ Skills (Procedures)', children: skillNodes },
        { id: 'connections', label: '🔗 Connections', children: [] }
      ]
    };
  }

  /**
   * Archives a session into Markdown format.
   */
  static async archiveToMarkdown(agentId: string, processId: string): Promise<string> {
    const process = await kv.get<any>(KEYS.gateway(processId));
    if (!process) return '';

    const date = new Date().toISOString().split('T')[0];
    const md = `
# Agentic Memory Archive: ${date}
Agent: ${agentId}
Process: ${processId}

## Transcript
${process.history.map((h: any) => `**${h.role.toUpperCase()}**: ${h.content}`).join('\n\n')}

---
*Archived by AIX Sovereign Gateway*
    `;

    return md;
  }
}
