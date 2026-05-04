import { trustChain } from '../trust-chain/index';
import { evolutionStore, type EvolutionData } from '../storage/redis-evolution';

async function getOrCreateEvolution(agentDid: string): Promise<EvolutionData> {
  let evolution = await evolutionStore.get(agentDid);
  
  if (!evolution) {
    evolution = {
      loops_completed: 0,
      last_improved: new Date().toISOString(),
      lessons: [],
      trust_delta: 0,
      version_lineage: []
    };
    await evolutionStore.set(agentDid, evolution);
  }
  
  return evolution;
}

export async function recordLesson(agentDid: string, lesson: string): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  if (evolution.lessons.length < 100) {
    evolution.lessons.push(lesson);
    evolution.last_improved = new Date().toISOString();
    await evolutionStore.set(agentDid, evolution);
    trustChain.append('evolution.lesson_recorded', agentDid, { lesson });
  }
}

export async function incrementLoop(agentDid: string): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  evolution.loops_completed += 1;
  evolution.last_improved = new Date().toISOString();
  await evolutionStore.set(agentDid, evolution);
  trustChain.append('evolution.loop_incremented', agentDid, { loops_completed: evolution.loops_completed });
}

export async function updateTrustDelta(agentDid: string, delta: number): Promise<void> {
  const evolution = await getOrCreateEvolution(agentDid);
  const newDelta = evolution.trust_delta + delta;
  
  // Enforce [-10, 10] range
  evolution.trust_delta = Math.max(-10, Math.min(10, newDelta));
  evolution.last_improved = new Date().toISOString();
  await evolutionStore.set(agentDid, evolution);
  
  trustChain.append('evolution.trust_delta_updated', agentDid, {
    delta,
    new_trust_delta: evolution.trust_delta
  });
}

export async function getEvolution(agentDid: string): Promise<EvolutionData | null> {
  return await evolutionStore.get(agentDid);
}

export async function clearEvolution(): Promise<void> {
  await evolutionStore.clear();
}
