"use client";

import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { AgentCard } from '@/components/studio/AgentCard';
import { useRegistry } from '@/hooks/useRegistry';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AgentRecord } from '@/lib/types';

export default function MyAgentsPage() {
  const { entries, loading } = useRegistry();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const agents = useMemo(() => {
    return entries.map(entry => ({
      id: entry.did,
      name: entry.name,
      role: entry.role,
      yaml: entry.yaml,
      createdAt: entry.publishedAt,
      did: entry.did,
      kyc_tier: entry.kyc_tier as any,
      deployment: entry.deployment,
      abom: entry.abom,
    } as AgentRecord));
  }, [entries]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      <div className="w-8 h-8 border-4 border-[var(--color-primary)] 
                      border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">My Agent Fleet</h1>
            <p className="text-[var(--color-on-surface-variant)] mt-2">
              {agents.length} sovereign AIX agent{agents.length !== 1 ? 's' : ''} under your control.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <List className="w-4 h-4" />
               </button>
             </div>

            <button onClick={() => router.push('/builder')}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:brightness-110 
                         rounded-xl text-black font-bold transition shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
              <Plus className="w-4 h-4" />
              Build Agent
            </button>
          </div>
        </div>

        {agents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center 
                      py-32 gap-6 text-center px-4 glass-panel rounded-[2.5rem] border-dashed"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-2">
              🤖
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Your fleet is empty</h2>
              <p className="text-zinc-500 max-w-sm mx-auto">
                The future of decentralized intelligence starts with your first manifest.
              </p>
            </div>
            <button onClick={() => router.push('/builder')}
              className="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10
                         rounded-xl text-white font-bold transition">
              Launch Builder
            </button>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
            : "flex flex-col gap-4"
          }>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>

      <SovereignStatusBar />
    </div>
  );
}
