"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Rocket, 
  Cpu, 
  Zap, 
  Shield, 
  Globe,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileCode,
  Database,
  Activity,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { stringifyYamlSafe, sha256Hex } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { Manifest, AgentSkill, McpPrompt, AgentRecord } from "@/lib/types";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import LiveValidator from "@/components/studio/LiveValidator";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS = [
  { id: 1, name: "Metadata", icon: <Globe className="w-4 h-4" /> },
  { id: 2, name: "Persona", icon: <Cpu className="w-4 h-4" /> },
  { id: 3, name: "Skills", icon: <Zap className="w-4 h-4" /> },
  { id: 4, name: "Economics", icon: <Wallet className="w-4 h-4" /> },
  { id: 5, name: "SBOM", icon: <Shield className="w-4 h-4" /> },
  { id: 6, name: "Identity", icon: <UserCheck className="w-4 h-4" /> }
];

export default function AgentBuilderPage() {
  const router = useRouter();
  const { saveAgent } = useLocalAgents();
  const [currentStep, setCurrentStep] = useState(1);
  const [previewFormat, setPreviewFormat] = useState<"yaml" | "json" | "discovery">("yaml");
  const [copied, setCopied] = useState(false);
  const [manifestContent, setManifestContent] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Manifest>({
    meta: {
      name: "",
      version: "1.0.0",
      format_version: "1.3",
      author: "",
      description: "",
    },
    persona: {
      role: "",
      instructions: "",
      tone: "formal",
    },
    skills: [] as AgentSkill[],
    security: {
      checksum: {
        algorithm: "sha256",
        value: "pending"
      }
    },
    identity_layer: {
      id: `did:axiom:axiomid.app:agent-temp`,
      authority: "axiomid.app",
      issuedAt: new Date().toISOString(),
      kyc_tier: 0
    },
    economics: {
      pricing_model: "pay_per_call",
      currency: "PI"
    },
    abom: {
      bom_format: "CycloneDX",
      spec_version: "1.6",
      risk_level: "low",
      integrity_hash: "pending",
      dependencies: [] as string[]
    },
    mcp: {
      prompts: [] as McpPrompt[]
    }
  });

  // Generate Manifest Content (Async)
  useEffect(() => {
    const generate = async () => {
      // Deep clone to avoid mutating state
      const manifest = JSON.parse(JSON.stringify(formData));
      
      // Ensure identity ID matches meta name
      if (formData.meta.name) {
        const slug = formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        manifest.identity_layer.id = `did:axiom:axiomid.app:agent-${slug}`;
      }

      // Update integrity hash based on dependencies
      if (formData.abom.dependencies.length > 0) {
        const depString = formData.abom.dependencies.join(",");
        manifest.abom.integrity_hash = await sha256Hex(depString);
      } else {
        manifest.abom.integrity_hash = "sha256-empty-deps";
      }

      if (previewFormat === "json") {
        setManifestContent(JSON.stringify(manifest, null, 2));
      } else if (previewFormat === "discovery") {
        const { generateAIXDiscovery } = await import("@/lib/mcp-generator");
        const disc = generateAIXDiscovery(manifest, "https://agent.example.com");
        setManifestContent(JSON.stringify(disc, null, 2));
      } else {
        const yml = await stringifyYamlSafe(manifest);
        setManifestContent(yml);
      }
    };
    generate();
  }, [formData, previewFormat]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const updateMeta = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      meta: { ...prev.meta, [field]: value }
    }));
  };

  const updatePersona = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      persona: { ...prev.persona, [field]: value }
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: "", description: "" }]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index: number, field: keyof AgentSkill, value: string) => {
    setFormData(prev => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], [field]: value };
      return { ...prev, skills: newSkills };
    });
  };

  const handleExportAndSave = async () => {
    setIsDeploying(true);
    
    await new Promise(r => setTimeout(r, 1000));
    
    try {
      const id = crypto.randomUUID();
      const slug = formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unnamed-agent';
      const agentId = `${slug}-${id.slice(0, 4)}`;
      
      const integrityHash = await sha256Hex(manifestContent);
      
      const record: AgentRecord = {
        id: agentId,
        name: formData.meta.name || "Unnamed Agent",
        role: formData.persona.role || "AI Assistant",
        createdAt: new Date().toISOString(),
        yaml: manifestContent,
        // manifest removed from AgentRecord
        did: `did:aix:${id.replace(/-/g, '').slice(0, 32)}`,
        kyc_tier: formData.identity_layer.kyc_tier === 0 ? 'unverified' : formData.identity_layer.kyc_tier === 1 ? 'basic' : formData.identity_layer.kyc_tier === 2 ? 'verified' : 'institutional',
        abom: {
          capabilities: formData.skills.map(s => s.name || "unnamed_skill"),
          integrity_hash: integrityHash,
          generated_by: "AIX Studio Builder",
          timestamp: new Date().toISOString(),
          model: {
            provider: "axiom",
            name: "sovereign-1"
          },
          governance: {
            license: "MIT"
          }
        }
      };

      saveAgent(record);
      handleDownload();
      
      setTimeout(() => {
        router.push(`/agents/${record.id}`);
      }, 500);
    } catch (e) {
      console.error("Export and Save failed", e);
      alert("Failed to save agent locally.");
    } finally {
      setIsDeploying(false);
    }
  };

  const updateEconomics = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      economics: {
        ...prev.economics,
        [field]: value
      }
    }));
  };

  const updateAbom = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      abom: {
        ...prev.abom,
        [field]: value
      }
    }));
  };

  const updateIdentity = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      identity_layer: {
        ...prev.identity_layer,
        [field]: value
      }
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(manifestContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([manifestContent], { type: 'application/x-aix' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-manifest.${previewFormat === 'yaml' ? 'aix' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e8] font-body selection:bg-[#00dbe9]/30">
      <Navbar />
      <SovereignStatusBar />

      <main className="max-w-[1600px] mx-auto px-6 py-8 h-[calc(100vh-120px)] flex gap-6">
        {/* Left Panel: Form Wizard */}
        <section className="w-[40%] flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border-white/[0.08] shadow-2xl">
            {/* Header & Progress */}
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Agent Builder</h1>
              <p className="text-sm text-[#8888a0] mb-6">Create your sovereign AIX manifest step-by-step.</p>
              
              <div className="flex gap-2 p-1 bg-black/20 rounded-full border border-white/5 w-fit">
                {STEPS.map(step => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                      currentStep === step.id
                        ? "bg-[var(--color-accent-primary)] text-black"
                        : "text-white/50 hover:text-white/80"
                    )}
                  >
                    {step.icon}
                    {step.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Agent Name</label>
                        <input 
                          type="text" 
                          value={formData.meta.name}
                          onChange={(e) => updateMeta("name", e.target.value)}
                          placeholder="e.g. Sovereign Researcher" 
                          className="input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Version</label>
                          <input 
                            type="text" 
                            value={formData.meta.version}
                            onChange={(e) => updateMeta("version", e.target.value)}
                            placeholder="1.0.0" 
                            className="input"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Author</label>
                          <input 
                            type="text" 
                            value={formData.meta.author}
                            onChange={(e) => updateMeta("author", e.target.value)}
                            placeholder="Your Name or Org" 
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Description</label>
                        <textarea 
                          value={formData.meta.description}
                          onChange={(e) => updateMeta("description", e.target.value)}
                          placeholder="What does this agent do?" 
                          className="input min-h-[120px] py-3 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Role</label>
                        <input 
                          type="text" 
                          value={formData.persona.role}
                          onChange={(e) => updatePersona("role", e.target.value)}
                          placeholder="e.g. Expert Financial Analyst" 
                          className="input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Instructions</label>
                        <textarea 
                          value={formData.persona.instructions}
                          onChange={(e) => updatePersona("instructions", e.target.value)}
                          placeholder="Core behavioral guidelines..." 
                          className="input min-h-[200px] py-3 resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Tone</label>
                        <select 
                          value={formData.persona.tone}
                          onChange={(e) => updatePersona("tone", e.target.value)}
                          className="input appearance-none bg-[#0e0e12]"
                        >
                          <option value="formal">Formal</option>
                          <option value="casual">Casual</option>
                          <option value="technical">Technical</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Active Skills</label>
                        <button 
                          onClick={addSkill}
                          className="btn btn-sm btn-ghost hover:border-[#00dbe9]/50 text-[#00dbe9]"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
                        </button>
                      </div>
                      
                      {formData.skills.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-white/[0.05] rounded-xl text-center">
                          <p className="text-sm text-[#404050]">No custom skills defined.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {formData.skills.map((skill: AgentSkill, index: number) => (
                            <div key={index} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3 relative group">
                              <button 
                                onClick={() => removeSkill(index)}
                                className="absolute top-2 right-2 p-1.5 text-[#404050] hover:text-[#ef4444] transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="gap-3">
                                <input 
                                  placeholder="Skill name (snake_case)" 
                                  value={skill.name}
                                  onChange={(e) => updateSkill(index, "name", e.target.value)}
                                  className="input py-2 text-xs mb-3"
                                />
                              </div>
                              <textarea 
                                placeholder="Describe skill functionality..." 
                                value={skill.description}
                                onChange={(e) => updateSkill(index, "description", e.target.value)}
                                className="input py-2 text-xs min-h-[60px] resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* MCP Prompts Section */}
                      <div className="pt-6 border-t border-white/[0.05] mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">MCP Prompts (v1.3)</label>
                          <button 
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              mcp: { prompts: [...prev.mcp.prompts, { name: "", description: "" }] } 
                            }))}
                            className="btn btn-sm btn-ghost hover:border-[#00dbe9]/50 text-[#00dbe9]"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Prompt
                          </button>
                        </div>
                        
                        {formData.mcp.prompts.length === 0 ? (
                          <div className="p-4 border border-dashed border-white/[0.05] rounded-xl text-center">
                            <p className="text-[10px] text-[#404050]">No discovery prompts defined.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {formData.mcp.prompts.map((p: McpPrompt, i: number) => (
                              <div key={i} className="flex gap-2 group">
                                <input 
                                  placeholder="Prompt Name" 
                                  value={p.name}
                                  onChange={(e) => {
                                    const next = [...formData.mcp.prompts];
                                    next[i].name = e.target.value;
                                    setFormData(prev => ({ ...prev, mcp: { prompts: next } }));
                                  }}
                                  className="input py-2 text-[10px] flex-1"
                                />
                                <button 
                                  onClick={() => {
                                    const next = formData.mcp.prompts.filter((_: McpPrompt, idx: number) => idx !== i);
                                    setFormData(prev => ({ ...prev, mcp: { prompts: next } }));
                                  }}
                                  className="p-2 text-[#404050] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#00dbe9]/5 border border-[#00dbe9]/10 mb-6">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-[#00dbe9] shrink-0" />
                          <p className="text-xs text-[#00dbe9]/80 leading-relaxed">
                            Economics are settled via the Pi Network blockchain. Ensure your cost per call reflects the value provided by your agent.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Pricing Model</label>
                        <select
                          value={formData.economics.pricing_model}
                          onChange={(e) => updateEconomics("pricing_model", e.target.value)}
                          className="input appearance-none bg-[#0e0e12]"
                        >
                          <option value="pay_per_call">Pay-per-use</option>
                          <option value="subscription">Subscription</option>
                          <option value="free">Free</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Currency (Optional)</label>
                        <input
                          type="text"
                          value={formData.economics.currency || ""}
                          onChange={(e) => updateEconomics("currency", e.target.value)}
                          placeholder="e.g. PI"
                          className="input"
                        />
                      </div>

                      <div className="pt-6 border-t border-white/[0.05] mt-6">
                        <div className="flex items-center gap-3 text-xs text-[#8888a0]">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span>Sovereign Identity Protection Enabled</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: SBOM */}
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-6">
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-purple-400 shrink-0" />
                          <p className="text-xs text-purple-300/80 leading-relaxed">
                            Agent SBOM (ABOM) ensures supply chain security by listing all dependencies and assessing inherent risks.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">SBOM Format</label>
                        <select
                          value={formData.abom.bom_format}
                          onChange={(e) => updateAbom("bom_format", e.target.value)}
                          className="input appearance-none bg-[#0e0e12]"
                        >
                          <option value="CycloneDX">CycloneDX (v1.6)</option>
                          <option value="SPDX">SPDX</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Risk Level</label>
                        <select
                          value={formData.abom.risk_level}
                          onChange={(e) => updateAbom("risk_level", e.target.value)}
                          className="input appearance-none bg-[#0e0e12]"
                        >
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Dependency Tags (CSV)</label>
                        <input
                          type="text"
                          placeholder="e.g. langchain, openai, pinecone"
                          className="input"
                          onChange={(e) => updateAbom("dependencies", e.target.value.split(",").map(s => s.trim()))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 6: Identity */}
                  {currentStep === 6 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-6">
                        <div className="flex gap-3">
                          <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                          <p className="text-xs text-emerald-300/80 leading-relaxed">
                            Verify your identity to increase agent trust scores. AxiomID provides zero-knowledge KYC for sovereign entities.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">AxiomID KYC Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                          {([0, 1, 2, 3] as const).map((tier) => (
                            <button
                              key={tier}
                              onClick={() => updateIdentity('kyc_tier', tier)}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all",
                                formData.identity_layer.kyc_tier === tier
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                                  : "bg-white/5 border-white/5 text-[#8888a0] hover:border-white/20"
                              )}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-tight">{tier === 0 ? 'unverified' : tier === 1 ? 'basic' : tier === 2 ? 'verified' : 'institutional'}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-4">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">DID Authority</label>
                        <input
                          type="text"
                          value={formData.identity_layer.authority}
                          onChange={(e) => updateIdentity("authority", e.target.value)}
                          className="input"
                          placeholder="e.g. axiomid.app"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <button
                className={`btn btn-primary-green-glow w-full ${isDeploying ? 'opacity-50 cursor-wait' : ''}`}
                onClick={handleExportAndSave}
                disabled={isDeploying}
              >
                {isDeploying ? (
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" /> Export & Save Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel: Live Preview & Validator */}
        <section className="w-[60%] flex flex-col gap-6">
          <div className="flex flex-col h-full gap-4">
            {/* Preview Header */}
            <div className="flex justify-between items-end px-2">
              <div>
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00dbe9]" />
                  Manifest Preview
                </h2>
                <p className="text-xs text-[#8888a0]">Real-time AIX v1.3 validation</p>
              </div>
              <div className="flex gap-2 p-1 bg-[#0e0e12] border border-white/[0.05] rounded-lg">
                <button 
                  onClick={() => setPreviewFormat("yaml")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    previewFormat === "yaml" ? "bg-white/[0.08] text-white" : "text-[#404050] hover:text-[#8888a0]"
                  )}
                >
                  <FileCode className="w-3 h-3" /> YAML
                </button>
                <button 
                  onClick={() => setPreviewFormat("json")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    previewFormat === "json" ? "bg-white/[0.08] text-white" : "text-[#404050] hover:text-[#8888a0]"
                  )}
                >
                  <FileJson className="w-3 h-3" /> JSON
                </button>
                <button 
                  onClick={() => setPreviewFormat("discovery")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    previewFormat === "discovery" ? "bg-[var(--color-accent-primary)] text-black" : "text-[#404050] hover:text-[#8888a0]"
                  )}
                >
                  <Zap className="w-3 h-3" /> Discovery
                </button>
              </div>
            </div>

            {/* Content & Validation */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 glass-panel-heavy rounded-2xl overflow-hidden border-white/[0.08] relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-[#050507]/80 border border-white/10 rounded-lg hover:border-[#00dbe9]/50 text-white transition-all shadow-xl"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-[#00dbe9]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-[#050507]/80 border border-white/10 rounded-lg hover:border-[#00dbe9]/50 text-white transition-all shadow-xl"
                    title="Download .aix file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="h-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto custom-scrollbar p-6 font-mono text-sm leading-relaxed text-[#8888a0]">
                    <pre className="whitespace-pre-wrap break-all">
                      {manifestContent}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Live Validator Component */}
              <div className="h-[250px] shrink-0">
                <LiveValidator 
                  content={manifestContent} 
                  fileName={`agent.${previewFormat === 'yaml' ? 'aix' : 'json'}`}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00dbe9]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d2bbff]/5 blur-[120px] rounded-full" />
      </div>

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
