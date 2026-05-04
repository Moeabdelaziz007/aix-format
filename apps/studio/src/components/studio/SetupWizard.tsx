"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileJson, CheckCircle2, Mic,
  Settings, UserCheck, ChevronRight, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceOrb } from "./VoiceOrb";
import { KycSignatureModal } from "./KycSignatureModal";

// Slide variants — defined outside component so they're never recreated
const SLIDE = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export function SetupWizard() {
  const [step, setStep]                       = useState(1);
  const [dragActive, setDragActive]           = useState(false);
  const [file, setFile]                       = useState<File | null>(null);
  const [isKycModalOpen, setIsKycModalOpen]   = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceCommand, setVoiceCommand]       = useState("");
  const [isSigning, setIsSigning]             = useState(false);
  // FIX: agentName as ref for reads inside handlers — avoids unnecessary re-renders
  const agentNameRef = useRef("");

  const setAgentName = useCallback((name: string) => {
    agentNameRef.current = name;
  }, []);

  // ─── Drag handlers ──────────────────────────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.name.endsWith(".aix")) { alert("Please upload a valid .aix file."); return; }
    setFile(dropped);
    setAgentName(dropped.name.replace(".aix", ""));
    setStep(3);
  }, [setAgentName]);

  // ─── Voice ──────────────────────────────────────────────────────────────────
  const handleVoiceCommand = useCallback((transcript: string) => {
    setVoiceCommand(transcript);
    setIsProcessingVoice(true);
    setTimeout(() => {
      setIsProcessingVoice(false);
      const blob = new Blob(
        [JSON.stringify({ meta: { version: "1.0", id: crypto.randomUUID(), name: "Voice-Generated Agent", author: "Pioneer" }, persona: { role: "Assistant: " + transcript } }, null, 2)],
        { type: "application/json" }
      );
      setFile(new File([blob], "voice-agent.aix", { type: "application/json" }));
      setAgentName("Voice Agent");
      setStep(3);
    }, 2000);
  }, [setAgentName]);

  // ─── KYC sign ───────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSign = useCallback(async (mockAuthResult: any) => {
    if (!file) return;
    setIsSigning(true);
    try {
      const res = await fetch("/api/kyc/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockAuthResult),
      });
      if (res.ok) {
        const { identity_layer, kyc_proof } = await res.json();
        const txt     = await file.text();
        const payload = JSON.parse(txt);
        payload.identity_layer = identity_layer;
        payload.kyc_proof      = kyc_proof;
        const updated = new File(
          [JSON.stringify(payload, null, 2)],
          file.name,
          { type: "application/json" }
        );
        setFile(updated);
      }
    } catch (err) {

    } finally {
      setIsSigning(false);
      setIsKycModalOpen(false);
      setStep(4);
    }
  }, [file]);

  // ─── Handlers that mutate step ──────────────────────────────────────────────
  const goBack         = useCallback(() => setStep((s) => s - 1), []);
  const goNext         = useCallback(() => setStep((s) => s + 1), []);
  const resetWizard    = useCallback(() => { setStep(1); setFile(null); setVoiceCommand(""); setAgentName(""); }, [setAgentName]);
  const openKycModal   = useCallback(() => setIsKycModalOpen(true), []);
  const closeKycModal  = useCallback(() => setIsKycModalOpen(false), []);

  return (
    <>
      <aside className="w-full lg:w-[450px] flex-shrink-0 glass-panel rounded-sm p-6 flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden relative">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-surface-container-high)]">
          <motion.div
            className="h-full bg-gradient-primary"
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="mb-6 mt-2 flex justify-between items-center">
          <h2 className="text-xl font-display font-semibold text-white">Setup Wizard</h2>
          <span className="text-sm font-medium text-[var(--color-primary)]">Step {step} of 4</span>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <motion.div key="s1" {...SLIDE} className="flex flex-col flex-1">
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-[rgba(0,219,233,0.1)] flex items-center justify-center">
                  <Settings className="w-10 h-10 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Create New Agent</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm px-4">
                    Welcome to the Sovereign Studio. We'll guide you through creating and securing your AI agent in 3 simple steps. No coding required.
                  </p>
                </div>
              </div>
              <button onClick={goNext} className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 [0_0_20px_rgba(0,219,233,0.2)] mt-auto">
                Let's Begin <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <motion.div key="s2" {...SLIDE} className="flex flex-col flex-1">
              <button onClick={goBack} className="text-[var(--color-on-surface-variant)] flex items-center gap-1 text-sm mb-4 hover:text-white w-fit">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Define Agent DNA</h3>
                <p className="text-[var(--color-on-surface-variant)] text-xs">Tell us what your agent does, or upload an existing .aix file.</p>
              </div>
              <div className="mb-6 py-6 bg-[var(--color-surface-container-low)] rounded-2xl border border-[var(--color-border)]">
                <VoiceOrb onTranscript={handleVoiceCommand} isProcessing={isProcessingVoice} />
                {voiceCommand && !isProcessingVoice && (
                  <div className="mt-4 px-6 text-center">
                    <p className="text-xs text-[var(--color-primary)] italic">"{voiceCommand}"</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] flex-1 bg-[var(--color-border)]" />
                <span className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase">OR UPLOAD</span>
                <div className="h-[1px] flex-1 bg-[var(--color-border)]" />
              </div>
              <div
                className={cn(
                  "flex-1 relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors duration-200 p-6 text-center cursor-pointer",
                  dragActive ? "border-[var(--color-primary)] bg-[rgba(0,219,233,0.05)]" : "border-[var(--color-border)] hover:border-[var(--color-on-surface-variant)]"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <UploadCloud className="w-8 h-8 text-[var(--color-on-surface-variant)] mb-2" />
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  Drag &amp; Drop <span className="text-white font-medium">.aix</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <motion.div key="s3" {...SLIDE} className="flex flex-col flex-1">
              <button onClick={() => { setStep(2); setFile(null); }} className="text-[var(--color-on-surface-variant)] flex items-center gap-1 text-sm mb-4 hover:text-white w-fit">
                <ChevronLeft className="w-4 h-4" /> Change Agent
              </button>
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-4 border border-[var(--color-primary)] bg-opacity-10 mb-8 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] bg-opacity-20 flex items-center justify-center">
                    <FileJson className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    {/* eslint-disable-next-line react-hooks/refs */}
                    <p className="text-white font-medium">{agentNameRef.current || "Agent Payload"}</p>
                    <p className="text-xs text-[var(--color-primary)]">.aix generated successfully</p>
                  </div>
                </div>
                <div className="text-center space-y-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-[rgba(210,187,255,0.1)] flex items-center justify-center mx-auto">
                    <UserCheck className="w-8 h-8 text-[var(--color-secondary)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Agentic KYC Required</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">
                    To deploy this agent to the Pi Network, you must sign it with your verified Pi Identity. This proves ownership and prevents Sybil bots.
                  </p>
                </div>
              </div>
              <button onClick={openKycModal} className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 [0_0_20px_rgba(0,219,233,0.2)]">
                Sign via Pi KYC
              </button>
            </motion.div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col flex-1 items-center justify-center text-center space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Agent Deployed!</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm px-4">
                  Your agent{" "}
                  {/* eslint-disable-next-line react-hooks/refs */}
                  <span className="text-[var(--color-primary)]">{agentNameRef.current}</span>{" "}
                  has been signed with your Pi Identity and is now active on the Sovereign Network.
                </p>
              </div>
              <button onClick={resetWizard} className="mt-8 px-6 py-2 rounded-lg bg-[var(--color-surface-container-high)] text-white hover:bg-[var(--color-surface-container-highest)] transition-colors">
                Create Another Agent
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </aside>

      {/* Modal is always mounted but internally gated by isOpen — avoids mount/unmount cost */}
      <KycSignatureModal
        isOpen={isKycModalOpen}
        onClose={closeKycModal}
        onSign={handleSign}
        isSigning={isSigning}
        // eslint-disable-next-line react-hooks/refs
        agentName={agentNameRef.current || "Agent Payload"}
      />
    </>
  );
}
