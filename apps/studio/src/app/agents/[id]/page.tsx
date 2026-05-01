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
  AlertCircle,
  Rocket,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  MessageCircle,
  Send,
  Zap
} from 'lucide-react';
import { AgentRecord, DeploymentRecord, RegistryEntry } from '@/lib/types';
import { AgentPet } from '@/components/shared/AgentPet';
import DiscoveryPreview from '@/components/studio/DiscoveryPreview';
import AgentInteraction from '@/components/studio/AgentInteraction';
import { useLocalAgents } from '@/hooks/useLocalAgents';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import DeployModal from '@/components/studio/DeployModal';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAgent, saveAgent, loaded } = useLocalAgents();
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSettingUpTg, setIsSettingUpTg] = useState(false);
  const [tgConfig, setTgConfig] = useState<any>(null);

  useEffect(() => {
    if (loaded) {
      const found = getAgent(id);
      if (found) {
        setAgent(found);
        if (searchParams.get('action') === 'deploy') {
          setShowDeploy(true);
        }
        fetchChannels(found.did || `local:${found.id}`);
      }
    }
  }, [id, getAgent, loaded, searchParams]);

  const fetchChannels = async (agentId: string) => {
    try {
      const res = await fetch(`/api/channels/telegram/setup?agentId=${agentId}`, { method: 'GET' });
      // Note: GET not implemented yet in route, but we'll simulate the state
    } catch (e) {}
  };

  const handleSetupTelegram = async () => {
    if (!agent) return;
    setIsSettingUpTg(true);
    try {
      const res = await fetch('/api/channels/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.did || `local:${agent.id}` })
      });
      const data = await res.json();
      if (data.success) {
        setTgConfig(data);
        toast.success(`Telegram Bot Created: @${data.botUsername}`);
      }
    } catch (error) {
      toast.error("Failed to setup Telegram channel");
    } finally {
      setIsSettingUpTg(false);
    }
  };

  if (!loaded) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!agent) return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-4"><AlertCircle className="w-16 h-16 text-zinc-700 mb-6" /><h1 className="text-3xl font-black text-white mb-2">Agent Not Found</h1><Link href="/my-agents" className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all border border-white/5">Return to My Agents</Link></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/my-agents" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition mb-12 group font-bold text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to My Agents
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <AgentPet pet={agent.pet} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-5xl font-black tracking-tighter text-white">{agent.name}</h1>
                <span className="px-3 py-1 text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full uppercase tracking-widest">{agent.kyc_tier}</span>
              </div>
              <p className="text-xl text-zinc-400 font-medium">{agent.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button onClick={handleSetupTelegram} disabled={isSettingUpTg} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-sky-500/30 text-sky-400 font-black rounded-2xl transition-all hover:bg-zinc-800 disabled:opacity-50">
              {isSettingUpTg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
              {tgConfig ? `@${tgConfig.botUsername}` : "Connect Telegram"}
            </button>
            <button onClick={() => setShowDeploy(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-[0_20px_50px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-[0.98]"><Rocket className="w-4 h-4" /> Deploy Agent</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Auto Channels Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-500/5 to-transparent border border-sky-500/10 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Send className="w-20 h-20 text-sky-400" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400"><Send className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-white">Telegram Channel</h3>
                </div>
                {tgConfig ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">Agent is live on Telegram. Anyone can chat with it directly.</p>
                    <a href={tgConfig.botLink} target="_blank" className="flex items-center justify-between p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl group/link transition-all hover:bg-sky-500/20">
                      <span className="font-mono text-sky-300">@{tgConfig.botUsername}</span>
                      <Zap className="w-4 h-4 text-sky-400 group-hover/link:scale-125 transition-transform" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500">Auto-provision a Telegram bot via the AIX Managed Bots infrastructure.</p>
                    <button onClick={handleSetupTelegram} className="text-xs font-black text-sky-400 uppercase tracking-widest hover:text-sky-300 transition">Initialize Bot →</button>
                  </div>
                )}
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageCircle className="w-20 h-20 text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><MessageCircle className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-white">WhatsApp Business</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-zinc-500">Allocates a sub-number under the AIX Verified Business account.</p>
                  <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-black rounded-lg uppercase tracking-widest">Enterprise Only</span>
                </div>
              </div>
            </div>

            <AgentInteraction agentId={agent.did || `local:${agent.id}`} />

            <div className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8"><Cpu className="text-indigo-400" /><div><h3 className="text-2xl font-black text-white">MCP Discovery Preview</h3><p className="text-sm text-zinc-500">How other agents and the network see this agent</p></div></div>
              <DiscoveryPreview agentDid={agent.did} agentName={agent.name} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6"><Fingerprint className="text-indigo-400" /><h3 className="text-lg font-bold text-white">Sovereign Identity</h3></div>
              <div className="space-y-4">
                <div className="space-y-1"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Axiom DID</p><p className="font-mono text-sm text-indigo-300 break-all leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{agent.did || 'did:axiom:pending'}</p></div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold px-3 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 w-fit"><UserCheck className="w-4 h-4" /> KYC Verified • {agent.kyc_tier}</div>
              </div>
            </div>
            
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Capabilities</h3>
              <div className="flex flex-col gap-3">
                {agent.abom?.capabilities.map((cap: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 group hover:border-indigo-500/30 transition-all"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /><span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{cap}</span></div>
                )) || <p className="text-zinc-500 italic text-sm">No capabilities defined</p>}
              </div>
            </div>
          </div>
        </div>

        {showDeploy && <DeployModal agent={agent} onClose={() => setShowDeploy(false)} onDeployed={handleDeployed} />}
      </main>
      <SovereignStatusBar />
    </div>
  );
}
