"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input, Badge, InfoTooltip } from "@/components/shared";
import { tokens } from "@/design-system/tokens";
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
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Database,
  Lock,
  Mic,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAbom } from '@/hooks/useAbom';
import { toast } from 'sonner';
import { stringifyYamlSafe, sha256Hex, parseYamlSafe, computeManifestChecksum, cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { AgentRecord, Manifest, AgentSkill, McpPrompt } from "@/lib/types";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import LiveValidator from "@/components/studio/LiveValidator";
import BOMVisualizer from "@/components/studio/BOMVisualizer";
import { VoiceWizard } from "@/components/studio/VoiceWizard";
import { validateBuilderField, FieldError } from "@/lib/builder-validation";
import { useBuilderState } from "@/hooks/useBuilderState";
import { logger } from "@/lib/logger";

const STEPS = [
  { id: 1, name: "Context", icon: <Database className="w-4 h-4" /> },
  { id: 2, name: "Persona", icon: <Cpu className="w-4 h-4" /> },
  { id: 3, name: "Abilities", icon: <Zap className="w-4 h-4" /> },
  { id: 4, name: "Economics", icon: <Wallet className="w-4 h-4" /> },
  { id: 5, name: "Security", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 6, name: "Finalize", icon: <Rocket className="w-4 h-4" /> }
];

// ROLE: screen
// ROLE: screen
export default function AgentBuilderPage() {
  const router = useRouter();
  const { scanYaml, report: abomReport } = useAbom();
  
  const {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    errors,
    touchedFields,
    liveChecksum,
    handleFieldChange,
    handleBlur,
    isStepValid,
  } = useBuilderState();

  const [onboardingStep, setOnboardingStep] = useState<'intent' | 'wizard'>('intent');
  const [userIntent, setUserIntent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<"yaml" | "json" | "discovery" | "visualizer" | "narrative">("narrative");
  const [copied, setCopied] = useState(false);
  const [manifestContent, setManifestContent] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ agentId: string; manifestUrl: string } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isVoiceWizardOpen, setIsVoiceWizardOpen] = useState(false);
  const [checksumAnimating, setChecksumAnimating] = useState(false);
  const [saasBomEnabled, setSaasBomEnabled] = useState(false);

  const prevChecksumRef = useRef(liveChecksum);

  useEffect(() => {
    logger.debug("Builder State Updated", { step: currentStep, name: formData.meta.name });
  }, [currentStep, formData.meta.name]);

  useEffect(() => {
    if (prevChecksumRef.current !== liveChecksum) {
      setChecksumAnimating(true);
      const timer = setTimeout(() => setChecksumAnimating(false), 500);
      prevChecksumRef.current = liveChecksum;
      return () => clearTimeout(timer);
    }
  }, [liveChecksum]);

  // Magic Generate Logic
  const handleMagicGenerate = async (intent: string) => {
    setIsGenerating(true);
    // Simulate LLM processing time
    await new Promise(r => setTimeout(r, 1500));
    
    const lowerIntent = intent.toLowerCase();
    let generatedData = { ...formData };

    if (lowerIntent.includes("audit") || lowerIntent.includes("security")) {
      generatedData.meta.name = "Sovereign Auditor";
      generatedData.meta.description = "Autonomous security agent specialized in manifest validation and SLSA compliance auditing.";
      generatedData.persona.role = "Security Compliance Expert";
      generatedData.persona.instructions = "Your goal is to scan AIX manifests for supply chain vulnerabilities. Prioritize ABOM integrity and did:axiom verification.";
      generatedData.skills = [
        { name: "scanABOM", description: "Deep analysis of Agent Bill of Materials" },
        { name: "verifySignature", description: "Cryptographic manifest validation" }
      ];
    } else if (lowerIntent.includes("research") || lowerIntent.includes("market")) {
      generatedData.meta.name = "Insight Weaver";
      generatedData.meta.description = "High-fidelity market research agent with deep-web retrieval capabilities.";
      generatedData.persona.role = "Strategic Analyst";
      generatedData.persona.instructions = "Extract actionable market insights from fragmented web data. Focus on emerging AI trends and protocol adoption.";
      generatedData.skills = [
        { name: "webSearch", description: "Real-time web browsing and indexing" },
        { name: "sentimentAnalysis", description: "Extracting emotional tone from textual data" }
      ];
    } else {
      generatedData.meta.name = "Custom Sovereign Agent";
      generatedData.meta.description = `An agent tailored for: ${intent}`;
      generatedData.persona.role = "Generalist Assistant";
    }

    setFormData(generatedData);
    setIsGenerating(false);
    setOnboardingStep('wizard');
    toast.success("Manifest skeleton generated!");
  };

  const handleVoiceWizardComplete = (generatedManifest: any) => {
    setFormData((prev) => ({
      ...prev,
      ...generatedManifest,
      meta: { ...prev.meta, ...generatedManifest.meta },
      economics: { ...prev.economics, ...generatedManifest.economics },
      persona: { ...prev.persona, ...generatedManifest.persona }
    }));
    setIsVoiceWizardOpen(false);
    setOnboardingStep('wizard');
    toast.success("Voice Wizard draft applied!");
  };

  const handleVoiceWizardDeploy = async (generatedManifest: any) => {
    handleVoiceWizardComplete(generatedManifest);
    // Future: Trigger actual deployment logic here
    toast.info("Proceeding to final review before deployment...");
  };

  // Generate Manifest Content (Async)
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

      // Handle SaaS-BOM toggle
      if (!saasBomEnabled && manifest.abom) {
        delete manifest.abom.saas_services;
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
        // Dynamic import to avoid SSR issues if any, or just use the local generator
        const { generateAIXDiscovery } = await import("@/lib/mcp-generator");
        const disc = generateAIXDiscovery(manifest, "https://agent.example.com");
        setManifestContent(JSON.stringify(disc, null, 2));
      } else if (previewFormat === "narrative") {
        const story = `This agent is named **${formData.meta.name || 'Unnamed'}**. It operates as a **${formData.persona.role || 'Generalist'}** with a **${formData.persona.tone}** tone.
        
Its core mission is: "${formData.meta.description || 'Not yet defined.'}"

To achieve this, it utilizes **${formData.skills.length} sovereign skills** including ${formData.skills.map(s => s.name).join(', ') || 'basic reasoning'}.

Payments are settled on the **${formData.economics.settlement.layer.replace('_', ' ')}** network, using **${formData.economics.settlement.currency}** as the primary unit of exchange. 

The agent is anchored via **AxiomID** at **${formData.identity_layer.id}**.`;
        setManifestContent(story);
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
      const slug = formData.meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unnamed-agent';
      const manifestContent = await stringifyYamlSafe(formData);
      
      const integrityHash = await sha256Hex(manifestContent);
      
      const id = crypto.randomUUID();
      const agentId = `${slug}-${id.slice(0, 4)}`;

      const record: AgentRecord = {
        id: agentId,
        name: formData.meta.name || "Unnamed Agent",
        role: formData.persona.role || "AI Assistant",
        createdAt: new Date().toISOString(),
        yaml: manifestContent,
        did: `did:aix:${id.replace(/-/g, '').slice(0, 32)}`,
        kyc_tier: formData.identity_layer.kyc_tier as any,
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

      // In-memory save (Registry will pick it up)
      const { saveAgent } = await import("@/lib/registry");
      await saveAgent(record);
      
      // Also trigger browser download
      const blob = new Blob([manifestContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}.aix.yaml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Manifest exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export manifest");
    }
  };

    const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const isStepValid = (stepId: number) => {
    switch (stepId) {
      case 1: // Context
        return !!formData.meta.name &&
               !!formData.meta.version &&
               !!formData.meta.author &&
               formData.meta.name.length >= 3 &&
               !errors.name && !errors.version && !errors.author;
      case 2: // Persona
        return !!formData.persona.role && !!formData.persona.instructions && !errors.role && !errors.instructions;
      case 3: // Abilities
        return true; // Skills/MCP optional
      case 4: // Economics
        return !!formData.economics.settlement.layer;
      case 5: // Security
        return formData.identity_layer.kyc_tier !== 'unverified';
      case 6: // Finalize
        return true;
      default:
        return false;
    }
  };

  const allStepsValid = useMemo(() => {
    return [1, 2, 4, 5].every(id => isStepValid(id));
  }, [formData, errors]);

  const handleDeploy = async () => {
    if (!allStepsValid) {
      toast.error("Please complete all required fields first.");
      return;
    }

    setIsDeploying(true);
    // Simulate initial phase of deployment
    await new Promise(r => setTimeout(r, 1000));
    
    // Deployment "Triggered"
    setIsDeploying(false);
    setShowUndo(true);
    
    const toastId = toast.success("Deployment initiated!", {
      description: "You have 30 seconds to undo this action.",
      action: {
        label: "Undo Deploy",
        onClick: () => handleUndoDeploy(toastId)
      },
      duration: 30000
    });

    const timeout = setTimeout(async () => {
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
          toast.success("Agent officially anchored!");
          setShowUndo(false);
          
          setTimeout(() => {
            router.push(`/agents/${data.agentId}`);
          }, 1500);
        } else {
          toast.error(data.error || "Deployment failed");
        }
      } catch (err) {
        toast.error("Network error during deployment");
      } finally {
        setShowUndo(false);
      }
    }, 30000);

    setUndoTimeout(timeout);
  };

  const handleUndoDeploy = (toastId: string | number) => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setShowUndo(false);
    toast.dismiss(toastId);
    toast.info("Deployment aborted successfully.");
  };

  const updateMeta = (field: string, value: any) => handleFieldChange('meta', field, value);
  const updatePersona = (field: string, value: any) => handleFieldChange('persona', field, value);
  
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

  const updateIdentity = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      identity_layer: {
        ...prev.identity_layer,
        [field]: value
      }
    }));
  };

  const updateEconomics = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      economics: {
        ...prev.economics,
        settlement: {
          ...prev.economics.settlement,
          [field]: value
        }
      }
    }));
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar />
      <SovereignStatusBar />

      <main className="container mx-auto pt-24 pb-12 px-4 flex flex-col gap-8">
        {onboardingStep === 'intent' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full py-12 space-y-12"
          >
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase">
                What will your <span className="text-primary">Agent</span> do?
              </h1>
              <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                Describe your agent's purpose in natural language. Our sovereign architect will draft the technical manifest for you.
              </p>
            </div>

            <div className="glass-panel-heavy p-8 rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-2xl space-y-6">
              <textarea
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                placeholder="e.g. I want a security agent that audits smart contracts and reports vulnerabilities to my private slack channel..."
                className="w-full h-48 bg-transparent text-2xl text-white placeholder:text-zinc-800 focus:outline-none resize-none leading-tight"
              />
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex gap-2">
                   {['Security Auditor', 'Market Researcher', 'Content Creator'].map(t => (
                     <button 
                      key={t}
                      onClick={() => handleMagicGenerate(t)}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                     >
                       {t}
                     </button>
                   ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsVoiceWizardOpen(true)}
                    className="px-8 py-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-3"
                  >
                    <Mic className="w-5 h-5" />
                    Setup with Voice
                  </button>
                  <button
                    disabled={!userIntent || isGenerating}
                    onClick={() => handleMagicGenerate(userIntent)}
                    className="px-10 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(0,219,233,0.3)] hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Generate DNA
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isVoiceWizardOpen && (
                <VoiceWizard 
                  onClose={() => setIsVoiceWizardOpen(false)} 
                  onComplete={handleVoiceWizardComplete}
                  onDeploy={handleVoiceWizardDeploy}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 hover:opacity-100 transition-opacity">
               <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-2">
                  <ShieldCheck className="text-primary w-6 h-6" />
                  <div className="font-bold text-white text-sm">Protocol Aligned</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Built-in AIX v1.3 Support</div>
               </div>
               <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-2">
                  <Database className="text-purple-mcp w-6 h-6" />
                  <div className="font-bold text-white text-sm">MCP Ready</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Pre-configured toolhooks</div>
               </div>
               <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-2">
                  <Lock className="text-emerald-500 w-6 h-6" />
                  <div className="font-bold text-white text-sm">Zero-Trust DNA</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Cryptographic sandboxing</div>
               </div>
            </div>
          </motion.div>
        ) : (
          <>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setOnboardingStep('intent')}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-zinc-500 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
                Agent Builder
              </h1>
              <InfoTooltip content="AIX Studio uses a structured approach to agent construction. Each tab represents a layer of the Sovereign Protocol." />
            </div>
            <p className="text-foreground/50 max-w-xl leading-relaxed">
              Refine your agent's high-fidelity DNA. All fields are pre-validated against the AIX v1.3 standard.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface-2 border border-white/5 p-1.5 rounded-2xl">
            {STEPS.map((step) => {
              const isLocked = step.id > currentStep && !isStepValid(step.id - 1);
              return (
                <button
                  key={step.id}
                  disabled={isLocked}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                    isLocked ? "opacity-30 cursor-not-allowed" : "opacity-100",
                    currentStep === step.id
                      ? "bg-white/10 text-white shadow-xl shadow-black/40"
                      : isStepValid(step.id)
                        ? "text-primary hover:text-white"
                        : "text-foreground/20 hover:text-foreground/40"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all",
                    currentStep === step.id
                      ? "bg-primary border-primary text-primary-dark shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      : isStepValid(step.id)
                        ? "bg-success/10 border-success/40 text-success"
                        : "bg-white/5 border-white/10 text-white/20"
                  )}>
                    {isStepValid(step.id) ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className="hidden sm:inline uppercase tracking-widest">{step.name}</span>
                  {currentStep === step.id && (
                    <motion.div
                      layoutId="activeStep"
                      className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
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
                        <div className="flex items-center gap-2 ml-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Agent Name</label>
                          <InfoTooltip content="The public name of your agent as it will appear in the registry and marketplace." />
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            value={formData.meta.name}
                            onChange={(e) => handleFieldChange('meta', 'name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={cn(
                              "w-full bg-[#05050a] border p-4 rounded-2xl text-white placeholder:text-[#404050] focus:outline-none transition-all shadow-inner",
                              touchedFields.name && errors.name ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#00dbe9]/50"
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

                    <div className="space-y-4 p-6 rounded-3xl bg-black/40 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Identity Provider</label>
                          <InfoTooltip content="Sovereign identity requires a verifiable source. Pi Network provides Sybil-resistance, while WorldID offers biometric proof." />
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">Sovereign</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'pi_network', name: 'Pi Network' },
                          { id: 'world_id', name: 'WorldID' },
                          { id: 'ens', name: 'ENS / ETH' }
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => updateIdentity('provider', { ...formData.identity_layer.provider, type: p.id, name: p.name })}
                            className={cn(
                              "p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              formData.identity_layer.provider.type === p.id
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-white/5 border-white/5 text-[#404050] hover:text-[#8888a0]"
                            )}
                          >
                            {p.name}
                          </button>
                        ))}
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
                          "w-full bg-[#05050a] border p-4 rounded-2xl text-white focus:outline-none transition-all",
                          touchedFields.author && errors.author ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#00dbe9]/50"
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
                      <div className="flex items-center gap-2 ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Operational Role</label>
                        <InfoTooltip content="The high-level job title of the agent (e.g., 'Financial Auditor'). This defines its core identity." />
                      </div>
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
                      <div className="flex items-center gap-2 ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">System Instructions</label>
                        <InfoTooltip content="Detailed behavioral guidelines. This is the 'hidden' prompt that dictates how the agent acts, thinks, and handles edge cases." />
                      </div>
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

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Persona Template</label>
                        <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">AI Guided</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'professional', label: 'Professional', icon: '👔' },
                          { id: 'technical', label: 'Technical', icon: '💻' },
                          { id: 'friendly', label: 'Friendly', icon: '🤝' },
                          { id: 'creative', label: 'Creative', icon: '🎨' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleFieldChange('persona', 'tone', t.id)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all text-left space-y-1",
                              formData.persona.tone === t.id
                                ? "bg-primary/10 border-primary text-white"
                                : "bg-white/5 border-white/5 text-[#8888a0] hover:border-white/20"
                            )}
                          >
                            <span className="text-xl">{t.icon}</span>
                            <p className="text-[10px] font-bold uppercase tracking-tight">{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Communication Tone</label>
                        <span className="text-[10px] font-bold text-white uppercase">{formData.persona.tone}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="4" 
                        step="1"
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1">
                        <span>Formal</span>
                        <span>Casual</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="pt-6 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Economics & Settlement</h3>
                        <p className="text-xs text-[#8888a0]">Configure how this agent earns and settles transactions.</p>
                      </div>

                      <div className="space-y-4 p-6 rounded-3xl bg-black/40 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Settlement Layer</label>
                          <InfoTooltip content="Select the network where payments are processed. Pi Network is the default for M2M micro-payments." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'pi_network', name: 'Pi Network' },
                            { id: 'ethereum', name: 'Ethereum' },
                            { id: 'solana', name: 'Solana' },
                            { id: 'stripe', name: 'Stripe (Fiat)' }
                          ].map((l) => (
                            <button
                              key={l.id}
                              onClick={() => updateEconomics('layer', l.id)}
                              className={cn(
                                "p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-center",
                                formData.economics.settlement.layer === l.id
                                  ? "bg-purple-mcp/20 border-purple-mcp text-purple-mcp"
                                  : "bg-white/5 border-white/5 text-[#404050] hover:text-[#8888a0]"
                              )}
                            >
                              {l.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between ml-1">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Service Pricing</label>
                           <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-emerald-400 uppercase">AI Suggested</span>
                              <span className="text-[10px] font-bold text-white">0.5 π / call</span>
                           </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">π</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            className="input pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Pricing Model</label>
                          <select 
                            value={formData.economics.pricing_model}
                            onChange={(e) => setFormData(prev => ({ ...prev, economics: { ...prev.economics, pricing_model: e.target.value } }))}
                            className="w-full bg-[#05050a] border border-white/10 p-4 rounded-2xl text-white text-xs focus:outline-none focus:border-primary/50 transition-all appearance-none"
                          >
                            <option value="pay_per_call">Pay-per-call</option>
                            <option value="subscription">Subscription</option>
                            <option value="freemium">Freemium</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0]">Default Currency</label>
                          <input 
                            type="text"
                            value={formData.economics.settlement.currency}
                            onChange={(e) => updateEconomics('currency', e.target.value)}
                            className="w-full bg-[#05050a] border border-white/10 p-4 rounded-2xl text-white text-xs focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="PI, ETH, SOL..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Capabilities & Tools</h3>
                      <p className="text-xs text-[#8888a0]">Define what your agent can do. Use AI suggestions or add tools manually.</p>
                    </div>

                    {/* AI Suggestions */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI Suggestions</label>
                        <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase">Based on intent</Badge>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-4">
                         <div className="flex items-start justify-between">
                            <div className="space-y-1">
                               <div className="text-sm font-bold text-white flex items-center gap-2">
                                  📊 Financial Analyst Template
                               </div>
                               <p className="text-[10px] text-zinc-500 leading-relaxed">
                                  Uses: Yahoo Finance MCP, Bloomberg API, Sentiment Analysis
                               </p>
                            </div>
                            <button 
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  skills: [
                                    { name: "Web Scraping", description: "Extract data from any URL" },
                                    { name: "Sentiment Analysis", description: "Detect emotional tone in text" }
                                  ],
                                  mcp: {
                                    ...prev.mcp,
                                    prompts: [{ name: "Yahoo Finance API", description: "Financial data access" }]
                                  }
                                }));
                                toast.success("Template applied!");
                              }}
                              className="px-4 py-2 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                              Use This Template
                            </button>
                         </div>
                      </div>
                    </div>

                    {/* Manual Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* MCP Servers */}
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">MCP Servers</label>
                          <div className="glass-panel-heavy rounded-2xl border-white/5 bg-black/40 overflow-hidden divide-y divide-white/5">
                             {[
                               { name: "Yahoo Finance API", tools: 5 },
                               { name: "Bloomberg Terminal", tools: 12 },
                               { name: "Alpha Vantage", tools: 8 }
                             ].map((server) => (
                               <div key={server.name} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                  <div className="space-y-0.5">
                                     <p className="text-xs font-bold text-white">{server.name}</p>
                                     <p className="text-[9px] text-zinc-600 uppercase font-black">{server.tools} Tools available</p>
                                  </div>
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary"
                                    checked={formData.skills.some(s => s.name === server.name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ ...prev, skills: [...prev.skills, { name: server.name, description: `MCP Server with ${server.tools} tools` }] }));
                                      } else {
                                        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s.name !== server.name) }));
                                      }
                                    }}
                                  />
                               </div>
                             ))}
                          </div>
                       </div>

                       {/* Skills */}
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8888a0] ml-1">Available Skills</label>
                          <div className="glass-panel-heavy rounded-2xl border-white/5 bg-black/40 overflow-hidden divide-y divide-white/5">
                             {[
                               { name: "Web Scraping", desc: "Extract data from any URL" },
                               { name: "Sentiment Analysis", desc: "Detect emotional tone in text" },
                               { name: "Technical Charting", desc: "Generate financial charts" }
                             ].map((skill) => (
                               <div key={skill.name} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                  <div className="space-y-0.5">
                                     <p className="text-xs font-bold text-white">{skill.name}</p>
                                     <p className="text-[9px] text-zinc-600 uppercase font-black">{skill.desc}</p>
                                  </div>
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary"
                                    checked={formData.skills.some(s => s.name === skill.name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ ...prev, skills: [...prev.skills, { name: skill.name, description: skill.desc }] }));
                                      } else {
                                        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s.name !== skill.name) }));
                                      }
                                    }}
                                  />
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Dynamic Preview */}
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                       <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Preview: Your agent will...</label>
                       </div>
                       <p className="text-xs text-zinc-500 leading-relaxed italic">
                          "{formData.skills.length > 0 
                            ? `Analyze data using ${formData.skills.map(s => s.name).join(', ')} and provide autonomous insights.`
                            : "Select capabilities to see what your agent will be able to perform."}"
                       </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Progressive Trust Disclosure</h3>
                      <p className="text-xs text-[#8888a0]">Verify the multi-layered trust stack protecting your sovereign agent.</p>
                    </div>

                    {/* Interactive Trust Layers */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Trust Score: 87/100</label>
                          <Badge variant="success" className="text-[8px] uppercase">Highly Reliable</Badge>
                       </div>
                       
                       <div className="glass-panel-heavy rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden divide-y divide-white/5">
                          {[
                            { label: 'Identity', value: 'Pi KYC Tier 2', status: '✓', details: 'KYC verified via AxiomID Auth', icon: <UserCheck className="w-4 h-4" />, color: 'text-emerald-400' },
                            { label: 'Code', value: 'SHA-256 Signed', status: '✓', details: 'Checksum: 0x88f...2a1', icon: <Lock className="w-4 h-4" />, color: 'text-emerald-400' },
                            { label: 'ABOM', value: '3 dependencies scanned', status: '✓', details: '1 minor vulnerability ignored', icon: <Database className="w-4 h-4" />, color: 'text-amber-400' },
                            { label: 'MCP', value: '2 servers connected', status: '✓', details: 'Both servers verified by Axiom Foundation', icon: <Zap className="w-4 h-4" />, color: 'text-emerald-400' },
                            { label: 'Economics', value: 'π 0.5/call', status: '✓', details: 'Pricing validated against network avg', icon: <Wallet className="w-4 h-4" />, color: 'text-primary' },
                          ].map((layer, i) => (
                            <button 
                              key={i} 
                              onClick={() => toast.info(`${layer.label}: ${layer.details}`)}
                              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
                            >
                               <div className="flex items-center gap-4">
                                  <div className={cn("p-2 rounded-lg bg-white/5 transition-colors group-hover:bg-white/10", layer.color)}>
                                     {layer.icon}
                                  </div>
                                  <div className="text-left">
                                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{layer.label}</p>
                                     <p className="text-sm font-bold text-white">{layer.value}</p>
                                  </div>
                               </div>
                               <div className={cn("text-lg font-black", layer.color)}>
                                  {layer.status}
                                  <ChevronRight className="inline ml-2 w-4 h-4 text-zinc-800 group-hover:text-white transition-colors" />
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Decision Log / Transparency */}
                    <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <AlertCircle size={18} />
                             </div>
                             <h4 className="text-sm font-bold text-white uppercase italic">Decision Log Preview</h4>
                          </div>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Transparency by Default</span>
                       </div>
                       
                       <div className="space-y-4">
                          <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                             "Your agent will record the reasoning behind every action. Users can audit why a specific tool was called or why a decision was made."
                          </p>
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-[9px]">
                             <div className="flex gap-4">
                                <span className="text-primary">[REASONING]</span>
                                <span className="text-zinc-400">Target price hit ($65k). Triggering market sell...</span>
                             </div>
                             <div className="flex gap-4">
                                <span className="text-purple-mcp">[TOOL_CALL]</span>
                                <span className="text-zinc-400">Binance_MCP.executeTrade("BTC", 0.5)</span>
                             </div>
                             <div className="flex gap-4">
                                <span className="text-emerald-400">[COST]</span>
                                <span className="text-zinc-400">0.02π (Gas: 0.001π)</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="w-5 h-5 text-[#00dbe9]" />
                          <h4 className="text-sm font-bold text-white uppercase italic">Source Attribution</h4>
                        </div>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                           <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-white/40 uppercase">Spec v1.3</span>
                              <span className="text-[#00dbe9]">axiom-protocol.org</span>
                           </div>
                           <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-white/40 uppercase">Audit Authority</span>
                              <span className="text-purple-mcp">Axiom Labs</span>
                           </div>
                        </div>
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

                {currentStep < 5 ? (
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
                {["narrative", "yaml", "json", "visualizer"].map((format) => (
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

            {/* Visualizer Legend */}
            {previewFormat === "visualizer" && (
              <div className="flex items-center gap-4 px-4 py-3 bg-black/40 border border-white/5 rounded-2xl shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Metadata</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-mcp" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">MCP Tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Economics</span>
                </div>
              </div>
            )}

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
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
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
                            onChange={(e) => updateAbom("bom_format", e.target.value as any)}
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
                            onChange={(e) => updateAbom("risk_level", e.target.value as any)}
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

                      <div className="pt-6 border-t border-white/[0.05] mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#00dbe9]" />
                            <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">SaaS-BOM (SaaS Inventory)</label>
                            <InfoTooltip content="Track 3rd-party SaaS services your agent relies on. Part of the AIX v1.3 sovereign transparency standard." />
                          </div>
                          <button
                            onClick={() => setSaasBomEnabled(!saasBomEnabled)}
                            className={cn(
                              "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                              saasBomEnabled ? "bg-[#00dbe9]" : "bg-white/10"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                saasBomEnabled ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {saasBomEnabled && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-[#404050]">Track 3rd-party SaaS dependencies.</p>
                              <button
                                onClick={addSaasService}
                                className="btn btn-sm btn-ghost hover:border-[#00dbe9]/50 text-[#00dbe9] py-1 h-auto"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Service
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(formData.abom.saas_services || []).map((service, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3 relative group">
                                  <button
                                    onClick={() => removeSaasService(idx)}
                                    className="absolute top-2 right-2 p-1.5 text-[#404050] hover:text-[#ef4444] transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-white/40 uppercase">Service Name</label>
                                      <input
                                        placeholder="e.g. OpenAI API"
                                        value={service.name}
                                        onChange={(e) => updateSaasService(idx, "name", e.target.value)}
                                        className="input py-2 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-white/40 uppercase">Tier</label>
                                      <select
                                        value={service.tier}
                                        onChange={(e) => updateSaasService(idx, "tier", e.target.value)}
                                        className="input py-2 text-xs appearance-none bg-[#0e0e12]"
                                      >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                      </select>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase">Endpoint</label>
                                    <input
                                      placeholder="https://api.openai.com/v1"
                                      value={service.endpoint}
                                      onChange={(e) => updateSaasService(idx, "endpoint", e.target.value)}
                                      className="input py-2 text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#8888a0] uppercase tracking-wider">AxiomID KYC Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                          {["unverified", "basic", "verified", "institutional"].map((tier) => (
                            <button
                              key={tier}
                              onClick={() => updateIdentity("kyc_tier", tier)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                formData.identity_layer.kyc_tier === tier
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                                  : "bg-white/5 border-white/5 text-[#8888a0] hover:border-white/20"
                              }`}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-tight">{tier}</p>
                            </button>
                          ))}
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
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] flex gap-3">
              <button
                className="btn btn-ghost border-white/10 hover:bg-white/5 flex-1"
                onClick={handleExportAndSave}
                disabled={isDeploying}
              >
                <Download className="w-4 h-4 mr-2" /> Save & Export
              </button>
              
              <button
                className={`btn btn-primary-green-glow flex-[2] ${isDeploying ? 'opacity-50 cursor-wait' : ''}`}
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                {isDeploying ? (
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-spin" /> Deploying...
                  </span>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" /> Deploy to Sovereign Cloud
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
                <button 
                  onClick={() => setPreviewFormat("narrative")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    previewFormat === "narrative" ? "bg-emerald-500/10 text-emerald-400" : "text-[#404050] hover:text-[#8888a0]"
                  )}
                >
                  <UserCheck className="w-3 h-3" /> Story
                </button>
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
              <div className="flex-1 glass-panel-heavy rounded-[2rem] overflow-hidden border-white/[0.08] relative group flex flex-col">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-[#050507]/80 border border-white/10 rounded-lg hover:border-[#00dbe9]/50 text-white transition-all shadow-xl"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-[#00dbe9]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                  {previewFormat === "visualizer" ? (
                    <div className="flex-1 p-0">
                      <BOMVisualizer formData={formData} />
                    </div>
                  ) : previewFormat === "discovery" && currentStep === 6 ? (
                      <div className="p-6">
                         <div className="text-xl font-bold text-white mb-4">ABOM Discovery</div>
                         <BOMVisualizer formData={formData} />
                      </div>
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
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tight">Agent Live</h2>
                <p className="text-[#8888a0] uppercase tracking-[0.2em] text-[10px] font-black">Identity Anchored Successfully</p>
              </div>
              <div className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-left">
                  <p className="text-[10px] font-black text-[#8888a0] uppercase">Agent ID</p>
                  <p className="text-white font-mono text-xs">{deployResult.agentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#8888a0] uppercase">Integrity</p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase italic">Verified SHA-256</p>
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
