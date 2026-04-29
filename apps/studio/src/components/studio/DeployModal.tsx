'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { AgentRecord, DeploymentRecord } from '@/lib/types';
import { useLocalAgents } from '@/hooks/useLocalAgents';

interface Props {
  agent: AgentRecord;
  onClose: () => void;
  onDeployed: (deployment: DeploymentRecord) => void;
}

export default function DeployModal({ agent, onClose, onDeployed }: Props) {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<DeploymentRecord | null>(null);
  const [error, setError] = useState('');
  const { saveAgent } = useLocalAgents();

  const handleDeploy = async () => {
    setStatus('deploying');
    try {
      // Small artificial delay for "sovereign feel"
      await new Promise(r => setTimeout(r, 1500));
      
      const res = await fetch('/api/deploy-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const deployment = data.deployment as DeploymentRecord;
      setResult(deployment);
      setStatus('done');

      // Persist deployment to localStorage
      saveAgent({ ...agent, deployment });
      onDeployed(deployment);
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0e0e12] border border-white/10 rounded-[2rem] p-8 max-w-lg w-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-3">
              <Rocket className="w-6 h-6 text-indigo-400" />
              Deploy Agent
            </h2>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Provisioning sovereign instance for <span className="text-white">{agent.name}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="relative z-10"
            >
              {/* Pre-deploy checklist */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4 mb-8">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Pre-Flight Checklist</h3>
                {[
                  { label: 'Sovereign DID Assigned', ok: !!agent.did, icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: 'AxiomID KYC Verified', ok: !!agent.kyc_tier && agent.kyc_tier !== 'unverified', icon: <Globe className="w-4 h-4" /> },
                  { label: 'Agent Capabilities Linked', ok: (agent.abom?.capabilities?.length ?? 0) > 0, icon: <Zap className="w-4 h-4" /> },
                  { label: 'ABOM Integrity Sealed', ok: !!agent.abom?.integrity_hash, icon: <Activity className="w-4 h-4" /> },
                ].map(({ label, ok, icon }) => (
                  <div key={label} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={ok ? 'text-emerald-400' : 'text-zinc-600'}>
                        {icon}
                      </div>
                      <span className={ok ? 'text-zinc-300' : 'text-zinc-600'}>{label}</span>
                    </div>
                    <span className={ok ? 'text-emerald-400' : 'text-amber-500/50'}>
                      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleDeploy}
                className="w-full group py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3"
              >
                🚀 Initialize Deployment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {status === 'deploying' && (
            <motion.div
              key="deploying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 relative z-10"
            >
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Synchronizing with Network</h3>
              <p className="text-zinc-500 text-sm max-w-[280px] mx-auto">Publishing agent manifest to the decentralized MCP registry...</p>
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 relative z-10"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white">Agent Live</h3>
                <p className="text-zinc-500 text-sm">Successfully deployed to the AIX network</p>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Public Endpoint</span>
                  <div className="mt-2 flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-indigo-400 font-mono text-xs truncate">{result.endpointUrl}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">MCP Discovery URL</span>
                  <div className="mt-2 flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-emerald-400 font-mono text-xs truncate">{result.mcpUrl}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-white font-bold transition-all border border-white/5"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 relative z-10"
            >
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deployment Failed</h3>
              <p className="text-red-400/80 text-sm mb-8">{error}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-white font-bold transition-all"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
