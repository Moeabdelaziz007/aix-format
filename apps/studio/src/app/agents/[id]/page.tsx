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
  RefreshCw
} from 'lucide-react';
import { AgentRecord, DeploymentRecord, RegistryEntry } from '@/lib/types';
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

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [deployComplete, setDeployComplete] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (loaded) {
      const found = getAgent(id);
      if (found) {
        setAgent(found);
        if (searchParams.get('action') === 'deploy') {
          setShowDeploy(true);
        }
      }
    }
  }, [id, getAgent, loaded, searchParams]);

  const handleDeployed = (deployment: DeploymentRecord) => {
    if (agent) {
      setAgent({ ...agent, deployment });
    }
  };

  const handleDownload = () => {
    if (!agent) return;
    const blob = new Blob([agent.yaml], { type: 'application/x-aix' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}.aix`;
    a.click();
  };

  const handlePublishToMcp = async () => {
    if (!agent) return;
    setIsPublishing(true);
    try {
      const entry: RegistryEntry = {
        did: agent.did || `did:aix:${agent.id}`,
        name: agent.name,
        role: agent.role,
        capabilities: agent.abom?.capabilities || [],
        kyc_tier: agent.kyc_tier || 'unverified',
        specVersion: "1.0.0",
        publishedAt: new Date().toISOString(),
        yaml: agent.yaml
      };
      const res = await fetch('/api/mcp-discovery/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error('Failed to register agent');
      const data = await res.json();
      setAgent({ ...agent, published: true });
      toast.success(data.message || 'Agent published to MCP discovery');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish agent');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishFromMcp = async () => {
    if (!agent?.did) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/mcp-discovery/register?did=${agent.did}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to unregister agent');
      setAgent({ ...agent, published: false });
      toast.success('Agent removed from MCP discovery');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unregister agent');
    } finally {
      setIsPublishing(false);
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
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              <Cpu className="w-12 h-12 text-indigo-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-5xl font-black tracking-tighter text-white">{agent.name}</h1>
                <Badge variant="outline" className="text-indigo-400 border-indigo-500/20">{agent.kyc_tier}</Badge>
                {agent.status === 'online' && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">LIVE</Badge>}
              </div>
              <p className="text-xl text-zinc-400 font-medium">{agent.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button onClick={handleDownload} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black rounded-2xl transition-all border border-white/5 hover:text-white"><Download className="w-4 h-4" /> Download .aix</button>
            {agent.published ? (
              <button onClick={handleUnpublishFromMcp} disabled={isPublishing} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-emerald-500/30 text-emerald-400 font-black rounded-2xl transition-all hover:bg-zinc-800 disabled:opacity-50">{isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} MCP Published</button>
            ) : (
              <button onClick={handlePublishToMcp} disabled={isPublishing} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-indigo-500/30 text-indigo-400 font-black rounded-2xl transition-all hover:bg-zinc-800 disabled:opacity-50 group">{isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />} Publish to MCP</button>
            )}
            <button onClick={() => setShowDeploy(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-[0_20px_50px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-[0.98]"><Rocket className="w-4 h-4" /> Deploy Agent</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6"><Fingerprint className="text-indigo-400" /><h3 className="text-lg font-bold text-white">Sovereign Identity</h3></div>
                <div className="space-y-4">
                  <div className="space-y-1"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Axiom DID</p><p className="font-mono text-sm text-indigo-300 break-all leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{agent.did || 'did:axiom:pending'}</p></div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold px-3 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 w-fit"><UserCheck className="w-4 h-4" /> KYC Verified • {agent.kyc_tier}</div>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6"><Calendar className="text-amber-400" /><h3 className="text-lg font-bold text-white">Temporal Data</h3></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initialization Date</p><p className="text-2xl font-bold text-zinc-200">{new Date(agent.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p><p className="text-sm text-zinc-500">{new Date(agent.createdAt).toLocaleTimeString()} (Studio Local Time)</p></div>
              </div>
            </div>

            <AgentInteraction agentId={agent.did || `local:${agent.id}`} />

            <div className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8"><Cpu className="text-indigo-400" /><div><h3 className="text-2xl font-black text-white">MCP Discovery Preview</h3><p className="text-sm text-zinc-500">How other agents and the network see this agent</p></div></div>
              <DiscoveryPreview agentDid={agent.did} agentName={agent.name} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Capabilities</h3>
              <div className="flex flex-col gap-3">
                {agent.abom?.capabilities.map((cap: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 group hover:border-indigo-500/30 transition-all"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /><span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{cap}</span></div>
                )) || <p className="text-zinc-500 italic text-sm">No capabilities defined</p>}
              </div>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden group">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6"><FileCode className="text-amber-500" /> AIX Source</h3>
              <div className="relative"><div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900 pointer-events-none z-10" /><pre className="p-5 bg-black/50 rounded-2xl border border-zinc-800 text-[11px] font-mono text-zinc-500 overflow-x-auto max-h-[400px] leading-relaxed custom-scrollbar group-hover:text-zinc-300 transition-colors">{agent.yaml}</pre></div>
            </div>
          </div>
        </div>

        {showDeploy && <DeployModal agent={agent} onClose={() => setShowDeploy(false)} onDeployed={handleDeployed} />}
      </main>
      <SovereignStatusBar />
    </div>
  );
}
