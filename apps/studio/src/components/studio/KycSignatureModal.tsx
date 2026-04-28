"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Fingerprint, KeyRound, Check, Loader2, Network, Lock } from "lucide-react";
import { useIdentityStore } from "@/store/identity";
import { useSignalStore } from "@/store/signals";
import { cn } from "@/lib/utils";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

interface KycSignatureModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 0, title: "Pi KYC", icon: ShieldCheck, desc: "تحقق من الهوية عبر شبكة Pi" },
  { id: 1, title: "did:axiom", icon: Fingerprint, desc: "توليد معرّف ذاتي السيادة" },
  { id: 2, title: "Sign", icon: KeyRound, desc: "توقيع التزام بمفتاحك الخاص" },
];

export function KycSignatureModal({ open, onClose }: KycSignatureModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number }[]>([]);

  const { kycStatus, did, setDid, setKyc } = useIdentityStore();
  const { push: addSignal } = useSignalStore();

  useEffect(() => {
    // Generate random nodes for the quantum topology background
    if (open) {
      const newNodes = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setNodes(newNodes);
    }
  }, [open]);

  const handleStart = async () => {
    setIsProcessing(true);
    setKyc("pending");

    // Step 0: Pi KYC
    setCurrentStep(0);
    await new Promise((r) => setTimeout(r, 1500));

    // Step 1: Generate DID
    setCurrentStep(1);
    const keypair = nacl.sign.keyPair();
    const mockDid = `did:axiom:axiomid.app:${naclUtil.encodeBase64(keypair.publicKey).slice(0, 16)}`;
    setDid(mockDid);

    // Step 2: Sign
    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 1000));
    
    const mockUid = `pi_user_${Date.now()}`;
    const mockAccessToken = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.mock_token_${Date.now()}`;

    const mockAuthResult = {
      accessToken: mockAccessToken,
      user: {
        uid: mockUid,
        username: "SovereignUser1"
      },
      signature: {
        publicKey: naclUtil.encodeBase64(keypair.publicKey),
        type: "Ed25519",
        timestamp: new Date().toISOString(),
        kyc_verified: true
      }
    };

    setKyc("verified", JSON.stringify(mockAuthResult.signature));

    addSignal({
      kind: "success",
      source: "KycAdapter",
      message: "Agent identity anchored and signed via Pi Network.",
    });

    setIsProcessing(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl p-[1px] shadow-2xl shadow-[var(--color-primary)]/20"
          >
            {/* Animated gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00dbe9] via-[#d2bbff] to-transparent opacity-50" />

            <div className="relative bg-[#070d1f] rounded-[23px] h-full overflow-hidden">
              
              {/* Quantum Topology Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                {nodes.map((node, i) => (
                  <div key={node.id}>
                    <motion.div
                      animate={{
                        y: [node.y + "%", (node.y + 10) + "%", node.y + "%"],
                        x: [node.x + "%", (node.x - 5) + "%", node.x + "%"]
                      }}
                      transition={{ repeat: Infinity, duration: 10 + (i % 5), ease: "linear" }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-[#00dbe9]"
                      style={{ top: `${node.y}%`, left: `${node.x}%` }}
                    />
                    {i < nodes.length - 1 && (
                      <svg className="absolute inset-0 w-full h-full">
                        <motion.line
                          x1={`${node.x}%`} y1={`${node.y}%`}
                          x2={`${nodes[i+1].x}%`} y2={`${nodes[i+1].y}%`}
                          stroke="url(#gradient)" strokeWidth="0.5" strokeDasharray="4 4"
                          animate={{ strokeDashoffset: [0, 20] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00dbe9" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#d2bbff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">Sovereign Protocol</h2>
                    <p className="text-xs text-white/50">Authenticate via Pi Network KYC</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative p-8 md:p-12 z-10 flex flex-col md:flex-row gap-8 items-center">
                
                {/* Visual Side */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="relative w-32 h-32 mb-6">
                      {isProcessing ? (
                         <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            className="absolute inset-0 rounded-full border border-dashed border-[#00dbe9]"
                          />
                           <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="absolute inset-2 rounded-full border border-dotted border-[#d2bbff]"
                          />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-10 h-10 text-[#00dbe9] animate-pulse" />
                           </div>
                         </>
                      ) : kycStatus === "verified" ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            <Check size={40} />
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-surface-container-high)]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Network className="w-12 h-12 text-[#d2bbff]" />
                          </div>
                        </>
                      )}
                   </div>

                   <h2 className="text-2xl font-display font-bold text-white mb-2">
                     {kycStatus === "verified" ? "Identity Verified" : "Agentic KYC Security"}
                   </h2>
                   <p className="text-sm text-[#94a3b8] leading-relaxed max-w-xs">
                     {kycStatus === "verified" 
                       ? `Authenticated with DID: ${did.substring(0, 20)}...`
                       : "Quantum Topology Architecture for immutable identity binding."}
                   </p>
                </div>

                {/* Action Side */}
                <div className="flex-1 w-full flex flex-col justify-center space-y-6">
                  {/* Steps Progress */}
                  <div className="flex justify-between relative px-2">
                    <div className="absolute left-8 right-8 top-5 h-[2px] bg-white/5 -z-10" />
                    {steps.map((s) => {
                      const isActive = currentStep >= s.id;
                      const isCurrent = currentStep === s.id;
                      const Icon = s.icon;
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                          <motion.div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                              isActive ? "border-[#00dbe9] bg-[#00dbe9]/20 text-[#00dbe9]" : "border-white/10 bg-black/50 text-white/30"
                            )}
                            animate={isCurrent && isProcessing ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0 0 rgba(0,219,233,0)", "0 0 0 10px rgba(0,219,233,0.2)", "0 0 0 0 rgba(0,219,233,0)"] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Icon size={18} />
                          </motion.div>
                          <p className={cn("text-[10px] font-medium uppercase tracking-wider", isActive ? "text-white" : "text-white/40")}>{s.title}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-start gap-4 group hover:border-[#00dbe9]/50 transition-colors">
                      <ShieldCheck className="w-5 h-5 text-[#00dbe9] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">AxiomID Cryptography</h4>
                        <p className="text-xs text-[#94a3b8]">Ed25519 signature binds your Pi Network identity to your agent.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-start gap-4 group hover:border-[#d2bbff]/50 transition-colors">
                      <Fingerprint className="w-5 h-5 text-[#d2bbff] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">Sybil Resistance</h4>
                        <p className="text-xs text-[#94a3b8]">Ensures 1 Human = 1 Identity in the M2M ecosystem.</p>
                      </div>
                    </div>
                  </div>

                  {kycStatus !== "verified" && (
                    <button
                      onClick={handleStart}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,219,233,0.3)] hover:shadow-[0_0_30px_rgba(0,219,233,0.5)] disabled:opacity-50 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative flex items-center gap-2">
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {currentStep === 0 && "Handshaking..."}
                            {currentStep === 1 && "Generating DID..."}
                            {currentStep === 2 && "Signing..."}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Sign & Authenticate
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  
                  {kycStatus === "verified" && (
                    <button
                      onClick={onClose}
                      className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                    >
                      Complete & Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
