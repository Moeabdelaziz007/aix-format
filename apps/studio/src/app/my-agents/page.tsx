"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Plus, Shield, Activity, FileCode } from "lucide-react";
import { AgentCard } from "@/components/studio/AgentCard";
import Link from "next/link";

import { useLocalAgents } from "@/hooks/useLocalAgents";

export default function MyAgentsPage() {
  const { agents, loading } = useLocalAgents();

  const totalEarnings = agents.reduce((sum, a) => sum + (parseFloat(a.manifest.economics.currency === 'PI' ? '0.5' : '0')), 0).toFixed(1);
  const onlineCount = agents.filter(a => a.status === 'online').length;

  if (loading) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center"><Activity className="animate-spin text-[var(--color-primary)]" /></div>;

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 md:px-12 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text text-gradient tracking-tight mb-2">My Agents</h1>
            <p className="text-gray-400">Manage your sovereign AI agents — KYC-anchored & Pi-signed.</p>
          </div>
          <Link href="/builder"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-black text-sm font-bold hover:brightness-110 transition shadow-[0_0_22px_rgba(57,255,20,0.3)]">
            <Plus className="w-4 h-4" /> Create New Agent
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Agents", value: agents.length, icon: <FileCode className="w-4 h-4" />, color: "text-indigo-400" },
            { label: "Online Now", value: onlineCount, icon: <Activity className="w-4 h-4" />, color: "text-green-400" },
            { label: "Total Earnings", value: `${totalEarnings} π`, icon: <Shield className="w-4 h-4" />, color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="glass-panel rounded-xl p-4 border border-white/5">
              <div className={`flex items-center gap-2 mb-1 ${s.color}`}>{s.icon}<span className="text-xs">{s.label}</span></div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {agents.map(agent => (
              <motion.div key={agent.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              >
                <AgentCard
                  id={agent.id}
                  name={agent.manifest.meta.name}
                  role={agent.manifest.meta.role}
                  price={agent.manifest.economics.pricing_model === 'free' ? '0' : '0.5'}
                  status={agent.status as "online" | "offline" | "busy"}
                  color={agent.color}
                  successRate={agent.successRate}
                  tasksCompleted={agent.tasksCompleted}
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
