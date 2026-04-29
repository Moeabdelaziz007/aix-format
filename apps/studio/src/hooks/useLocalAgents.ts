"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentRecord, AgentManifest } from "@/lib/types";

const STORAGE_KEY = "aix_studio_agents";

export function useLocalAgents() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load agents from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAgents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local agents", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save agents to localStorage whenever they change
  const saveToStorage = useCallback((updatedAgents: AgentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAgents));
    setAgents(updatedAgents);
  }, []);

  const addAgent = useCallback((manifest: AgentManifest, color?: string) => {
    const newAgent: AgentRecord = {
      id: manifest.identity_layer.id.split(":").pop() || Math.random().toString(36).substr(2, 9),
      manifest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "online",
      color: color || "#6366f1",
      successRate: 100,
      tasksCompleted: 0
    };

    const updated = [...agents, newAgent];
    saveToStorage(updated);
    return newAgent;
  }, [agents, saveToStorage]);

  const updateAgent = useCallback((id: string, manifest: AgentManifest) => {
    const updated = agents.map(a => 
      a.id === id ? { ...a, manifest, updatedAt: new Date().toISOString() } : a
    );
    saveToStorage(updated);
  }, [agents, saveToStorage]);

  const deleteAgent = useCallback((id: string) => {
    const updated = agents.filter(a => a.id !== id);
    saveToStorage(updated);
  }, [agents, saveToStorage]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return {
    agents,
    isLoading,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent
  };
}
