'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid2X2, 
  List, 
  ArrowUpDown, 
  ChevronRight,
  LayoutGrid,
  Box,
  Cpu,
  Plug,
  Globe
} from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';
import { SearchBar } from '../../components/marketplace/SearchBar';
import { FilterSidebar } from '../../components/marketplace/FilterSidebar';
import { AgentCard } from '@/components/agents/AgentCard';
import { SkillCard } from '../../components/marketplace/SkillCard';
import { MCPCard } from '../../components/marketplace/MCPCard';
import { PluginCard } from '../../components/marketplace/PluginCard';
import { APICard } from '../../components/marketplace/APICard';
import { AgentDetailModal } from '../../components/marketplace/AgentDetailModal';
import { KYABadge } from '@/components/agents/AgentCard';
import FadeIn from '../../components/animations/FadeIn';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: LayoutGrid },
  { 
    id: 'agent', 
    label: 'Agents', 
    icon: Globe, 
    sub: [
      { name: 'Research', capabilities: ['Market Analysis', 'Web Scraping', 'Synthesis'] },
      { name: 'Security', capabilities: ['Audit', 'Identity', 'Monitoring'] },
      { name: 'Finance', capabilities: ['Forecasting', 'Settlement', 'KYC'] },
      { name: 'Code', capabilities: ['Review', 'Refactor', 'Testing'] }
    ] 
  },
  { 
    id: 'skill', 
    label: 'Skills', 
    icon: Cpu, 
    sub: [
      { name: 'Automation', capabilities: ['Workflow', 'Scheduling'] },
      { name: 'Analysis', capabilities: ['Sentiment', 'Classification'] }
    ] 
  },
  { id: 'mcp', label: 'MCP Servers', icon: Box, sub: [{ name: 'Database', capabilities: ['SQL', 'NoSQL'] }] },
  { id: 'plugin', label: 'Plugins', icon: Plug, sub: [{ name: 'UI', capabilities: ['Theming', 'Components'] }] },
];

export default function MarketplacePage() {
  const { 
    items, 
    isLoading, 
    search, 
    setSearch, 
    type, 
    setType, 
    view, 
    setView 
  } = useMarketplace();

  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <AgentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      {/* Header Section */}
      <header className="mb-12">
        <FadeIn>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-[1px] bg-indigo-500" />
            Adopt Your AI Companion
          </div>
          <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent tracking-tighter">
            Pet Adoption Center
          </h1>
          <p className="text-xl text-white/40 max-w-2xl mb-10 font-medium">
            Browse through our verified collection of AI pets. Each pet comes with a unique set of skills, memory, and personality, ready to be adopted into your fleet.
          </p>
        </FadeIn>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
          <SearchBar value={search} onChange={setSearch} isLoading={isLoading} />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              >
                <Grid2X2 size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              >
                <List size={18} />
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-white/60 hover:text-white hover:border-white/20 transition-all">
              <ArrowUpDown size={16} /> Sort: Popular
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar - Hidden on mobile, visible on lg screens */}
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-grow min-w-0">
          {/* Category Tabs & Sub-categories */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setType(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                    type === cat.id 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <cat.icon size={16} />
                  {cat.label}
                </button>
              ))}
            </div>

            {type !== 'all' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 pl-2"
              >
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">Sub-categories:</div>
                {CATEGORIES.find(c => c.id === type)?.sub?.map(s => (
                  <button key={s.name} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:text-white transition-all">
                    {s.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Grid/List of items */}
          {isLoading ? (
            <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div 
                layout
                className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
              >
                {items?.map((item) => {
                  const props = {
                    key: item.id,
                    item,
                    onClick: () => setSelectedItem(item),
                  };

                  if (view === 'list' || item.type === 'agent') {
                    return <AgentCard context="marketplace" item={item} view={view} onClick={props.onClick} key={props.key} />;
                  }

                  switch (item.type) {
                    case 'skill': return <SkillCard {...props} />;
                    case 'mcp': return <MCPCard {...props} />;
                    case 'plugin': return <PluginCard {...props} />;
                    case 'api': return <APICard {...props} />;
                    default: return <AgentCard context="marketplace" item={item} onClick={props.onClick} key={props.key} />;
                  }
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {!isLoading && items?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <LayoutGrid size={40} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-white/40 max-w-sm mb-8">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button 
                onClick={() => { setSearch(''); setType('all'); }}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
