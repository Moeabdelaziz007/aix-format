"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { ShoppingCart, Star, Shield, Zap, Search, Filter } from "lucide-react";
import { AgentCard } from "@/components/studio/AgentCard";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { mockAgents } from "@/lib/mock-agents";
import { AgentRecord } from "@/lib/types";

const tags = ["All", "research", "support", "coding", "robotics", "finance", "content"];

export default function MarketplacePage() {
  const { agents: localAgents } = useLocalAgents();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [kycFilter, setKycFilter] = useState("All");

  const allAgents: AgentRecord[] = useMemo(() => [
    ...mockAgents,
    ...localAgents
  ], [localAgents]);

  const filtered = allAgents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                       a.role.toLowerCase().includes(search.toLowerCase());
    
    const agentTags = a.abom?.capabilities || [];
    const matchTag = activeTag === "All" || agentTags.some(t => t.toLowerCase() === activeTag.toLowerCase());
    
    const isVerified = a.kyc_tier && a.kyc_tier !== 'unverified';
    const matchKyc = kycFilter === "All" ? true : kycFilter === "Verified" ? isVerified : !isVerified;
    
    return matchSearch && matchTag && matchKyc;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text text-gradient tracking-tight mb-2">
            Agent Marketplace
          </h1>
          <p className="text-gray-400 text-lg">Discover sovereign AI agents — all KYC-verified via Pi Network.</p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)]/50 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 text-white focus:outline-none focus:border-[var(--color-primary)]/50 transition appearance-none"
            >
              <option value="All">All Tiers</option>
              <option value="Verified">KYC Verified</option>
              <option value="Unverified">Pending KYC</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="text-gray-500 w-4 h-4" />
            {tags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTag === tag
                    ? "bg-[var(--color-primary)] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {filtered.map(agent => (
            <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
               <AgentCard agent={agent} showDeploy />
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No agents found.</p>
            <p className="text-sm mt-1">Try a different search or filter.</p>
          </div>
        )}
      </div>
      <SovereignStatusBar />
    </div>
  );
}
