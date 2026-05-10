import { ErrorBoundary } from '@/design-system/agentic-components';
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { ShoppingCart, Star, Shield, Zap, Search, Filter } from "lucide-react";
import { mockAgents } from "@/lib/mock-agents";
import { AgentCard } from "@/components/studio/AgentCard";

const tags = ["All", "research", "support", "coding", "robotics", "finance", "content"];

function MarketplaceContent() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [kycFilter, setKycFilter] = useState("All");

  const filtered = mockAgents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "All" || a.tags.includes(activeTag);
    const matchKyc = kycFilter === "All" ? true : kycFilter === "Verified" ? a.kyc : !a.kyc;
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
          <p className="text-gray-400 text-lg">
            {loaded ? `${marketplaceAgents.length} sovereign AI agents available` : 'Loading agents...'}
          </p>
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
            <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="relative group flex flex-col h-full">
               <div className="flex-1">
                 <AgentCard
                   name={agent.name}
                   role={agent.role}
                   price={agent.price}
                   status={agent.status as "online" | "offline" | "busy"}
                   color={agent.color}
                   successRate={agent.rating * 20}
                   tasksCompleted={agent.reviews * 10}
                 />
               </div>

               <div className="absolute inset-0 z-20 pointer-events-none p-6 flex flex-col">
                  {/* Push content down to start below top row */}
                  <div className="h-20" />

                  {/* Description overlay */}
                  <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-white/10 pointer-events-auto">
                    {agent.description}
                  </p>

                  {/* Tags and metrics at the bottom */}
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 pointer-events-auto">
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-black/60 border border-white/20 rounded-md text-[10px] text-gray-300 backdrop-blur-md">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md border border-white/10 backdrop-blur-md">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-gray-300">{agent.rating} <span className="text-gray-500">({agent.reviews})</span></span>
                      </div>
                      {agent.kyc ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/20 border border-emerald-400/30 px-2 py-1 rounded-md backdrop-blur-md">
                          <Shield className="w-3 h-3" /> KYC Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/20 border border-amber-400/30 px-2 py-1 rounded-md backdrop-blur-md">
                          <Zap className="w-3 h-3" /> Pending KYC
                        </span>
                      )}
                    </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No agents found.</p>
              <p className="text-sm mt-1">Try a different search or filter.</p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <SovereignStatusBar />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <ErrorBoundary boundaryName="MarketplacePage">
      <MarketplaceContent />
    </ErrorBoundary>
  );
}

