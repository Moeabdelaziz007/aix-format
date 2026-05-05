import { getTrustChain } from '../trust-chain';
import { kv } from '../storage/adapter';
import { KEYS } from '../storage/keys';

export interface EvolutionData {
  loops_completed: number;
  last_improved: string;
  lessons: string[];
  trust_delta: number;
  version_lineage: string[];
}

async function getOrCreateEvolution(agentDid: string): Promise<EvolutionData> {
  const key = KEYS.agentEvolution(agentDid);
  let evolution = await kv.get<EvolutionData>(key);
  
  if (!evolution) {
    evolution = {
      loops_completed: 0,
      last_improved: new Date().toISOString(),
      lessons: [],
      trust_delta: 0,
      version_lineage: []
    };
    await kv.set(key, evolution);
  }
  
  return evolution;
}

export async function recordLesson(agentDid: string, lesson: string): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  if (evolution.lessons.length < 100) {
    evolution.lessons.push(lesson);
    evolution.last_improved = new Date().toISOString();
    await kv.set(KEYS.agentEvolution(agentDid), evolution);
    
    const trustChain = getTrustChain();
    await trustChain.append(agentDid, 'evolution:lesson_recorded', { lesson });
  }
}

export async function incrementLoop(agentDid: string): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  evolution.loops_completed += 1;
  evolution.last_improved = new Date().toISOString();
  await kv.set(KEYS.agentEvolution(agentDid), evolution);
  
  const trustChain = getTrustChain();
  await trustChain.append(agentDid, 'evolution:loop_incremented', { loops_completed: evolution.loops_completed });
}

export async function updateTrustDelta(agentDid: string, delta: number): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  const newDelta = evolution.trust_delta + delta;
  
  // Enforce [-10, 10] range
  evolution.trust_delta = Math.max(-10, Math.min(10, newDelta));
  evolution.last_improved = new Date().toISOString();
  await kv.set(KEYS.agentEvolution(agentDid), evolution);
  
  const trustChain = getTrustChain();
  await trustChain.append(agentDid, 'evolution:trust_delta_updated', {
    delta,
    new_trust_delta: evolution.trust_delta
  });
}

export async function getEvolution(agentDid: string): Promise<EvolutionData | null> {
  return await kv.get<EvolutionData>(KEYS.agentEvolution(agentDid));
}

export async function clearEvolution(agentDid: string): Promise<void> {
  await kv.del(KEYS.agentEvolution(agentDid));
}

// Made with Moe Abdelaziz
