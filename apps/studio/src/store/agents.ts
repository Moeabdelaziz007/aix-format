import { create } from "zustand";
import type { LoadedAgent, VoiceState } from "@/lib/aix/schema";

interface AgentStore {
  agents: LoadedAgent[];
  activeId: string | null;
  hydrated: boolean;
  setAgents: (agents: LoadedAgent[]) => void;
  addAgent: (agent: LoadedAgent) => void;
  removeAgent: (id: string) => void;
  setActive: (id: string | null) => void;
  setVoiceState: (id: string, state: VoiceState) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  activeId: null,
  hydrated: false,
  setAgents: (agents) => set({ agents, hydrated: true, activeId: agents[0]?.manifest.meta.id ?? null }),
  addAgent: (agent) =>
    set((s) => ({
      agents: [agent, ...s.agents.filter((a) => a.manifest.meta.id !== agent.manifest.meta.id)],
      activeId: agent.manifest.meta.id,
    })),
  removeAgent: (id) =>
    set((s) => ({
      agents: s.agents.filter((a) => a.manifest.meta.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),
  setActive: (id) => set({ activeId: id }),
  setVoiceState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.manifest.meta.id === id ? { ...a, voiceState: state } : a,
      ),
    })),
}));
