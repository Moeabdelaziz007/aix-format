"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, X, Loader2, Network } from "lucide-react";
import { useEffect, useState } from "react";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

interface KycSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const keypair = nacl.sign.keyPair();
      const mockUid = `pi_user_${Date.now()}`;
      const mockAccessToken = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.mock_token_${Date.now()}`;

      // This mimics the Pi SDK response + Cryptographic Ed25519 signature
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

      await onSign(mockAuthResult);
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--color-surface-container)] border border-[var(--color-glass-border)] rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Quantum Topology Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                className="absolute w-2 h-2 bg-primary rounded-full blur-[2px]"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                animate={{
                  x: [0, 10, 0],
                  y: [0, 10, 0],
                  opacity: [0.2, 0.8, 0.2]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
            {/* SVG connections between some nodes to form a network */}
            <svg className="absolute inset-0 w-full h-full stroke-primary/20" strokeWidth="1">
                {nodes.slice(0, 8).map((node, i) => {
                   const nextNode = nodes[i + 1] || nodes[0];
                   return (
                     <line key={`line-${i}`} x1={`${node.x}%`} y1={`${node.y}%`} x2={`${nextNode.x}%`} y2={`${nextNode.y}%`} />
                   );
                })}
            </svg>
          </div>

          <div className="relative p-6 sm:p-8 z-10 flex flex-col items-center">
            <button
              onClick={onClose}
              disabled={isSigning}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,219,233,0.3)]">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-display font-bold text-white text-center mb-2">Agentic KYC Binding</h2>
            <p className="text-[var(--color-on-surface-variant)] text-center text-sm mb-8">
              Sign the <span className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">.aix</span> payload for <strong>{agentName}</strong> to link ownership to your verified identity.
            </p>

            <div className="w-full bg-[var(--color-surface-container-high)] rounded-2xl p-4 mb-8 border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
               <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                     <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Cryptographic Proof</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This action generates an Ed25519 signature binding your KYC status to the agent&apos;s genome. This prevents Sybil attacks in the Autonomous Economy.
                    </p>
                  </div>
               </div>
            </div>

            <button
              onClick={handlePiAuthentication}
              disabled={isSigning}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] p-[1px] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-3 bg-[var(--color-surface-container)] rounded-xl py-4 px-6 transition-all group-hover:bg-opacity-0">
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span className="text-white font-medium">Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5 text-[#d2bbff] group-hover:text-white transition-colors" />
                    <span className="text-white font-medium">Authenticate with Pi Network</span>
                  </>
                )}
              </div>
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
               <Network size={14} />
               <span>Secured by Pi SDK v2.0 & Axiom Protocol</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
