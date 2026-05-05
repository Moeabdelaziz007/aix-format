import { kv, KEYS } from './storage';
import { generateHash } from './infra';
import { Octokit } from '@octokit/rest';

/**
 * 🧠 SOVEREIGN_BRAIN
 * The Learning Engine: Patterns, Skills, and Wisdom Archiving.
 * Made with Moe Abdelaziz
 */

export interface LearnedProcedure {
  goal: string;
  steps: string[];
  successCount: number;
  auditHash?: string;
}

/**
 * Retrieves learned patterns with semantic relevance
 */
export async function getRelevantProcedures(agentId: string, currentGoal: string, allProcedures: LearnedProcedure[]): Promise<LearnedProcedure[]> {
  try {
    const { search: semanticSearch } = await import('./wikibrain/SemanticIndex');
    const semanticResults = await semanticSearch(currentGoal, 3, { type: 'skill' });
    
    if (semanticResults.results.length > 0) {
      return semanticResults.results.map(r => r.metadata as LearnedProcedure);
    }
  } catch { /* Fallback */ }

  return allProcedures.filter(p => 
    p.goal.split(' ').some(word => currentGoal.toLowerCase().includes(word.toLowerCase()))
  );
}

/**
 * Solidifies a successful pattern into permanent memory
 */
export async function solidifySkill(agentId: string, prompt: string, response: string): Promise<string> {
  const hash = generateHash(`${prompt}:${response}`).slice(0, 16);
  const detailKey = KEYS.agentSkillDetail(agentId, hash);
  
  const skill = {
    prompt,
    response,
    usedAt: Date.now(),
    successCount: 1,
  };

  await kv.set(detailKey, skill);
  await kv.sadd(KEYS.agentSkills(agentId), hash);

  return hash;
}

/**
 * Archives "Wisdom" (Sovereign Patterns) with Git backing.
 */
export async function archiveWisdom(agentId: string, input: any, output: string, octokit?: Octokit) {
  const MAX_RETRIES = 2;
  const inputStr = typeof input === 'object' ? JSON.stringify(input) : String(input);
  const wisdomSnippet = `Sovereign Pattern [${agentId}]: Input(${inputStr.slice(0, 40)}) -> Strategy(${output.slice(0, 60)})`;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // 1. Semantic Indexing
      const { SemanticIndex } = await import('./wikibrain/SemanticIndex');
      const index = new SemanticIndex();
      await index.index(`wisdom-${agentId}-${Date.now()}`, 'wisdom', wisdomSnippet, { agentId, type: 'meta_wisdom' });

      // 2. Git Chronicles
      if (octokit && process.env.GITHUB_REPOSITORY) {
        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
        const path = 'CHRONICLES.md';
        let sha: string | undefined;
        let content = '';

        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path }) as any;
          content = Buffer.from(data.content, 'base64').toString();
          sha = data.sha;
        } catch { /* New file */ }

        const updated = content + `\n### 🛡️ Evolution [${new Date().toISOString()}]\n**Agent:** ${agentId}\n**Pattern:** ${wisdomSnippet}\n---\n`;

        await octokit.repos.createOrUpdateFileContents({
          owner, repo, path,
          message: `🛰️ [Brain] New Wisdom Pattern: ${agentId}`,
          content: Buffer.from(updated).toString('base64'),
          sha
        });
      }
      return;
    } catch (e) {
      if (i === MAX_RETRIES - 1) console.error('❌ [Brain:Wisdom] FAILED:', e);
    }
  }
}
