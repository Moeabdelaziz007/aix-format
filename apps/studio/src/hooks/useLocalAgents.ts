import { useState, useEffect } from 'react';
import { AgentRecord } from '../lib/types';

const STORAGE_KEY = 'aix_local_agents';

export function useLocalAgents() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAgents(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse local agents:', e);
      // Graceful fallback to empty array
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAgents = (newAgents: AgentRecord[]) => {
    try {
      setAgents(newAgents);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAgents));
    } catch (e) {
      console.error('Failed to save agents to localStorage:', e);
    }
  };

  const addAgent = (agent: AgentRecord) => {
    const exists = agents.find(a => a.id === agent.id);
    if (exists) {
      const updated = agents.map(a => a.id === agent.id ? agent : a);
      saveAgents(updated);
    } else {
      saveAgents([...agents, agent]);
    }
  };

  const getAgent = (id: string) => {
    return agents.find(a => a.id === id);
  };

  const deleteAgent = (id: string) => {
    saveAgents(agents.filter(a => a.id !== id));
  };

  return { agents, addAgent, getAgent, deleteAgent, loading };
}
