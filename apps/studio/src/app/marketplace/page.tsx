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
import { AgentCard } from '../../components/marketplace/AgentCard';
import { SkillCard } from '../../components/marketplace/SkillCard';
import { MCPCard } from '../../components/marketplace/MCPCard';
import { PluginCard } from '../../components/marketplace/PluginCard';
import { APICard } from '../../components/marketplace/APICard';
import { AgentDetailModal } from '../../components/marketplace/AgentDetailModal';
import { KYABadge } from '../../components/marketplace/KYABadge';
import FadeIn from '../../components/animations/FadeIn';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: LayoutGrid },
  { id: 'agent', label: 'Agents', icon: Globe },
  { id: 'skill', label: 'Skills', icon: Cpu },
  { id: 'mcp', label: 'MCP Servers', icon: Box },
  { id: 'plugin', label: 'Plugins', icon: Plug },
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
          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-[1px] bg-blue-500" />
            Discover the Ecosystem
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            AIX Marketplace
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mb-10">
            Secure, verified, and high-performance components for your AI agent architecture. Built on the AIX open standard.
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

      <div className="flex gap-12">
        {/* Sidebar */}
        <FilterSidebar />

        {/* Main Content */}
        <main className="flex-grow">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
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
                    return <AgentCard {...props} view={view} />;
                  }

                  switch (item.type) {
                    case 'skill': return <SkillCard {...props} />;
                    case 'mcp': return <MCPCard {...props} />;
                    case 'plugin': return <PluginCard {...props} />;
                    case 'api': return <APICard {...props} />;
                    default: return <AgentCard {...props} />;
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
