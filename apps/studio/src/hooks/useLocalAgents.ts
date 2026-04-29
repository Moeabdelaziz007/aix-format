import { useState, useEffect } from 'react';
import { AgentRecord } from '@/lib/types';

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

  const addAgent = (manifest: any, color: string = '#00d4ff') => {
    const id = manifest.identity_layer?.id?.split(':').pop() || Math.random().toString(36).substring(7);
    const newAgent: AgentRecord = {
      id,
      name: manifest.meta.name,
      role: manifest.meta.role || manifest.persona?.role || 'Agent',
      createdAt: new Date().toISOString(),
      yaml: '', // This will be set by the caller if needed
      manifest,
      color,
      status: 'online',
      successRate: 100,
      tasksCompleted: 0
    };

    const exists = agents.find(a => a.id === id);
    let updatedAgents;
    if (exists) {
      updatedAgents = agents.map(a => a.id === id ? newAgent : a);
    } else {
      updatedAgents = [...agents, newAgent];
    }
    
    saveAgents(updatedAgents);
    return newAgent;
  };

  const getAgent = (id: string) => {
    return agents.find(a => a.id === id);
  };

  const deleteAgent = (id: string) => {
    saveAgents(agents.filter(a => a.id !== id));
  };

  return { agents, addAgent, getAgent, deleteAgent, loading };
}
