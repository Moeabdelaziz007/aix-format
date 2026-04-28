import { create } from 'zustand';

export interface AgentManifest {
  meta: {
    aix_version: string;
    agent_id: string;
    created_at: string;
  };
  persona: {
    name: string;
    archetype?: string;
    description: string;
  };
  capabilities: any;
  security: any;
  identity_layer?: {
    id: string;
    authority: string;
    kyc_proof?: any;
  };
  [key: string]: any;
}

interface AgentState {
  uploadedAgents: AgentManifest[];
  activeAgent: AgentManifest | null;
  addAgent: (agent: AgentManifest) => void;
  setActiveAgent: (agentId: string) => void;
  clearAgents: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  uploadedAgents: [],
  activeAgent: null,
  addAgent: (agent) =>
    set((state) => ({
      uploadedAgents: [...state.uploadedAgents, agent],
      activeAgent: state.activeAgent || agent, // Set as active if it's the first one
    })),
  setActiveAgent: (agentId) =>
    set((state) => ({
      activeAgent: state.uploadedAgents.find((a) => a.meta.agent_id === agentId) || null,
    })),
  clearAgents: () => set({ uploadedAgents: [], activeAgent: null }),
}));
