"use client";
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Clock, 
  TrendingUp,
  Settings2,
  Power,
  RotateCcw,
  CheckCircle2,
  Search,
  Brain,
  Cpu,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/shared';
import { cn } from '@/lib/utils';

function MissionControlContent() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/fleet/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    // Refresh every 30s
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Active Agents', val: metrics.summary.activeAgents, icon: <CheckCircle2 className="text-emerald-400" size={16} />, color: 'emerald' },
      { label: 'Total Skills Learned', val: metrics.summary.totalSkillsLearned, icon: <Brain className="text-primary" size={16} />, color: 'primary' },
      { label: 'Total Fleet', val: metrics.summary.totalAgents, icon: <Layers className="text-zinc-400" size={16} />, color: 'zinc' },
      { label: 'System Health', val: '99.9%', icon: <Zap className="text-amber-400" size={16} />, color: 'amber' },
    ];
  }, [metrics]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase flex items-center gap-4">
                Orchestra Control
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase italic tracking-widest bg-primary/5">Sovereign Fleet</Badge>
             </h1>
             <p className="text-[var(--color-on-surface-variant)] text-sm">Real-time oversight of your autonomous agents, learned skills, and orchestration traces.</p>
          </div>
          <button 
            onClick={() => router.push('/builder')}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/10"
          >
             <Plus size={18} /> Construct New Agent
          </button>
        </div>

        {/* Status Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {loading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] animate-pulse h-32" />
             ))
           ) : (
             stats.map((s, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 key={i} 
                 className="card p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-4"
               >
                  <div className="flex items-center gap-3">
                     <div className={cn("p-2 rounded-xl bg-white/5")}>
                        {s.icon}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</span>
                  </div>
                  <div className="text-4xl font-black text-white italic tracking-tighter">{s.val}</div>
               </motion.div>
             ))
           )}
        </div>

        {/* Agent List Table */}
        <div className="card rounded-[3rem] border-white/5 bg-black/40 overflow-hidden">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Agent Fleet — Active Intelligence</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                 <input 
                  type="text" 
                  placeholder="Filter fleet..."
                  className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-primary/40 transition-all w-48"
                 />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-white/5">
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Agent</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Learned Skills</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tier</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="p-10 text-center text-xs text-zinc-500">Scanning fleet connections...</td></tr>
                    ) : metrics?.agents.map((agent: any) => (
                      <tr key={agent.did} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                         <td className="px-8 py-5">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", agent.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-600')} />
                                  <span className="text-sm font-black text-white italic">{agent.name}</span>
                               </div>
                               <span className="text-[10px] text-zinc-500 font-mono mt-1">{agent.did}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <Badge variant="outline" className={cn(
                               "text-[9px] font-black uppercase tracking-tighter",
                               agent.status === 'active' ? 'border-emerald-500/20 text-emerald-500' : 'border-zinc-800 text-zinc-500'
                            )}>
                               {agent.status}
                            </Badge>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                               <Brain size={12} className="text-primary/60" />
                               <span className="text-xs font-bold text-white font-mono">{agent.learnedSkillsCount}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[10px] font-black uppercase text-zinc-400">{agent.kyc_tier}</span>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => router.push(`/playground?id=${agent.did}`)}
                                 className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                                 title="Open Playground"
                               >
                                  <Zap size={14} />
                               </button>
                               <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                                  <Settings2 size={14} />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="p-6 bg-white/[0.01] flex items-center justify-center">
              <button className="text-[10px] font-black text-zinc-700 hover:text-zinc-500 uppercase tracking-[0.2em] transition-colors">Orchestra Diagnostics v1.3.0</button>
           </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}

export default function MissionControlPage() {
  return (
    <ErrorBoundary boundaryName="MissionControlPage">
      <MissionControlContent />
    </ErrorBoundary>
  );
}

