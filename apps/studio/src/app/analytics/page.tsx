'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/components/shared';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  Activity, 
  Users, 
  Globe, 
  Cpu, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Wallet,
  ArrowDownRight,
  ShieldCheck,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AnalyticsHubPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'performance' | 'users'>('revenue');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        
        // Transform API data to UI structure (simplified)
        setStats({
          revenue: {
            today: data.payoutDue || "0π",
            todayTrend: "+12.5%",
            week: "492.8π",
            weekTrend: "+8.2%",
            month: "1,842.0π",
            monthTrend: "-2.4%",
            payoutStatus: "Processing (0.5π fee)",
            topAgents: [
              { name: "Security Auditor", revenue: "842π", growth: "+15%" },
              { name: "Market Weaver", revenue: "510π", growth: "+8%" }
            ],
            mcpRevenue: [
              { name: "Axiom Search", revenue: "412π" }
            ]
          },
          performance: {
            avgLatency: data.avgLatency || "0ms",
            latencyTrend: "-12ms",
            errorRate: "0.04%",
            errorTrend: "-0.01%",
            tokenUsage: "12.4M",
            tokenTrend: "+1.2M",
            costPerCall: "0.005π",
            costTrend: "Stable"
          },
          users: {
            activeUsers: data.totalCalls ? (data.totalCalls / 4).toFixed(0) : "0",
            userTrend: "+412",
            retention: "78%",
            retentionTrend: "+2%",
            geo: [
              { region: "North America", value: "42%" },
              { region: "Europe", value: "31%" }
            ]
          }
        });
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading || !stats) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase flex items-center gap-4">
                Analytics Hub
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase italic tracking-widest bg-primary/5">Enterprise View</Badge>
             </h1>
             <p className="text-[var(--color-on-surface-variant)] text-sm">Comprehensive revenue, performance, and user retention metrics.</p>
          </div>
          
          <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-2xl">
             {['revenue', 'performance', 'users'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={cn(
                   "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   activeTab === tab 
                     ? "bg-white text-black shadow-xl" 
                     : "text-zinc-500 hover:text-zinc-300"
                 )}
               >
                 {tab}
               </button>
             ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'revenue' && (
            <motion.div 
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Primary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Revenue Today', val: stats.revenue.today, trend: stats.revenue.todayTrend, icon: <DollarSign className="text-emerald-400" /> },
                   { label: 'Weekly Gross', val: stats.revenue.week, trend: stats.revenue.weekTrend, icon: <BarChart3 className="text-primary" /> },
                   { label: 'Monthly Volume', val: stats.revenue.month, trend: stats.revenue.monthTrend, icon: <History className="text-purple-mcp" /> }
                 ].map((s, i) => (
                   <div key={i} className="card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <div className="p-3 rounded-2xl bg-white/5 text-zinc-400">{s.icon}</div>
                         <div className={cn(
                           "flex items-center gap-1 text-[10px] font-black",
                           s.trend.startsWith('+') ? "text-emerald-400" : "text-rose-400"
                         )}>
                            {s.trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {s.trend}
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{s.label}</div>
                         <div className="text-4xl font-black text-white italic tracking-tighter">{s.val}</div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Top Agents */}
                 <div className="lg:col-span-8 card p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Top Performing Agents</h3>
                       <button className="text-[9px] font-black text-primary uppercase hover:underline">View All</button>
                    </div>
                    <div className="space-y-6">
                       {stats.revenue.topAgents.map((agent, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic">{i+1}</div>
                               <div>
                                  <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{agent.name}</div>
                                  <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Growth: {agent.growth}</div>
                               </div>
                            </div>
                            <div className="text-lg font-black text-white italic">{agent.revenue}</div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* MCP Revenue & Payout */}
                 <div className="lg:col-span-4 space-y-8">
                    <div className="card p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-6">
                       <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Revenue by MCP</h3>
                       <div className="space-y-4">
                          {stats.revenue.mcpRevenue.map((mcp, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <span className="text-xs font-bold text-zinc-500">{mcp.name}</span>
                               <span className="text-xs font-black text-white font-mono">{mcp.revenue}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="card p-8 rounded-[3rem] border-emerald-500/10 bg-emerald-500/[0.02] space-y-4">
                       <div className="flex items-center gap-3 text-emerald-400">
                          <Wallet size={18} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Payout Status</h3>
                       </div>
                       <div className="space-y-1">
                          <div className="text-sm font-bold text-white leading-tight">{stats.revenue.payoutStatus}</div>
                          <div className="text-[9px] text-zinc-600 uppercase font-black">Next expected: May 15, 2026</div>
                       </div>
                       <button className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                          Withdraw to Wallet
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div 
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { label: 'Avg Latency', val: stats.performance.avgLatency, trend: stats.performance.latencyTrend, icon: <Clock className="text-blue-400" />, trendColor: 'text-emerald-400' },
                { label: 'Error Rate', val: stats.performance.errorRate, trend: stats.performance.errorTrend, icon: <AlertCircle className="text-rose-400" />, trendColor: 'text-emerald-400' },
                { label: 'Token Usage', val: stats.performance.tokenUsage, trend: stats.performance.tokenTrend, icon: <Cpu className="text-primary" />, trendColor: 'text-primary' },
                { label: 'Cost / Call', val: stats.performance.costPerCall, trend: stats.performance.costTrend, icon: <Zap className="text-amber-400" />, trendColor: 'text-zinc-500' }
              ].map((s, i) => (
                <div key={i} className="card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-white/5">{s.icon}</div>
                      <div className={cn("text-[9px] font-black", s.trendColor)}>{s.trend}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{s.label}</div>
                      <div className="text-3xl font-black text-white italic tracking-tighter">{s.val}</div>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <div className="p-3 rounded-2xl bg-white/5 text-primary"><Users size={20} /></div>
                       <div className="text-emerald-400 text-[10px] font-black">{stats.users.userTrend} New Today</div>
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Users (24h)</div>
                       <div className="text-4xl font-black text-white italic tracking-tighter">{stats.users.activeUsers}</div>
                    </div>
                 </div>
                 <div className="card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <div className="p-3 rounded-2xl bg-white/5 text-purple-mcp"><ShieldCheck size={20} /></div>
                       <div className="text-emerald-400 text-[10px] font-black">{stats.users.retentionTrend} vs prev week</div>
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Retention Rate</div>
                       <div className="text-4xl font-black text-white italic tracking-tighter">{stats.users.retention}</div>
                    </div>
                 </div>
              </div>

              <div className="card p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                       <Globe className="text-primary" size={18} />
                       Geographic Distribution
                    </h3>
                    <PieChart className="text-zinc-700" size={18} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {stats.users.geo.map((g, i) => (
                      <div key={i} className="space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{g.region}</span>
                            <span className="text-xs font-black text-primary">{g.value}</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: g.value }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="h-full bg-primary/40"
                            />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
