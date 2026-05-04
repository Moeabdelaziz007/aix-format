"use client";

import { AgentCard } from "@/components/agents/AgentCard";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { mockAgents } from "@/lib/mock-agents";

export function AgentsDashboard() {
  const { agents } = useLocalAgents();
  
  // Fallback to mock agents if none locally
  const displayAgents = agents.length > 0 ? agents.slice(0, 2) : mockAgents.slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white mb-2">My Agents</h2>
      <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
        {displayAgents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
          />
        ))}
      </div>
    </div>
  );
}
