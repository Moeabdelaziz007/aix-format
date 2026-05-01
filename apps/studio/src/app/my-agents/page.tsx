"use client";

<<<<<<< HEAD
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { AgentCard } from '@/components/studio/AgentCard';
import { useLocalAgents } from '@/hooks/useLocalAgents';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

export default function MyAgentsPage() {
  const { agents, loaded } = useLocalAgents();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      <div className="w-8 h-8 border-4 border-[var(--color-primary)] 
                      border-t-transparent rounded-full animate-spin" />
    </div>
  );
=======
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Plus, Shield, Activity, FileCode } from "lucide-react";
import { AgentCard } from "@/components/studio/AgentCard";
import Link from "next/link";

const initialAgents = [
  { id: 1, name: "Data Analyzer Pro", role: "Data Scientist", price: "0.5", status: "online", kyc: true, color: "#6366f1", calls: 1420, earnings: "710", did: "did:axiom:axiomid.app:agent_001", successRate: 99.2 },
  { id: 2, name: "Customer Support Bot", role: "Support Specialist", price: "0.1", status: "offline", kyc: true, color: "#8b5cf6", calls: 380, earnings: "38", did: "did:axiom:axiomid.app:agent_002", successRate: 96.5 },
];

export default function MyAgentsPage() {
  const [agents] = useState(initialAgents);

  const totalEarnings = agents.reduce((sum, a) => sum + parseFloat(a.earnings), 0).toFixed(1);
  const onlineCount = agents.filter(a => a.status === 'online').length;
>>>>>>> 3f7c412 (feat(studio): complete marketplace, my-agents, network-status, spec pages)

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
<<<<<<< HEAD
          
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
=======
          <Link href="/builder"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-black text-sm font-bold hover:brightness-110 transition shadow-[0_0_22px_rgba(57,255,20,0.3)]">
            <Plus className="w-4 h-4" /> Create New Agent
          </Link>
        </motion.div>
>>>>>>> 3f7c412 (feat(studio): complete marketplace, my-agents, network-status, spec pages)

            <button onClick={() => router.push('/builder')}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:brightness-110 
                         rounded-xl text-black font-bold transition shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
              <Plus className="w-4 h-4" />
              Build Agent
            </button>
          </div>
        </div>

<<<<<<< HEAD
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

=======
        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {agents.map(agent => (
              <motion.div key={agent.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              >
                <AgentCard
                  name={agent.name}
                  role={agent.role}
                  price={agent.price}
                  status={agent.status as "online" | "offline" | "busy"}
                  color={agent.color}
                  successRate={agent.successRate}
                  tasksCompleted={agent.calls}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <FileCode className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No agents deployed yet.</p>
            <p className="text-sm mt-1">Deploy your first sovereign agent to get started.</p>
            <Link href="/builder"
              className="inline-flex mt-6 px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-black text-sm font-bold hover:brightness-110 transition">
              Create your first agent
            </Link>
          </div>
        )}

      </div>
>>>>>>> 3f7c412 (feat(studio): complete marketplace, my-agents, network-status, spec pages)
      <SovereignStatusBar />
    </div>
  );
}
