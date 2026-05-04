import { trustChain } from '../trust-chain/index';

interface EvolutionData {
  loops_completed: number;
  last_improved: string;
  lessons: string[];
  trust_delta: number;
  version_lineage: string[];
}

const agentsEvolution = new Map<string, EvolutionData>();

function getOrCreateEvolution(agentDid: string): EvolutionData {
  if (!agentsEvolution.has(agentDid)) {
    agentsEvolution.set(agentDid, {
      loops_completed: 0,
      last_improved: new Date().toISOString(),
      lessons: [],
      trust_delta: 0,
      version_lineage: []
    });
  }
  return agentsEvolution.get(agentDid)!;
}

export function recordLesson(agentDid: string, lesson: string): void {
  const evolution = getOrCreateEvolution(agentDid);
  if (evolution.lessons.length < 100) {
    evolution.lessons.push(lesson);
    evolution.last_improved = new Date().toISOString();
    trustChain.append('evolution.lesson_recorded', agentDid, { lesson });
  }
}

export function incrementLoop(agentDid: string): void {
  const evolution = getOrCreateEvolution(agentDid);
  evolution.loops_completed += 1;
  evolution.last_improved = new Date().toISOString();
  trustChain.append('evolution.loop_incremented', agentDid, { loops_completed: evolution.loops_completed });
}

export function updateTrustDelta(agentDid: string, delta: number): void {
  const evolution = getOrCreateEvolution(agentDid);
  const newDelta = evolution.trust_delta + delta;
  
  // Enforce [-10, 10] range
  evolution.trust_delta = Math.max(-10, Math.min(10, newDelta));
  evolution.last_improved = new Date().toISOString();
  
  trustChain.append('evolution.trust_delta_updated', agentDid, { 
    delta, 
    new_trust_delta: evolution.trust_delta 
  });
}

export function getEvolution(agentDid: string): EvolutionData | undefined {
  return agentsEvolution.get(agentDid);
}

export function clearEvolution(): void {
  agentsEvolution.clear();
}
