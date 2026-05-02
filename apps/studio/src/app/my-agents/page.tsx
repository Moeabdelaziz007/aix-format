"use client";

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
          <Link href="/builder"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-black text-sm font-bold hover:brightness-110 transition shadow-[0_0_22px_rgba(57,255,20,0.3)]">
            <Plus className="w-4 h-4" /> Create New Agent
          </Link>
        </motion.div>

            <button onClick={() => router.push('/builder')}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:brightness-110
                         rounded-xl text-black font-bold transition shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
              <Plus className="w-4 h-4" />
              Build Agent
            </button>
          </div>
        </div>

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
      <SovereignStatusBar />
    </div>
  );
}
