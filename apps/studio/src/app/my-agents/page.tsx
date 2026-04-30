"use client";

import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { AgentCard } from '@/components/studio/AgentCard';
import { useRegistry } from '@/hooks/useRegistry';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { useState, useMemo, useEffect, Component, ReactNode } from 'react';
import { AgentRecord } from '@/lib/types';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function MyAgentsPage() {
  const { entries, loading, error, refresh } = useRegistry();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isClient, setIsClient] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => setShowSkeleton(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const agents = useMemo(() => {
    return entries.map(entry => ({
      id: entry.did,
      name: entry.name,
      role: entry.role,
      yaml: entry.yaml,
      createdAt: entry.publishedAt,
      did: entry.did,
      kyc_tier: entry.kyc_tier as any,
      deployment: entry.deployment,
      abom: entry.abom,
    } as AgentRecord));
  }, [entries]);

  const ErrorState = (
    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-4 glass-panel rounded-[2.5rem] border-red-500/20 bg-red-500/[0.02]">
      <div className="p-4 rounded-full bg-red-500/10 text-red-500">
        <AlertCircle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-zinc-500 max-w-sm mx-auto">
          {error || "Failed to load your agent fleet. Please try again."}
        </p>
      </div>
      <button
        onClick={() => {
          refresh();
          window.location.reload();
        }}
        className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );

  const LoadingState = (
    <div className={viewMode === 'grid'
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      : "flex flex-col gap-4"
    }>
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-panel h-64 rounded-[2.5rem] border border-white/10 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      ))}
    </div>
  );

  const EmptyState = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center
                py-32 gap-6 text-center px-4 glass-panel rounded-[2.5rem] border-dashed border-white/10"
    >
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-2 opacity-30 grayscale grayscale-100">
        <Cpu className="w-12 h-12 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">No agents deployed yet</h2>
        <p className="text-zinc-500 max-w-sm mx-auto">
          The future of decentralized intelligence starts with your first manifest.
        </p>
      </div>
      <button onClick={() => router.push('/builder')}
        className="mt-4 px-8 py-3 bg-[var(--color-primary)] hover:brightness-110
                   rounded-xl text-black font-bold transition shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
        Deploy Your First Agent
      </button>
    </motion.div>
  );

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">My Agent Fleet</h1>
            <p className="text-[var(--color-on-surface-variant)] mt-2">
              {loading ? "Scanning registry..." : `${agents.length} sovereign AIX agent${agents.length !== 1 ? 's' : ''} under your control.`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <List className="w-4 h-4" />
               </button>
             </div>

            <button onClick={() => router.push('/builder')}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:brightness-110 
                         rounded-xl text-black font-bold transition shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
              <Plus className="w-4 h-4" />
              Build Agent
            </button>
          </div>
        </div>

        <ErrorBoundary fallback={ErrorState}>
          {error ? ErrorState : (
            (loading || showSkeleton) ? LoadingState : (
              agents.length === 0 ? EmptyState : (
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "flex flex-col gap-4"
                }>
                  {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )
            )
          )}
        </ErrorBoundary>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
