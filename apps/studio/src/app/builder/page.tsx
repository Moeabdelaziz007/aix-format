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
  Database
} from "lucide-react";
import yaml from "js-yaml";
import { Navbar } from "@/components/layout/Navbar";
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
  { id: 4, name: "Economics", icon: <Wallet className="w-4 h-4" /> }
];

export default function AgentBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewFormat, setPreviewFormat] = useState<"yaml" | "json">("yaml");
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    meta: {
      name: "",
      version: "1.0.0",
      author: "",
      description: "",
    },
    persona: {
      role: "",
      instructions: "",
      tone: "formal",
    },
    skills: [] as any[],
    security: {
      checksum: {
        algorithm: "sha256",
        value: "pending"
      }
    },
    identity_layer: {
      id: `did:axiom:axiomid.app:agent-temp`,
      authority: "axiomid.app",
      issuedAt: new Date().toISOString()
    },
    economics: {
      pricing_model: "pay_per_call",
      token: ""
    }
  });

  // Generate Manifest Content
  const manifestContent = useMemo(() => {
    // Deep clone to avoid mutating state
    const manifest = JSON.parse(JSON.stringify(formData));
    
    // Ensure identity ID matches meta name or something descriptive if meta name is empty
    if (formData.meta.name) {
      const slug = formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      manifest.identity_layer.id = `did:axiom:axiomid.app:agent-${slug}`;
    }

    if (previewFormat === "json") {
      return JSON.stringify(manifest, null, 2);
    } else {
      try {
        return yaml.dump(manifest, { indent: 2, lineWidth: -1 });
      } catch (e) {
        return "# Error generating YAML\n" + (e as Error).message;
      }
    }
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

  const updateSkill = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], [field]: value };
      return { ...prev, skills: newSkills };
    });
  };

  const updateEconomics = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      economics: {
        ...prev.economics,
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
    const blob = new Blob([manifestContent], { type: 'text/plain' });
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
                          {formData.skills.map((skill, index) => (
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

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">Token (Optional)</label>
                          <input
                            type="text"
                            value={formData.economics.token || ""}
                            onChange={(e) => updateEconomics("token", e.target.value)}
                            placeholder="e.g. PI"
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/[0.05] mt-6">
                        <div className="flex items-center gap-3 text-xs text-[#8888a0]">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span>Sovereign Identity Protection Enabled</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <button
                className="btn btn-primary-green-glow w-full"
                onClick={() => alert("Manifest published to registry!")}
              >
                <Rocket className="w-4 h-4 mr-2" /> Validate & Deploy
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
