'use client';

import { useLocalAgents } from '@/hooks/useLocalAgents';
import { useRouter } from 'next/navigation';

export default function MyAgentsPage() {
  const { agents, deleteAgent, loaded } = useLocalAgents();
  const router = useRouter();

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 
                      border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (agents.length === 0) return (
    <div className="flex flex-col items-center justify-center 
                    min-h-screen gap-6 text-center px-4">
      <div className="text-6xl">🤖</div>
      <h1 className="text-2xl font-bold text-white">No agents yet</h1>
      <p className="text-zinc-400 max-w-sm">
        Build your first AIX agent and it will appear here.
      </p>
      <button onClick={() => router.push('/builder')}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 
                   rounded-xl text-white font-medium transition">
        + Build Agent
      </button>
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Agents</h1>
          <p className="text-zinc-400 mt-1">{agents.length} agent
            {agents.length !== 1 ? 's' : ''} saved locally</p>
        </div>
        <button onClick={() => router.push('/builder')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 
                     rounded-lg text-white text-sm font-medium transition">
          + New Agent
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id}
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 
                       hover:border-indigo-600 transition cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 bg-indigo-900/50 rounded-lg 
                              flex items-center justify-center text-xl">
                🤖
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium
                ${agent.kyc_tier === 'verified' 
                  ? 'bg-green-900/50 text-green-400' 
                  : 'bg-zinc-800 text-zinc-400'}`}>
                {agent.kyc_tier ?? 'unverified'}
              </span>
            </div>
            <h3 className="font-semibold text-white group-hover:text-indigo-300 
                           transition">{agent.name}</h3>
            <p className="text-zinc-400 text-sm mt-1">{agent.role}</p>
            {agent.did && (
              <p className="text-xs text-indigo-400 font-mono mt-2 truncate">
                {agent.did}
              </p>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 
                            border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                {new Date(agent.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (confirm(`Delete "${agent.name}"?`)) deleteAgent(agent.id);
                }}
                className="text-xs text-red-400 hover:text-red-300 transition">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
