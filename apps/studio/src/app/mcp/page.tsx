'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/components/shared';
import { 
  Box, 
  Search, 
  Filter, 
  Cpu, 
  Database, 
  Globe, 
  FileCode,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ["All", "Finance", "Data", "Communication", "DevTools", "AI"];

const MCP_SERVERS = [
  {
    name: "Yahoo Finance API",
    id: "mcp:finance:yahoo",
    category: "Finance",
    provider: "Yahoo",
    verified: true,
    description: "Real-time market data, quotes, and historical financial statistics.",
    tools: ["getQuote", "getHistory", "search", "getSummary", "getNews"],
    users: "1,247",
    rating: 4.8,
    status: "Verified",
    connection: "SSE",
    auth: "None"
  },
  {
    name: "Slack Integration",
    id: "mcp:comm:slack",
    category: "Communication",
    provider: "Slack",
    verified: true,
    description: "Enable your agent to send messages and manage channels in Slack workspaces.",
    tools: ["sendMessage", "createChannel", "uploadFile"],
    users: "892",
    rating: 4.5,
    status: "Verified",
    connection: "HTTP",
    auth: "OAuth2"
  },
  {
    name: "PostgreSQL Connector",
    id: "mcp:data:postgres",
    category: "Data",
    provider: "Community",
    verified: false,
    description: "Direct secure access to PostgreSQL databases for structured data operations.",
    tools: ["query", "insert", "update", "delete"],
    users: "156",
    rating: 4.2,
    status: "Pending Review",
    connection: "STDIO",
    auth: "Credentials"
  },
  {
    name: "Axiom Core Context",
    id: "mcp:axiom:core",
    category: "AI",
    provider: "Axiom Foundation",
    verified: true,
    description: "Standard library for AIX agent reasoning and manifest validation.",
    tools: ["scanABOM", "verifyDID", "resolveAxiom"],
    users: "12.4k",
    rating: 4.9,
    status: "Verified",
    connection: "SSE",
    auth: "None"
  }
];

export default function MCPRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const filteredServers = MCP_SERVERS.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         server.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || server.category === activeCategory;
    const matchesVerified = !verifiedOnly || server.verified;
    return matchesSearch && matchesCategory && matchesVerified;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-mcp/20 text-purple-mcp border border-purple-mcp/30">
                   <Box size={24} />
                </div>
                <Typography variant="h1" className="text-4xl font-black text-white italic uppercase tracking-tighter">
                   MCP Registry
                </Typography>
             </div>
             <p className="text-zinc-500 max-w-2xl text-sm font-medium uppercase tracking-widest leading-relaxed">
                Discover & connect Model Context Protocol nodes to expand agent capabilities.
             </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-mcp transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search MCP servers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-mcp transition-all"
                />
             </div>
             <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="verified-only"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-black/40 text-purple-mcp focus:ring-purple-mcp" 
                />
                <label htmlFor="verified-only" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer select-none">
                   Verified Only
                </label>
             </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-4 custom-scrollbar">
           {CATEGORIES.map(cat => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={cn(
                 "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                 activeCategory === cat 
                   ? "bg-purple-mcp text-black shadow-lg shadow-purple-mcp/20" 
                   : "bg-white/[0.03] text-zinc-600 border border-white/5 hover:border-white/10 hover:text-white"
               )}
             >
               {cat}
             </button>
           ))}
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence mode="popLayout">
              {filteredServers.map((server) => (
                <motion.div
                  layout
                  key={server.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group card p-8 rounded-[3rem] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-purple-mcp/30 transition-all flex flex-col gap-6"
                >
                  <div className="flex items-start justify-between">
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-purple-mcp">
                        {server.category === 'Finance' ? <Zap size={24} /> : server.category === 'Data' ? <Database size={24} /> : <Cpu size={24} />}
                     </div>
                     <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                           <span className="text-[10px] font-black text-white">{server.rating}</span>
                           <Zap size={10} className="text-amber-400 fill-amber-400" />
                        </div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{server.users} Users</p>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-mcp transition-colors">{server.name}</h3>
                        {server.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                     </div>
                     <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">
                        {server.category} | Provider: {server.provider}
                     </p>
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed min-h-[48px]">
                     {server.description}
                  </p>

                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tools ({server.tools.length})</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {server.tools.slice(0, 3).map(tool => (
                          <div key={tool} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400">
                             {tool}
                          </div>
                        ))}
                        {server.tools.length > 3 && (
                          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-600">
                             +{server.tools.length - 3} more
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
                     <button className="flex-1 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                        View Details
                     </button>
                     <button className="px-6 py-4 rounded-2xl bg-purple-mcp/10 border border-purple-mcp/20 text-purple-mcp font-black text-[10px] uppercase tracking-widest hover:bg-purple-mcp hover:text-black transition-all">
                        Add to Agent
                     </button>
                  </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {filteredServers.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
             <Filter size={64} className="text-zinc-800" />
             <div className="space-y-2">
                <Typography variant="h4" className="text-white uppercase italic">No MCP Servers Found</Typography>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Try adjusting your filters or search query</p>
             </div>
          </div>
        )}
      </main>

      <SovereignStatusBar />
    </div>
  );
}
