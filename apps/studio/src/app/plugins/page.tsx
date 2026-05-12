"use client";
'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/components/shared';
import { 
  Download, 
  Star, 
  ShieldCheck, 
  LayoutGrid, 
  Cpu, 
  Wallet, 
  FileSearch, 
  Palette,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', label: 'All Plugins', icon: <LayoutGrid size={16} /> },
  { id: 'kyc', label: 'KYC Providers', icon: <ShieldCheck size={16} /> },
  { id: 'connectors', label: 'Connectors', icon: <Cpu size={16} /> },
  { id: 'pricing', label: 'Pricing Engines', icon: <Wallet size={16} /> },
  { id: 'audit', label: 'Audit Loggers', icon: <FileSearch size={16} /> },
  { id: 'themes', label: 'UI Themes', icon: <Palette size={16} /> },
];

const PLUGINS = [
  {
    id: 'axiom_trust_guard',
    name: 'Axiom Trust Guard',
    description: 'Advanced biometric identity verification and KYC anchoring for institutional agents.',
    category: 'kyc',
    downloads: '4.2k',
    rating: 4.9,
    status: 'installed',
    compatibility: 'v1.3',
    developer: { id: 'axiom_labs', name: 'Axiom Labs' },
    icon: <ShieldCheck className="text-emerald-400" />
  },
  {
    id: 'supabase_connector',
    name: 'Supabase Connector',
    description: 'Seamless M2M database connectivity for storing agent state and execution history.',
    category: 'connectors',
    downloads: '12.8k',
    rating: 4.8,
    status: 'available',
    compatibility: 'v1.3',
    developer: { id: 'supabase_dev', name: 'Supabase' },
    icon: <Cpu className="text-blue-400" />
  },
  {
    id: 'dynamic_pi_pricer',
    name: 'Dynamic PI Pricer',
    description: 'Real-time market-adjusted pricing engine for agent service billing in PI Network.',
    category: 'pricing',
    downloads: '2.1k',
    rating: 4.7,
    status: 'installed',
    compatibility: 'v1.3',
    developer: { id: 'pi_ecosystem', name: 'Pi Ecosystem' },
    icon: <Wallet className="text-amber-400" />
  },
  {
    id: 'immutable_logger',
    name: 'Immutable Logger',
    description: 'Cryptographically signed audit logs for all agent decisions and tool invocations.',
    category: 'audit',
    downloads: '8.4k',
    rating: 4.9,
    status: 'active',
    compatibility: 'v1.2+',
    developer: { id: 'axiom_labs', name: 'Axiom Labs' },
    icon: <FileSearch className="text-purple-mcp" />
  },
  {
    id: 'aether_dark_theme',
    name: 'Aether Dark Theme',
    description: 'A deep indigo and neon teal UI theme for the Sovereign Studio dashboard.',
    category: 'themes',
    downloads: '1.5k',
    rating: 4.5,
    status: 'available',
    compatibility: 'v1.0+',
    developer: { id: 'design_ninja', name: 'Design Ninja' },
    icon: <Palette className="text-pink-400" />
  }
];

export default function PluginDirectoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlugins = PLUGINS.filter(plugin => {
    const matchesCategory = activeCategory === 'all' || plugin.category === activeCategory;
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase">Plugin Directory</h1>
            <p className="text-[var(--color-on-surface-variant)] max-w-2xl leading-relaxed">
              Expand your agent's functionality with verified extensions, connectors, and thematic upgrades from the community.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all w-full md:w-64"
                />
             </div>
             <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                <Plus size={16} /> Publish Plugin
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-3 space-y-2">
             <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 ml-2">Categories</div>
             {CATEGORIES.map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={cn(
                   "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border group",
                   activeCategory === cat.id 
                     ? "bg-primary/10 border-primary/20 text-white shadow-lg shadow-primary/5" 
                     : "bg-transparent border-transparent text-zinc-500 hover:bg-white/5 hover:text-white"
                 )}
               >
                 <div className="flex items-center gap-4">
                    <span className={cn(
                      "transition-colors",
                      activeCategory === cat.id ? "text-primary" : "text-zinc-600 group-hover:text-zinc-300"
                    )}>
                       {cat.icon}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{cat.label}</span>
                 </div>
                 {activeCategory === cat.id && <ChevronRight size={14} className="text-primary" />}
               </button>
             ))}
          </div>

          {/* Plugin Grid */}
          <div className="lg:col-span-9">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredPlugins.map((plugin, i) => (
                    <motion.div
                      key={plugin.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className="group card p-6 rounded-[2.5rem] border-white/5 hover:border-primary/40 hover:bg-white/[0.03] transition-all flex flex-col gap-6 relative overflow-hidden"
                    >
                       <div className="flex items-start justify-between">
                          <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-2xl shadow-2xl relative">
                             {plugin.icon}
                             {plugin.status === 'active' && (
                               <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--color-background)] animate-pulse" />
                             )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-[8px] font-black border-white/10 text-zinc-500">
                               {plugin.compatibility}
                            </Badge>
                            {plugin.status === 'installed' && (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] font-black">INSTALLED</Badge>
                            )}
                            {plugin.status === 'active' && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black">ACTIVE</Badge>
                            )}
                          </div>
                       </div>

                       <div className="space-y-1">
                          <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">{plugin.name}</h3>
                          <Link 
                            href={`/plugins/dev/${plugin.developer.id}`}
                            className="text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                          >
                             By {plugin.developer.name} <ExternalLink size={10} />
                          </Link>
                       </div>

                       <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px] line-clamp-2">
                          {plugin.description}
                       </p>

                       <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5">
                                <Download size={14} className="text-zinc-600" />
                                <span className="text-[10px] font-bold text-white">{plugin.downloads}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-bold text-white">{plugin.rating}</span>
                             </div>
                          </div>
                          <button 
                            className={cn(
                              "px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                              plugin.status === 'available' 
                                ? "bg-white text-black border-white hover:bg-primary hover:border-primary" 
                                : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                            )}
                          >
                             {plugin.status === 'available' ? 'Install' : 'Manage'}
                          </button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>

             {filteredPlugins.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                  <LayoutGrid size={48} className="text-zinc-600" />
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600">No plugins found matching your search</div>
               </div>
             )}
          </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}

