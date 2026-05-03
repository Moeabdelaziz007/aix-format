import { kv } from './storage/adapter';
import { KEYS } from './storage/keys';
import { createHash } from 'crypto';

/**
 * AIX Hermes Learning Engine
 * Implements Layer 2 (Skill Memory) by extracting successful procedures from agent runs.
 */

export interface ProcedureStep {
  tool: string;
  input: any;
  output: any;
  success: boolean;
}

export interface LearnedProcedure {
  goal: string;
  steps: ProcedureStep[];
  timestamp: number;
}

export interface FeedbackSkill {
  prompt: string;
  response: string;
  usedAt: number;
  successCount: number;
}

/**
 * Records a successful run as a 'Learned Skill'.
 * In the Hermes model, we don't save what happened, we save what worked.
 */
export async function recordSuccessfulProcedure(
  agentId: string, 
  goal: string, 
  steps: ProcedureStep[]
): Promise<void> {
  const key = KEYS.memSkill(agentId);
  
  const procedure: LearnedProcedure = {
    goal,
    steps: steps.filter(s => s.success), // Only save the successful steps
    timestamp: Date.now()
  };

  await kv.lpush(key, JSON.stringify(procedure));
  await kv.ltrim(key, 0, 19);
  
}

/**
 * Skill Extraction (Hermes Pattern)
 * Triggered by positive user feedback (thumbs up).
 * Saves the successful interaction as a reusable skill.
 */
export async function extractSkillFromFeedback(
  agentId: string,
  prompt: string,
  response: string
): Promise<string> {
  // 1. Generate unique hash for the skill (prompt + first 50 chars of response)
  const hash = createHash('sha256')
    .update(`${prompt}:${response.slice(0, 50)}`)
    .digest('hex')
    .slice(0, 16);

  const skillsListKey = `agent:${agentId}:skills`;
  const skillDetailKey = `agent:${agentId}:skill:${hash}`;

  // 2. Check if skill already exists
  const existing = await kv.get<FeedbackSkill>(skillDetailKey);
  
  if (existing) {
    // Increment success count
    existing.successCount += 1;
    existing.usedAt = Date.now();
    await kv.set(skillDetailKey, existing);
  } else {
    // Create new skill entry
    const newSkill: FeedbackSkill = {
      prompt,
      response,
      usedAt: Date.now(),
      successCount: 1
    };
    await kv.set(skillDetailKey, newSkill);
    await kv.sadd(skillsListKey, hash);
  }

  return hash;
}

/**
 * Retrieves learned procedures for an agent to be used as 'few-shot' context or specific skills.
 */
export async function getLearnedProcedures(agentId: string): Promise<LearnedProcedure[]> {
  const key = KEYS.memSkill(agentId);
  const data = await kv.lrange<string>(key, 0, -1);
  return data.map(d => JSON.parse(d));
}

/**
 * Retrieves all feedback-driven skills for an agent.
 */
export async function getFeedbackSkills(agentId: string): Promise<FeedbackSkill[]> {
  const skillsListKey = `agent:${agentId}:skills`;
  const hashes = await kv.smembers<string>(skillsListKey);
  
  if (!hashes.length) return [];

  const skills = await Promise.all(
    hashes.map(hash => kv.get<FeedbackSkill>(`agent:${agentId}:skill:${hash}`))
  );

  return skills.filter((s): s is FeedbackSkill => s !== null);
}

/**
 * Episodic Memory: Pattern Recognition
 * Placeholder for long-term pattern extraction (Layer 4).
 */
export async function updateEpisodicMemory(agentId: string, pattern: string): Promise<void> {
  const key = KEYS.memEpisodic(agentId);
  await kv.sadd(key, pattern);
}
