"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, X, Loader2, Network } from "lucide-react";
import { useEffect, useState } from "react";

interface KycSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (authResult: any) => Promise<void>;
  isSigning: boolean;
  agentName: string;
}

export function KycSignatureModal({ isOpen, onClose, onSign, isSigning, agentName }: KycSignatureModalProps) {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    // Generate random nodes for the quantum topology background
    if (isOpen) {
      const newNodes = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setNodes(newNodes);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePiAuthentication = async () => {
    try {
      const nacl = require('tweetnacl');
      const naclUtil = require('tweetnacl-util');

      const keypair = nacl.sign.keyPair();
      const mockUid = `pi_user_${Date.now()}`;
      const mockAccessToken = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.mock_token_${Date.now()}`;

      const messageUint8 = naclUtil.decodeUTF8(mockAccessToken);
      const signatureUint8 = nacl.sign.detached(messageUint8, keypair.secretKey);

      const signature = naclUtil.encodeBase64(signatureUint8);
      const publicKey = naclUtil.encodeBase64(keypair.publicKey);

      const mockAuthResult = {
        user: { uid: mockUid },
        accessToken: mockAccessToken,
        signature: signature,
        publicKey: publicKey
      };

      await onSign(mockAuthResult);
    } catch (error) {
      console.error("Pi SDK Authentication failed:", error);
      alert("Pi Network authentication failed.");
    }
  };

  return (
    <AnimatePresence>
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
                  {/* Connect to next node to form topology */}
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

            <div className="relative p-8 md:p-12 z-10 flex flex-col md:flex-row gap-8 items-center">

              {/* Visual Side */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <div className="relative w-32 h-32 mb-6">
                    {isSigning ? (
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
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-surface-container-high)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Network className="w-12 h-12 text-[#d2bbff]" />
                        </div>
                      </>
                    )}
                 </div>

                 <h2 className="text-2xl font-display font-bold text-white mb-2">Agentic KYC Security</h2>
                 <p className="text-sm text-[#94a3b8] leading-relaxed max-w-xs">
                   Quantum Topology Architecture for immutable identity binding.
                 </p>
              </div>

              {/* Action Side */}
              <div className="flex-1 w-full flex flex-col justify-center">
                <button
                  onClick={onClose}
                  disabled={isSigning}
                  className="absolute top-4 right-4 text-[#94a3b8] hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-start gap-4 group hover:border-[#00dbe9]/50 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-[#00dbe9] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">AxiomID Cryptography</h4>
                      <p className="text-xs text-[#94a3b8]">Ed25519 signature binds your Pi Network identity to <span className="text-white">{agentName}</span>.</p>
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

                <button
                  onClick={handlePiAuthentication}
                  disabled={isSigning}
                  className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,219,233,0.3)] hover:shadow-[0_0_30px_rgba(0,219,233,0.5)] disabled:opacity-50 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />

                  <span className="relative flex items-center gap-2">
                    {isSigning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Quantum Signature...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sign & Deploy
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
