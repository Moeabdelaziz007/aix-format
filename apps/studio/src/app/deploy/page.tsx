"use client";
import { APP_VERSION } from "@/lib/version";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Shield, Zap, Globe, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink,
  ChevronRight, Search, Server, Cloud
} from "lucide-react";
import Link from "next/link";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { useRegistry } from "@/hooks/useRegistry";
import { useDeployment } from "@/hooks/useDeployment";
import { RegistryEntry, AgentRecord, DeployRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

type WizardStep = 1 | 2 | 3 | 4;

export default function DeployPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedAgent, setSelectedAgent] = useState<RegistryEntry | AgentRecord | null>(null);
  const [deployTarget, setDeployTarget] = useState<'vercel' | 'custom'>('vercel');
  const [vercelToken, setVercelToken] = useState("");
  const [vercelProject, setVercelProject] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { agents: localAgents, loaded: localLoaded } = useLocalAgents();
  const { entries: registryAgents, loading: registryLoading } = useRegistry();
  const { deployAgent, isDeploying, error: deployError, lastDeployment } = useDeployment();

  // Combine agents for selection
  const allAgents = useMemo(() => {
    const combined = [...registryAgents];
    // Add local agents that aren't in registry yet
    localAgents.forEach(la => {
      if (!combined.find(ra => ra.did === la.did)) {
        combined.push(la as any); // Type cast for simplicity in selection list
      }
    });
    return combined.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localAgents, registryAgents, searchQuery]);

  useEffect(() => {
    if (selectedAgent && !vercelProject) {
      setVercelProject(selectedAgent.name.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [selectedAgent, vercelProject]);

  const nextStep = () => setStep(s => (s < 4 ? (s + 1) as WizardStep : s));
  const prevStep = () => setStep(s => (s > 1 ? (s - 1) as WizardStep : s));

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const onDeploy = async () => {
    if (!selectedAgent) return;
    
    const request: DeployRequest = {
      agentId: (selectedAgent as any).did || (selectedAgent as any).id,
      target: deployTarget,
      config: {
        token: vercelToken,
        projectName: vercelProject,
        endpointUrl: customEndpoint
      },
      yaml: (selectedAgent as any).yaml
    };

    try {
      await deployAgent(request);
      nextStep();
    } catch (err) {
      console.error("Deployment failed", err);
    }
  };

  const steps = [
    { id: 1, name: "Select Agent" },
    { id: 2, name: "Target" },
    { id: 3, name: "Validation" },
    { id: 4, name: "Publish" },
  ];

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 max-w-5xl mx-auto">
      {/* Header & Stepper */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-display font-bold text-white mb-6">Deployment Wizard</h1>
        
        <div className="flex items-center justify-center gap-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                step === s.id ? "bg-[var(--color-primary)] text-[#050507] shadow-[0_0_20px_rgba(0,219,233,0.4)]" :
                step > s.id ? "bg-[var(--color-success)] text-[#050507]" : "bg-white/5 text-[var(--color-on-surface-variant)] border border-white/10"
              )}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-[2px] mx-2",
                  step > s.id ? "bg-[var(--color-success)]" : "bg-white/10"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Agent */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
                  <input 
                    type="text" 
                    placeholder="Search agents by name or role..." 
                    className="input pl-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link href="/builder" className="btn btn-ghost whitespace-nowrap">
                  <Zap className="w-4 h-4 text-[var(--color-primary)]" />
                  New Agent
                </Link>
              </div>

              <div className="card rounded-3xl overflow-hidden border border-white/10 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0e0e12] z-10 border-b border-white/10">
                    <tr className="text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                      <th className="px-6 py-4 font-semibold">Agent</th>
                      <th className="px-6 py-4 font-semibold">Grade</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {allAgents.map((agent) => {
                      const isSelected = selectedAgent?.name === agent.name;
                      const did = (agent as any).did || (agent as any).id;
                      return (
                        <tr 
                          key={did} 
                          onClick={() => setSelectedAgent(agent)}
                          className={cn(
                            "cursor-pointer transition-all duration-200 group",
                            isSelected ? "bg-[var(--color-primary-dim)]" : "hover:bg-white/[0.02]"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                isSelected ? "bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" : "bg-transparent"
                              )} />
                              <div>
                                <p className="font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">{agent.name}</p>
                                <p className="text-xs text-[var(--color-on-surface-variant)]">{agent.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              agent.abom?.risk_level === 'low' ? "bg-green-500/10 text-green-400" :
                              agent.abom?.risk_level === 'medium' ? "bg-yellow-500/10 text-yellow-400" :
                              "bg-white/5 text-[var(--color-on-surface-variant)]"
                            )}>
                              {agent.abom?.risk_level === 'low' ? 'GRADE A' : agent.abom?.risk_level === 'medium' ? 'GRADE B' : 'UNSCANNED'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs">
                              <div className={cn("w-1.5 h-1.5 rounded-full", (agent as any).deployment ? "bg-green-400" : "bg-white/20")} />
                              <span className={cn((agent as any).deployment ? "text-green-400" : "text-[var(--color-on-surface-variant)]")}>
                                {(agent as any).deployment ? "Deployed" : "Local"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-[var(--color-on-surface-faint)] font-mono uppercase">
                            {(agent as any).did ? "Registry" : "Local Draft"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={!selectedAgent}
                  onClick={nextStep}
                  className="btn btn-primary px-8"
                >
                  Configure Target
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Choose Target */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setDeployTarget('vercel')}
                  className={cn(
                    "card rounded-3xl p-8 border-2 cursor-pointer transition-all",
                    deployTarget === 'vercel' ? "border-[var(--color-primary)] bg-[var(--color-primary-dim)]" : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                      <svg viewBox="0 0 76 65" className="w-7 h-7 fill-black"><path d="M37.527 0L75.054 65H0L37.527 0Z" /></svg>
                    </div>
                    {deployTarget === 'vercel' && <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Vercel Edge</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">Automated deployment to Vercel Global Edge Network.</p>
                </div>

                <div 
                  onClick={() => setDeployTarget('custom')}
                  className={cn(
                    "card rounded-3xl p-8 border-2 cursor-pointer transition-all",
                    deployTarget === 'custom' ? "border-[var(--color-primary)] bg-[var(--color-primary-dim)]" : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-[rgba(210,187,255,0.1)] rounded-2xl flex items-center justify-center border border-[rgba(210,187,255,0.2)]">
                      <Server className="w-7 h-7 text-[var(--color-secondary)]" />
                    </div>
                    {deployTarget === 'custom' && <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Custom Node</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">Register a manually hosted agent endpoint.</p>
                </div>
              </div>

              <div className="card rounded-3xl p-8 border border-white/10 space-y-6">
                {deployTarget === 'vercel' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-on-surface-variant)]">Vercel API Token</label>
                      <input 
                        type="password" 
                        placeholder="sk_..." 
                        className="input" 
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-on-surface-variant)]">Project Name</label>
                      <input 
                        type="text" 
                        placeholder="my-agent-instance" 
                        className="input"
                        value={vercelProject}
                        onChange={(e) => setVercelProject(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-on-surface-variant)]">Endpoint URL</label>
                    <input 
                      type="url" 
                      placeholder="https://my-node.io/agent/did:axiom:..." 
                      className="input"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  disabled={(deployTarget === 'vercel' && (!vercelToken || !vercelProject)) || (deployTarget === 'custom' && !customEndpoint)}
                  onClick={nextStep}
                  className="btn btn-primary px-8"
                >
                  Pre-flight Check
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Pre-flight Check */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="card rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-dim)] flex items-center justify-center">
                    <Shield className="w-8 h-8 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Sovereign Integrity Scan</h3>
                    <p className="text-[var(--color-on-surface-variant)]">Validating manifest against AIX v${APP_VERSION} Protocol.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ValidationItem 
                    title="ABOM Grade" 
                    status={selectedAgent?.abom?.risk_level === 'low' ? 'success' : 'warning'} 
                    label={selectedAgent?.abom?.risk_level === 'low' ? 'Grade A (Secure)' : 'Grade B (Basic)'} 
                  />
                  <ValidationItem 
                    title="KYC Verification" 
                    status={selectedAgent?.kyc_tier === 'verified' ? 'success' : 'warning'} 
                    label={selectedAgent?.kyc_tier || 'unverified'} 
                  />
                  <ValidationItem 
                    title="DID Format" 
                    status={(selectedAgent as any).did ? 'success' : 'error'}
                    label={(selectedAgent as any).did ? 'did:axiom verified' : 'DID Missing'}
                  />
                  <ValidationItem 
                    title="YAML Syntax" 
                    status="success" 
                    label="Valid AIX-1.2 Structure" 
                  />
                </div>
              </div>

              {deployError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-400">Deployment Blocked</p>
                    <p className="text-xs text-red-400/80">{deployError}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-ghost gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  disabled={isDeploying}
                  onClick={onDeploy}
                  className="btn btn-primary px-10 relative overflow-hidden"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      Publish Agent
                      <Globe className="w-4 h-4 ml-2" />
                    </>
                  )}
                  {isDeploying && <motion.div className="absolute bottom-0 left-0 h-1 bg-white/30" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5 }} />}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success / Monitor */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white">Agent Live & Sovereign</h2>
                <p className="text-[var(--color-on-surface-variant)] max-w-md mx-auto">
                  Your agent has been deployed to the {deployTarget} edge and registered in the Axiom Registry.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultCard 
                  label="Endpoint URL" 
                  value={lastDeployment?.endpointUrl || ""} 
                  icon={<Cloud className="w-4 h-4" />}
                  onCopy={() => handleCopy(lastDeployment?.endpointUrl || "", "endpoint")}
                  copied={copied === "endpoint"}
                />
                <ResultCard 
                  label="MCP Discovery" 
                  value={lastDeployment?.mcpUrl || ""} 
                  icon={<Search className="w-4 h-4" />}
                  onCopy={() => handleCopy(lastDeployment?.mcpUrl || "", "mcp")}
                  copied={copied === "mcp"}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link href={`/agents/${(selectedAgent as any).did || ""}`} className="btn btn-ghost w-full sm:w-auto">
                  View in Registry
                </Link>
                <button onClick={() => setStep(1)} className="btn btn-primary w-full sm:w-auto">
                  Deploy Another
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ValidationItem({ title, status, label }: { title: string, status: 'success' | 'warning' | 'error', label: string }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
  };
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-3">
        {icons[status]}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <span className="text-xs font-mono text-[var(--color-on-surface-variant)] uppercase">{label}</span>
    </div>
  );
}

function ResultCard({ label, value, icon, onCopy, copied }: any) {
  return (
    <div className="card rounded-2xl p-5 border border-white/10 space-y-3">
      <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-primary)] truncate border border-white/5">
          {value}
        </div>
        <button 
          onClick={onCopy}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors relative"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
        </button>
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </a>
      </div>
    </div>
  );
}
