import { z } from 'zod';
import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { createHash } from 'crypto';
import { getTrustChain } from './trust-chain';
import { search as semanticSearch, indexEntity } from './wikibrain/SemanticIndex';

/**
 * AIX Sovereign Learning Engine (Hermes v2.1)
 * Extracts and evolves cognitive patterns from agent executions.
 * 
 * Made with Moe Abdelaziz
 */

// RULE 1: Strict Schemas
export const ProcedureStepSchema = z.object({
  tool: z.string(),
  input: z.any(),
  output: z.any(),
  success: z.boolean(),
});

export const LearnedProcedureSchema = z.object({
  goal: z.string().min(5),
  steps: z.array(ProcedureStepSchema),
  timestamp: z.number(),
  auditHash: z.string().optional(),
});

export type ProcedureStep = z.infer<typeof ProcedureStepSchema>;
export type LearnedProcedure = z.infer<typeof LearnedProcedureSchema>;

/**
 * Pattern Catcher: Records successful procedures with semantic indexing
 */
export async function recordSuccessfulProcedure(
  agentId: string, 
  goal: string, 
  steps: ProcedureStep[]
): Promise<string> {
  // 1. Semantic Check - Have we solved a similar pattern before?
  const existingPatterns = await semanticSearch(goal, 1, { type: 'skill' });
  const similarity = existingPatterns.results[0]?.score || 0;

  // 2. Append to TrustChain (RULE 3)
  const trustChain = getTrustChain();
  const auditHash = await trustChain.append(agentId, 'SKILL_LEARNED', { goal, stepCount: steps.length });

  const procedure: LearnedProcedure = {
    goal,
    steps: steps.filter(s => s.success),
    timestamp: Date.now(),
    auditHash
  };

  const key = KEYS.memSkill(agentId);
  await kv.lpush(key, JSON.stringify(procedure));
  await kv.ltrim(key, 0, 49); // Keep top 50 patterns

  // Index for Semantic Search (Pro Trick 2)
  await indexEntity(
    `skill:${agentId}:${auditHash}`,
    'skill',
    `Goal: ${goal}\nSteps: ${steps.length}`,
    { agentId, goal, auditHash }
  );

  return auditHash;
}

/**
 * Skill Extraction from User Feedback (RULE 3)
 */
export async function extractSkillFromFeedback(
  agentId: string,
  prompt: string,
  response: string
): Promise<string> {
  const hash = createHash('sha256')
    .update(`${prompt}:${response.slice(0, 50)}`)
    .digest('hex')
    .slice(0, 16);

  const detailKey = KEYS.agentSkillDetail(agentId, hash);
  const trustChain = getTrustChain();
  const auditHash = await trustChain.append(agentId, 'FEEDBACK_SKILL_SAVED', { hash });

  const skill = {
    prompt,
    response,
    usedAt: Date.now(),
    successCount: 1,
    auditHash
  };

  await kv.set(detailKey, skill);
  await kv.sadd(KEYS.agentSkills(agentId), hash);

  return hash;
}

/**
 * Retrieves learned patterns with semantic relevance
 */
export async function getRelevantProcedures(agentId: string, currentGoal: string): Promise<LearnedProcedure[]> {
  const allProcedures = await getLearnedProcedures(agentId);
  if (!allProcedures.length) return [];
  // Pro Trick 2: Use Semantic Search instead of keyword filtering
  const semanticResults = await semanticSearch(currentGoal, 3, { type: 'skill' });
  
  if (semanticResults.results.length === 0) {
    // Fallback to keyword matching if no semantic results
    return allProcedures.filter(p => 
      p.goal.split(' ').some(word => currentGoal.toLowerCase().includes(word.toLowerCase()))
    ).slice(0, 3);
  }

  // Map semantic results back to procedures
  const relevantProcedures: LearnedProcedure[] = [];
  for (const res of semanticResults.results) {
    const procedure = allProcedures.find(p => p.auditHash === (res as any).metadata?.auditHash);
    if (procedure) relevantProcedures.push(procedure);
  }

  return relevantProcedures;
}

export async function getLearnedProcedures(agentId: string): Promise<LearnedProcedure[]> {
  const data = await kv.lrange<string>(KEYS.memSkill(agentId), 0, -1);
  return data.map(d => JSON.parse(d));
}

export async function getFeedbackSkills(agentId: string): Promise<any[]> {
  const hashes = await kv.smembers<string>(KEYS.agentSkills(agentId));
  if (!hashes.length) return [];
  const skills = await Promise.all(hashes.map(h => kv.get(KEYS.agentSkillDetail(agentId, h))));
  return skills.filter(s => s !== null);
}

// Made with Moe Abdelaziz
