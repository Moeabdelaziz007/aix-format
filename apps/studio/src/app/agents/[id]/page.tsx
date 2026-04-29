'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Shield, 
  Calendar, 
  Cpu, 
  FileCode,
  Fingerprint,
  Activity,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { AgentRecord } from '@/lib/types';
import DiscoveryPreview from '@/components/studio/DiscoveryPreview';
import { useLocalAgents } from '@/hooks/useLocalAgents';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getAgent, loaded } = useLocalAgents();
  const [agent, setAgent] = useState<AgentRecord | null>(null);

  useEffect(() => {
    if (loaded) {
      const found = getAgent(id);
      if (found) {
        setAgent(found);
      }
    }
  }, [id, getAgent, loaded]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Agent Not Found</h1>
        <p className="text-zinc-400 mb-8 max-w-md">The agent ID "{id}" could not be found in your local studio database.</p>
        <Link 
          href="/my-agents" 
          className="flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Agents
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([agent.yaml], { type: 'application/x-aix' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}.aix`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Navigation */}
        <Link 
          href="/my-agents" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition mb-12 group font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to My Agents
        </Link>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.15)]"
            >
              <Cpu className="w-12 h-12 text-indigo-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-5xl font-black tracking-tighter text-white">{agent.name}</h1>
                <span className="px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                  {agent.kyc_tier || 'unverified'}
                </span>
              </div>
              <p className="text-xl text-zinc-400 font-medium">{agent.role}</p>
            </div>
          </div>
          
          <button 
            onClick={handleDownload}
            className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-[0_20px_50px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Download .aix
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-zinc-800 text-indigo-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Sovereign Identity</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Axiom DID</p>
                    <p className="font-mono text-sm text-indigo-300 break-all leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                      {agent.did || 'did:axiom:pending'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold px-3 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 w-fit">
                    <UserCheck className="w-4 h-4" />
                    KYC Verified • {agent.kyc_tier}
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Temporal Data</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initialization Date</p>
                  <p className="text-2xl font-bold text-zinc-200">
                    {new Date(agent.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {new Date(agent.createdAt).toLocaleTimeString()} (Studio Local Time)
                  </p>
                </div>
              </div>
            </div>

            {/* Discovery Preview */}
            <div className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">MCP Discovery Preview</h3>
                  <p className="text-sm text-zinc-500">How other agents and the network see this agent</p>
                </div>
              </div>
              
              <DiscoveryPreview 
                agentDid={agent.did}
                agentName={agent.name}
              />
            </div>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-10">
            {/* Capabilities */}
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Capabilities</h3>
              <div className="flex flex-col gap-3">
                {agent.abom?.capabilities.map((cap: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 group hover:border-indigo-500/30 transition-all">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{cap}</span>
                  </div>
                )) || (
                  <p className="text-zinc-500 italic text-sm">No capabilities defined</p>
                )}
              </div>
            </div>

            {/* Source Code */}
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-500" />
                  AIX Source
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900 pointer-events-none z-10" />
                <pre className="p-5 bg-black/50 rounded-2xl border border-zinc-800 text-[11px] font-mono text-zinc-500 overflow-x-auto max-h-[400px] leading-relaxed custom-scrollbar group-hover:text-zinc-300 transition-colors">
                  {agent.yaml}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SovereignStatusBar />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}


