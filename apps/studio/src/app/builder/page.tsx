"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRegistry } from '@/hooks/useRegistry';
import { useAbom } from '@/hooks/useAbom';
import { useKyc } from '@/hooks/useKyc';
import { toast } from 'sonner';
import { stringifyYamlSafe, sha256Hex, parseYamlLight, computeManifestChecksum, cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Manifest, AgentSkill, McpPrompt } from "@/lib/types";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import LiveValidator from "@/components/studio/LiveValidator";
import BOMVisualizer from "@/components/studio/BOMVisualizer";
import { validateBuilderField, FieldError } from "@/lib/builder-validation";

const STEPS = [
  { id: 1, name: "Metadata", icon: <Globe className="w-4 h-4" /> },
  { id: 2, name: "Persona", icon: <Cpu className="w-4 h-4" /> },
  { id: 3, name: "Skills", icon: <Zap className="w-4 h-4" /> },
  { id: 4, name: "Deploy", icon: <Rocket className="w-4 h-4" /> }
];

export default function AgentBuilderPage() {
  const router = useRouter();
  const { scanYaml, report: abomReport } = useAbom();
  const [currentStep, setCurrentStep] = useState(1);
  const [previewFormat, setPreviewFormat] = useState<"yaml" | "json" | "discovery" | "visualizer">("yaml");
  const [copied, setCopied] = useState(false);
  const [manifestContent, setManifestContent] = useState("");
  const [errors, setErrors] = useState<Record<string, FieldError | null>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ agentId: string; manifestUrl: string } | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

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
      capabilities: [] as string[],
      generated_by: "AIX-Studio",
      timestamp: new Date().toISOString(),
      dependencies: [] as string[]
    },
    mcp: {
      prompts: [] as McpPrompt[]
    }
  });

  // Real-time Checksum Computation
  const liveChecksum = useMemo(() => {
    return computeManifestChecksum(formData);
  }, [formData]);

  const prevChecksumRef = useRef(liveChecksum);
  const [checksumAnimating, setChecksumAnimating] = useState(false);

  useEffect(() => {
    if (prevChecksumRef.current !== liveChecksum) {
      setChecksumAnimating(true);
      const timer = setTimeout(() => setChecksumAnimating(false), 500);
      prevChecksumRef.current = liveChecksum;
      return () => clearTimeout(timer);
    }
  }, [liveChecksum]);

  // Generate Manifest Content
  useEffect(() => {
    const generate = async () => {
      const manifest = JSON.parse(JSON.stringify(formData));
      
      // Update checksum in real-time
      manifest.security.checksum.value = liveChecksum;

      // Update identity ID
      if (formData.meta.name) {
        const slug = formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        manifest.identity_layer.id = `did:axiom:axiomid.app:agent-${slug}`;
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
  }, [formData, previewFormat, liveChecksum]);

  // Validation Logic
  const handleFieldChange = (section: keyof Manifest | 'meta' | 'persona', field: string, value: any) => {
    setFormData(prev => {
      if (section === 'meta' || section === 'persona') {
        return {
          ...prev,
          [section]: { ...(prev as any)[section], [field]: value }
        };
      }
      return { ...prev, [section]: value };
    });

    const error = validateBuilderField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleExportAndSave = async () => {
    try {
      const yamlString = await stringifyYamlSafe(formData);
      
      const entry: RegistryEntry = {
        did: formData.identity_layer.id,
        name: formData.meta.name,
        role: formData.persona.role,
        capabilities: formData.skills.map(s => s.name),
        kyc_tier: String(formData.identity_layer.kyc_tier || 0),
        specVersion: formData.meta.version,
        publishedAt: new Date().toISOString(),
        yaml: yamlString
      };
      // Note: publishAgent and deployAgent should be defined or imported
      // For now keeping this logic as placeholders if they were in HEAD
    } catch (err) {
      toast.error("Failed to export/save");
    }
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const isStepValid = (stepId: number) => {
    switch (stepId) {
      case 1:
        return !!formData.meta.name &&
               !!formData.meta.version &&
               !!formData.meta.author &&
               formData.meta.name.length >= 3 &&
               !errors.name && !errors.version && !errors.author;
      case 2:
        return !!formData.persona.role && !!formData.persona.instructions && !errors.role && !errors.instructions;
      case 3:
        return true; // Skills optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const allStepsValid = useMemo(() => {
    return [1, 2].every(id => isStepValid(id));
  }, [formData, errors]);

  const handleDeploy = async () => {
    if (!allStepsValid) {
      toast.error("Please complete all required fields first.");
      return;
    }

    setIsDeploying(true);
    try {
      const manifest = JSON.parse(JSON.stringify(formData));
      manifest.security.checksum.value = liveChecksum;

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });

      const data = await response.json();
      if (data.success) {
        setDeployResult({ agentId: data.agentId, manifestUrl: data.manifestUrl });
        toast.success("Agent deployed successfully!");
      } else {
        toast.error(data.error || "Deployment failed");
      }
    } catch (err) {
      toast.error("Network error during deployment");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(manifestContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([manifestContent], { type: previewFormat === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent.${previewFormat === 'yaml' ? 'aix' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e6] font-sans selection:bg-[#00dbe9]/30">
      <Navbar />
      <SovereignStatusBar />

      <main className="container mx-auto pt-24 pb-12 px-4 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00dbe9] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#00dbe9]/20">
                <Rocket className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-4xl font-display font-black tracking-tight text-white uppercase italic">
                Agent Builder
              </h1>
            </div>
            <p className="text-[#8888a0] max-w-xl leading-relaxed">
              Construct high-fidelity AIX manifests with real-time cryptographic integrity and ABOM risk scoring.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0e0e12] border border-white/[0.05] p-1.5 rounded-2xl">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                  currentStep === step.id
                    ? "bg-white/[0.08] text-white shadow-xl shadow-black/40"
                    : isStepValid(step.id)
                      ? "text-[#00dbe9] hover:text-white"
                      : "text-[#404050] hover:text-[#8888a0]"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all",
                  currentStep === step.id
                    ? "bg-[#00dbe9] border-[#00dbe9] text-black shadow-[0_0_15px_rgba(0,219,233,0.4)]"
                    : isStepValid(step.id)
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/20"
                )}>
                  {isStepValid(step.id) ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline uppercase tracking-widest">{step.name}</span>
                {currentStep === step.id && (
                  <motion.div
                    layoutId="activeStep"
                    className="absolute inset-0 bg-white/[0.05] rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#00dbe9] to-[#6366f1]"
            initial={{ width: 0 }}
            animate={{ width: `${(STEPS.filter(s => isStepValid(s.id)).length / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="glass-panel-heavy p-8 rounded-[2rem] border-white/[0.08] bg-[#0a0a0f]/80 backdrop-blur-xl relative overflow-hidden">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Core Metadata</h3>
                      <p className="text-xs text-[#8888a0]">Define the fundamental identity of your agent.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Agent Name</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={formData.meta.name}
                            onChange={(e) => handleFieldChange('meta', 'name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={cn(
                              "w-full bg-black/40 border p-4 rounded-2xl text-white placeholder:text-[#404050] focus:outline-none transition-all",
                              touchedFields.name && errors.name ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-[#00dbe9]/50"
                            )}
                            placeholder="e.g. CyberSentinel v1"
                          />
                          {formData.meta.name && !errors.name && <CheckCircle2 className="absolute right-4 top-4 w-5 h-5 text-emerald-400" />}
                        </div>
                        {touchedFields.name && errors.name && <p className="text-[10px] text-red-400 font-bold uppercase ml-1">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Version</label>
                        <input 
                          type="text"
                          value={formData.meta.version}
                          onChange={(e) => handleFieldChange('meta', 'version', e.target.value)}
                          onBlur={() => handleBlur('version')}
                          className={cn(
                            "w-full bg-black/40 border p-4 rounded-2xl text-white focus:outline-none transition-all",
                            touchedFields.version && errors.version ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-[#00dbe9]/50"
                          )}
                        />
                        {touchedFields.version && errors.version && <p className="text-[10px] text-red-400 font-bold uppercase ml-1">{errors.version.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Author / Organization</label>
                      <input
                        type="text"
                        value={formData.meta.author}
                        onChange={(e) => handleFieldChange('meta', 'author', e.target.value)}
                        onBlur={() => handleBlur('author')}
                        className={cn(
                          "w-full bg-black/40 border p-4 rounded-2xl text-white focus:outline-none transition-all",
                          touchedFields.author && errors.author ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-[#00dbe9]/50"
                        )}
                        placeholder="e.g. Axiom Labs"
                      />
                      {touchedFields.author && errors.author && <p className="text-[10px] text-red-400 font-bold uppercase ml-1">{errors.author.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Description</label>
                      <textarea
                        value={formData.meta.description}
                        onChange={(e) => handleFieldChange('meta', 'description', e.target.value)}
                        onBlur={() => handleBlur('description')}
                        className={cn(
                          "w-full bg-black/40 border p-4 rounded-2xl text-white min-h-[120px] focus:outline-none transition-all resize-none",
                          touchedFields.description && errors.description ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-[#00dbe9]/50"
                        )}
                        placeholder="Detail the primary function and scope of this agent..."
                      />
                      {touchedFields.description && errors.description && (
                        <p className={cn("text-[10px] font-bold uppercase ml-1", errors.description.severity === 'error' ? "text-red-400" : "text-amber-400")}>
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Persona & Behavior</h3>
                      <p className="text-xs text-[#8888a0]">Define how the agent communicates and its operational role.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Operational Role</label>
                      <input
                        type="text"
                        value={formData.persona.role}
                        onChange={(e) => handleFieldChange('persona', 'role', e.target.value)}
                        onBlur={() => handleBlur('role')}
                        className={cn(
                          "w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white focus:outline-none focus:border-[#00dbe9]/50 transition-all",
                          touchedFields.role && errors.role ? "border-red-500/50" : ""
                        )}
                        placeholder="e.g. Autonomous Security Auditor"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">System Instructions</label>
                      <textarea
                        value={formData.persona.instructions}
                        onChange={(e) => handleFieldChange('persona', 'instructions', e.target.value)}
                        onBlur={() => handleBlur('instructions')}
                        className={cn(
                          "w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white min-h-[150px] focus:outline-none focus:border-[#00dbe9]/50 transition-all resize-none",
                          touchedFields.instructions && errors.instructions ? "border-red-500/50" : ""
                        )}
                        placeholder="You are an autonomous agent designed to..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {['formal', 'technical', 'friendly'].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleFieldChange('persona', 'tone', t)}
                          className={cn(
                            "p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                            formData.persona.tone === t
                              ? "bg-[#00dbe9]/10 border-[#00dbe9]/40 text-[#00dbe9]"
                              : "bg-white/5 border-white/5 text-[#404050] hover:text-[#8888a0]"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Capabilities</h3>
                        <p className="text-xs text-[#8888a0]">Enumerate the skills and tools available to this agent.</p>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, skills: [...prev.skills, { name: "", description: "" }] }))}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00dbe9] text-black rounded-xl text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Skill
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4 relative group">
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }))}
                            className="absolute top-4 right-4 p-2 text-red-400/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => {
                              const newSkills = [...formData.skills];
                              newSkills[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, skills: newSkills }));
                            }}
                            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#00dbe9]/50 transition-all"
                            placeholder="Skill Name (e.g. networkScan)"
                          />
                          <textarea
                            value={skill.description}
                            onChange={(e) => {
                              const newSkills = [...formData.skills];
                              newSkills[index].description = e.target.value;
                              setFormData(prev => ({ ...prev, skills: newSkills }));
                            }}
                            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white text-xs min-h-[60px] focus:outline-none focus:border-[#00dbe9]/50 transition-all resize-none"
                            placeholder="Describe how this skill works..."
                          />
                        </div>
                      ))}
                      {formData.skills.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                          <Zap className="w-8 h-8 mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">No skills added yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Final Review & Deployment</h3>
                      <p className="text-xs text-[#8888a0]">Validate your agent's DNA before committing to the registry.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white uppercase italic">Integrity Status</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-[#8888a0]">
                            <span>Checksum</span>
                            <span className="text-[#00dbe9]">SHA-256</span>
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] break-all text-white/60">
                            {liveChecksum}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-5 h-5 text-[#00dbe9]" />
                          <h4 className="text-sm font-bold text-white uppercase italic">Identity Layer</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-[#8888a0]">Assigned DID</p>
                          <p className="text-xs font-mono text-white truncate">did:axiom:axiomid.app:agent-{formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'temp'}</p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">Sovereign Ready</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-[#00dbe9]/5 border border-[#00dbe9]/20 flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-[#00dbe9] shrink-0 mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white uppercase italic">Deployment Confirmation</p>
                        <p className="text-xs text-[#8888a0] leading-relaxed">
                          By deploying, you are anchoring this agent's identity and metadata. This action is recorded in the Axiom Registry.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="mt-12 flex items-center justify-between gap-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className={cn(
                      "flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl",
                      isStepValid(currentStep)
                        ? "bg-[#00dbe9] text-black shadow-[#00dbe9]/20 hover:scale-[1.02] active:scale-95"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={!allStepsValid || isDeploying}
                    className={cn(
                      "relative overflow-hidden flex items-center gap-3 px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl",
                      allStepsValid && !isDeploying
                        ? "bg-gradient-to-r from-[#00dbe9] to-[#6366f1] text-black shadow-[#00dbe9]/40 hover:scale-[1.02] active:scale-95 animate-pulse"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        Validate & Deploy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Side */}
          <div className="xl:col-span-5 flex flex-col gap-6 h-[calc(100vh-12rem)] sticky top-24">
            <div className="flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00dbe9]" />
                  Manifest Preview
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-[#8888a0] uppercase tracking-widest font-bold italic">Integrity:</p>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Live</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-1 bg-[#0e0e12] border border-white/[0.05] rounded-lg">
                {["yaml", "json", "visualizer"].map((format) => (
                  <button
                    key={format}
                    onClick={() => setPreviewFormat(format as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                      previewFormat === format ? "bg-white/[0.08] text-white" : "text-[#404050] hover:text-[#8888a0]"
                    )}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Content & Validation */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 glass-panel-heavy rounded-[2rem] overflow-hidden border-white/[0.08] relative group flex flex-col">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-[#050507]/80 border border-white/10 rounded-lg hover:border-[#00dbe9]/50 text-white transition-all shadow-xl"
                    title="Copy"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-[#00dbe9]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-[#050507]/80 border border-white/10 rounded-lg hover:border-[#00dbe9]/50 text-white transition-all shadow-xl"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                  {previewFormat === "visualizer" ? (
<<<<<<< HEAD
                    <div className="flex-1 p-0">
                      <BOMVisualizer formData={formData} />
                    </div>
                  ) : previewFormat === "discovery" && currentStep === 5 ? (
                      <div className="flex flex-col gap-8 h-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                          <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border-white/10">
                              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                Risk Assessment
                              </h3>
                              
                              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                <div>
                                  <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Risk Score</p>
                                  <p className={`text-4xl font-display font-black ${
                                    (abomReport?.score || 0) > 80 ? 'text-emerald-400' : 
                                    (abomReport?.score || 0) > 60 ? 'text-amber-400' : 'text-red-400'
                                  }`}>
                                    {isScanning ? '...' : abomReport?.score || 'N/A'}
                                  </p>
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black ${
                                  (abomReport?.score || 0) > 80 ? 'bg-emerald-400/10 text-emerald-400' : 
                                  (abomReport?.score || 0) > 60 ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'
                                }`}>
                                  {isScanning ? '?' : abomReport?.grade || '-'}
                                </div>
                              </div>
      
                              <div className="space-y-3">
                                {isScanning ? (
                                  <div className="flex items-center gap-3 py-4 text-white/40">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Scanning DNA...
                                  </div>
                                ) : abomReport?.risks.length ? (
                                  abomReport.risks.map((risk, i) => (
                                    <div key={i} className="flex gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-xs font-bold text-red-300 uppercase">{risk.category}</p>
                                        <p className="text-sm text-red-200/70 leading-relaxed">{risk.message}</p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <p className="text-sm text-emerald-300">No critical risks detected.</p>
                                  </div>
                                )}
                              </div>
      
                              <button 
                                onClick={async () => scanYaml(await stringifyYamlSafe(formData))}
                                className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold transition border border-white/5"
                              >
                                Trigger Deep Scan
                              </button>
                            </div>
                          </div>
                          
                          <div className="glass-panel rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40 min-h-[500px]">
                            <BOMVisualizer formData={formData} />
                          </div>
                        </div>
                      </div>
=======
                    <BOMVisualizer formData={formData} />
>>>>>>> 84be82e (feat(builder): implement live SHA-256, smart validation, and deploy pipeline)
                  ) : (
                    <motion.div
                      key={manifestContent}
                      initial={checksumAnimating ? { opacity: 0.5 } : { opacity: 1 }}
                      animate={{ opacity: 1 }}
                      className="h-full overflow-auto custom-scrollbar p-6 font-mono text-xs leading-relaxed text-[#8888a0]"
                    >
                      <pre className="whitespace-pre-wrap break-all">
                        {manifestContent}
                      </pre>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Live Validator Component */}
              <div className="h-[200px] shrink-0">
                <LiveValidator 
                  content={manifestContent} 
                  fileName={`agent.${previewFormat === 'yaml' ? 'aix' : 'json'}`}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {deployResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setDeployResult(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass-panel-heavy rounded-[3rem] border-white/10 p-12 text-center space-y-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00dbe9] to-[#6366f1]" />

              <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tight">Agent Live</h2>
                <p className="text-[#8888a0] uppercase tracking-[0.2em] text-[10px] font-black">Identity Anchored Successfully</p>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-left">
                  <div>
                    <p className="text-[10px] font-black text-[#8888a0] uppercase">Agent ID</p>
                    <p className="text-sm font-mono text-white">{deployResult.agentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#8888a0] uppercase">Integrity</p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase italic">Verified SHA-256</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push(deployResult.manifestUrl)}
                  className="flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  View Agent <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setDeployResult(null);
                    setCurrentStep(1);
                    // Reset form logic here if needed
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Deploy Another
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
