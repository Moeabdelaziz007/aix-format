'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { useRegistry } from '@/hooks/useRegistry';
import { useRouter } from 'next/navigation';
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
  Ban,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Search,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/design-system/components';
import { cn } from '@/lib/utils';

export default function MissionControlPage() {
  const { entries, loading, error } = useRegistry();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [liveAgents, setLiveAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        setLiveAgents(data);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const statsCount = useMemo(() => {
    return [
      { label: 'Online', val: liveAgents.length, icon: <CheckCircle2 className="text-emerald-400" size={16} />, color: 'emerald' },
      { label: 'Total Fleet', val: liveAgents.length, icon: <TrendingUp className="text-primary" size={16} />, color: 'primary' },
    ];
  }, [liveAgents]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase flex items-center gap-4">
                Mission Control
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase italic tracking-widest bg-primary/5">Sovereign Fleet</Badge>
             </h1>
             <p className="text-[var(--color-on-surface-variant)] text-sm">Real-time oversight of your deployed autonomous agents and economic output.</p>
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
           {stats.map((s, i) => (
             <div key={i} className="glass-panel-heavy p-6 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                   <div className={cn("p-2 rounded-xl bg-white/5", `text-${s.color}-400`)}>
                      {s.icon}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</span>
                </div>
                <div className="text-4xl font-black text-white italic tracking-tighter">{s.val}</div>
             </div>
           ))}
        </div>

        {/* Heatmap & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Heatmap */}
           <div className="lg:col-span-8 glass-panel-heavy p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Activity className="text-primary" size={18} />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Agent Activity — 24h Heatmap</h3>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-zinc-800" />
                    <div className="w-2 h-2 rounded bg-primary/20" />
                    <div className="w-2 h-2 rounded bg-primary/60" />
                    <div className="w-2 h-2 rounded bg-primary" />
                 </div>
              </div>
              <div className="grid grid-cols-24 gap-1.5 h-20">
                 {Array.from({ length: 48 }).map((_, i) => (
                   <div 
                     key={i} 
                     className="rounded-[4px] transition-all hover:scale-125 cursor-help"
                     style={{ 
                       backgroundColor: i % 7 === 0 ? '#00dbe9' : i % 3 === 0 ? '#00dbe960' : i % 2 === 0 ? '#00dbe920' : '#ffffff05',
                     }}
                   />
                 ))}
              </div>
              <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                 <span>00:00</span>
                 <span>06:00</span>
                 <span>12:00</span>
                 <span>18:00</span>
                 <span>23:59</span>
              </div>
           </div>

           {/* Recent Alerts */}
           <div className="lg:col-span-4 glass-panel-heavy p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center gap-3 text-amber-400">
                 <ShieldAlert size={18} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em]">Recent Alerts</h3>
              </div>
              <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 group cursor-pointer hover:bg-amber-500/15 transition-all">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-amber-500 uppercase">Warning</span>
                       <span className="text-[9px] font-bold text-zinc-600">3m ago</span>
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">'FinanceBot' failed 3 calls in 5 min</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 group cursor-pointer hover:bg-amber-500/15 transition-all">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-amber-500 uppercase">Warning</span>
                       <span className="text-[9px] font-bold text-zinc-600">12m ago</span>
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">'SupportBot' approaching rate limit</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Agent List Table */}
        <div className="glass-panel-heavy rounded-[3rem] border-white/5 bg-black/40 overflow-hidden">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Agent Fleet — Active Deployments</h3>
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
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Name</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tasks</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Earnings</th>
                       <th className="px-8 py-5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {mockAgents.map((agent) => (
                      <tr key={agent.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <div className={cn("w-2 h-2 rounded-full", agent.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : agent.status === 'Warning' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-zinc-600')} />
                               <span className="text-sm font-black text-white italic">{agent.name}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <Badge variant="outline" className={cn(
                               "text-[9px] font-black uppercase tracking-tighter",
                               agent.status === 'Online' ? 'border-emerald-500/20 text-emerald-500' : agent.status === 'Warning' ? 'border-amber-500/20 text-amber-500' : 'border-zinc-800 text-zinc-500'
                            )}>
                               {agent.status}
                            </Badge>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-xs font-bold text-white font-mono">{agent.tasks}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-xs font-bold text-primary font-mono">{agent.earnings}</span>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                               <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                                  {agent.status === 'Warning' ? <RotateCcw size={14} /> : <Power size={14} />}
                               </button>
                               <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                                  <Settings2 size={14} />
                               </button>
                               <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all">
                                  {agent.status === 'Warning' ? 'Check' : 'Stop'}
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="p-6 bg-white/[0.01] flex items-center justify-center">
              <button className="text-[10px] font-black text-zinc-700 hover:text-zinc-500 uppercase tracking-[0.2em] transition-colors">Load More History</button>
           </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
