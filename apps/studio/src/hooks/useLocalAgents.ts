'use client';

import { useEffect, useState, useCallback } from 'react';
import { AgentRecord } from '@/lib/types';

const STORAGE_KEY = 'aix_agents';

function readStorage(): AgentRecord[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentRecord[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(agents: AgentRecord[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch {
    console.error('localStorage write failed');
  }
}

export function useLocalAgents() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAgents(readStorage());
    setLoaded(true);
  }, []);

  const saveAgent = useCallback((agent: AgentRecord) => {
    setAgents(prev => {
      const idx = prev.findIndex(a => a.id === agent.id);
      const updated = idx >= 0
        ? prev.map(a => a.id === agent.id ? agent : a)
        : [...prev, agent];
      writeStorage(updated);
      return updated;
    });
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id);
      writeStorage(updated);
      return updated;
    });
  }, []);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return { agents, saveAgent, deleteAgent, getAgent, loaded };
}
