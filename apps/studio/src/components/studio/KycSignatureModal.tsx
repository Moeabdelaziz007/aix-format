"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, X, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

interface AuthResult {
  uid: string;
  accessToken: string;
  cryptoPublicKey: string;
  cryptoSignature: string;
}

interface KycSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (authResult: AuthResult) => Promise<void>;
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

      const messageToSign = `AxiomID:KycSign:${mockUid}:${agentName}`;
      const messageUint8 = naclUtil.decodeUTF8(messageToSign);
      const signature = nacl.sign.detached(messageUint8, keypair.secretKey);

      const authResult: AuthResult = {
        uid: mockUid,
        accessToken: mockAccessToken,
        cryptoPublicKey: naclUtil.encodeBase64(keypair.publicKey),
        cryptoSignature: naclUtil.encodeBase64(signature)
      };

      await onSign(authResult);
    } catch (error) {
      console.error("KYC Authentication Failed", error);
      alert("Failed to authenticate with Pi Network");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#05050A]/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
          {/* Quantum Topology Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {nodes.map((n1, i) =>
                nodes.slice(i + 1).map((n2, j) => {
                  const dist = Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
                  if (dist < 40) {
                    return (
                      <line
                        key={`line-${i}-${j}`}
                        x1={`${n1.x}%`}
                        y1={`${n1.y}%`}
                        x2={`${n2.x}%`}
                        y2={`${n2.y}%`}
                        stroke="url(#line-grad)"
                        strokeWidth="1"
                        opacity={1 - dist / 40}
                      />
                    );
                  }
                  return null;
                })
              )}
              {nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="2"
                  fill="var(--color-primary)"
                  className="animate-pulse"
                />
              ))}
            </svg>
          </div>

          <div className="relative p-8 flex flex-col items-center text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[var(--color-surface-container)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 mb-6 relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border border-indigo-400/30">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Agentic KYC Signature</h2>
            <p className="text-gray-400 mb-8 max-w-sm">
              You are about to sign the DNA payload for <span className="text-white font-medium">&quot;{agentName}&quot;</span> using your sovereign Pi Network identity.
            </p>

            <div className="w-full space-y-4 mb-8 text-left">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(20,20,30,0.5)] border border-[var(--color-border)]">
                <Network className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Sovereign Deployment</span>
                  <span className="text-xs text-gray-400">Agent will be deployed to the Pi M2M network.</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(20,20,30,0.5)] border border-[var(--color-border)]">
                <Lock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Cryptographic Proof</span>
                  <span className="text-xs text-gray-400">Your Pi UID will cryptographically own this AI.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePiAuthentication}
              disabled={isSigning}
              className={cn(
                "w-full relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300",
                isSigning ? "opacity-80 cursor-not-allowed" : "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              )}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 animate-gradient-x" />
              <div className="relative flex items-center justify-center gap-3 bg-[#0c0c14] px-8 py-4 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                {isSigning ? (
                  <>
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-white font-medium text-lg">Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-6 h-6 text-white" />
                    <span className="text-white font-medium text-lg group-hover:text-white">Authenticate with Pi</span>
                  </>
                )}
              </div>
            </button>
            <p className="mt-4 text-xs text-gray-500">Secured by AxiomID Protocol & Pi Network</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
