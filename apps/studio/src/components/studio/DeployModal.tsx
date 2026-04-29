'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  Loader2,
  Server,
  Cloud,
  Lock,
  Cpu,
  Key
} from 'lucide-react';
import { useSignMessage, useAccount } from 'wagmi';
import { AgentRecord, DeploymentRecord, DeployTarget, DeployConfig, DeployRequest, DeployResponse } from '@/lib/types';
import { useLocalAgents } from '@/hooks/useLocalAgents';

interface Props {
  agent: AgentRecord;
  onClose: () => void;
  onDeployed: (deployment: DeploymentRecord) => void;
}

export default function DeployModal({ agent, onClose, onDeployed }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Step 3 is now Signing
  const [target, setTarget] = useState<DeployTarget>('vercel');
  const [config, setConfig] = useState<DeployConfig>({
    token: '',
    projectName: agent.name.toLowerCase().replace(/\s+/g, '-'),
    endpointUrl: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResponse | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  const { signMessage, isPending: isSigning } = useSignMessage();
  const { address, isConnected } = useAccount();
  const { saveAgent } = useLocalAgents();

  const handleNext = () => setStep((s) => (s + 1) as any);
  const handleBack = () => setStep((s) => (s - 1) as any);

  const handleSign = async () => {
    if (!isConnected) {
      setError('Please connect your sovereign wallet to sign the manifest.');
      return;
    }

    const message = `Sign AIX Agent Deployment\n\nAgent ID: ${agent.id}\nIntegrity Hash: ${agent.abom?.integrity_hash}\nTimestamp: ${new Date().toISOString()}`;
    
    signMessage({ message }, {
      onSuccess: (sig) => {
        setSignature(sig);
        handleNext();
      },
      onError: (err) => {
        setError(`Signing failed: ${err.message}`);
      }
    });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    const payload: DeployRequest = {
      agentId: agent.id,
      target,
      config,
      yaml: agent.yaml
    };

    try {
      const res = await fetch('/api/deploy-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: DeployResponse = await res.json();

      if (!res.ok) throw new Error(data.error || 'Deployment failed');

      setDeployResult(data);
      
      // Update agent status and deployment record
      const deployment: DeploymentRecord = {
        agentId: agent.id,
        deployedAt: new Date().toISOString(),
        endpointUrl: data.deployUrl,
        mcpUrl: `${data.deployUrl}/api/mcp-discovery`,
        status: 'deployed',
        signature: signature || undefined,
        signer: address
      };

      saveAgent({ 
        ...agent, 
        status: 'online',
        deployment 
      });
      
      onDeployed(deployment);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {!deployResult ? (
            <motion.div
              key="flow"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="relative z-10"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <Rocket className={target === 'vercel' ? 'text-indigo-400' : 'text-emerald-400'} />
                  Deploy {agent.name}
                </h2>
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-indigo-500' : 'bg-zinc-800'}`} 
                    />
                  ))}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Step 1: Target Selection</h3>
                  <button 
                    onClick={() => setTarget('vercel')}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${target === 'vercel' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className={`p-3 rounded-xl ${target === 'vercel' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Vercel Edge</p>
                      <p className="text-xs text-zinc-500">Deploy as serverless Next.js API</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTarget('custom')}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${target === 'custom' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className={`p-3 rounded-xl ${target === 'custom' ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Sovereign Node</p>
                      <p className="text-xs text-zinc-500">Deploy to a custom remote endpoint</p>
                    </div>
                  </button>
                  <button 
                    onClick={handleNext}
                    className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Step 2: Configuration</h3>
                  
                  {target === 'vercel' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vercel API Token</label>
                        <input 
                          type="password"
                          value={config.token}
                          onChange={(e) => setConfig({ ...config, token: e.target.value })}
                          placeholder="vct_..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Identifier</label>
                        <input 
                          type="text"
                          value={config.projectName}
                          onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                          placeholder="my-sovereign-agent"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Endpoint URL</label>
                      <input 
                        type="url"
                        value={config.endpointUrl}
                        onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                        placeholder="https://agent.yourdomain.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={handleBack}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                      onClick={handleNext}
                      className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      Verify Security <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Step 3: Security Signature</h3>
                  
                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Cryptographic Handshake</p>
                        <p className="text-xs text-zinc-500">Sign the manifest to prove authenticity</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-black/30 rounded-xl font-mono text-[10px] text-zinc-400 border border-white/5 space-y-1">
                      <p>AGENT_ID: {agent.id}</p>
                      <p>ABOM_HASH: {agent.abom?.integrity_hash.slice(0, 32)}...</p>
                      <p>ISSUER: {address || 'unconnected'}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={handleBack}
                      disabled={isSigning}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                      onClick={handleSign}
                      disabled={isSigning}
                      className="flex-[2] py-4 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      {isSigning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Waiting for Wallet...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Sign & Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Step 4: Final Review</h3>
                  
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-bold">Identity (DID)</span>
                      <span className="text-[10px] font-mono text-indigo-400 truncate max-w-[200px]">{agent.did}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-bold">Signature Status</span>
                      <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-900">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Capabilities</span>
                      <div className="flex flex-wrap gap-2">
                        {agent.abom?.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-bold rounded-lg border border-white/5">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={handleBack}
                      disabled={isDeploying}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deploying Agent...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Execute Deployment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 relative z-10"
            >
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-black text-white mb-2">Sovereign Live</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                Your agent is now active and reachable at the following sovereign access point.
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-8">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Public Access Point</p>
                <a 
                  href={deployResult.deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-mono text-sm hover:underline break-all"
                >
                  {deployResult.deployUrl}
                </a>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-white font-black transition-all border border-white/5"
              >
                Close Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
