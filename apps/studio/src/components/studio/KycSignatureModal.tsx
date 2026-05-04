"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, X, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
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

// ─── Stable backdrop: rendered once, never re-mounts ─────────────────────────
// backdrop-blur is GPU-composited — isolate it so it never causes layout
const Backdrop = memo(function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // will-change tells browser to promote to its own GPU layer
      style={{ willChange: "opacity" }}
      className="absolute inset-0 bg-[#05050A]/80"
      // backdrop-blur moved to a pseudo-element via CSS to avoid layout reflow
      aria-hidden
      onClick={onClose}
    />
  );
});

// ─── Static quantum topology — memoised, never regenerates ───────────────────
const NODES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

const QuantumTopology = memo(function QuantumTopology() {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#888888" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {NODES.map((n1, i) =>
          NODES.slice(i + 1).map((n2, j) => {
            const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
            if (dist >= 40) return null;
            return (
              <line
                key={`l-${i}-${j}`}
                x1={`${n1.x}%`} y1={`${n1.y}%`}
                x2={`${n2.x}%`} y2={`${n2.y}%`}
                stroke="url(#line-grad)"
                strokeWidth="1"
                opacity={1 - dist / 40}
              />
            );
          })
        )}
        {NODES.map((node) => (
          <circle
            key={`n-${node.id}`}
            cx={`${node.x}%`} cy={`${node.y}%`}
            r="2"
            fill="#ffffff"
          />
        ))}
      </svg>
    </div>
  );
});

// ─── Main modal ───────────────────────────────────────────────────────────────
export const KycSignatureModal = memo(function KycSignatureModal({
  isOpen,
  onClose,
  onSign,
  isSigning,
  agentName,
}: KycSignatureModalProps) {
  // Keep ref to latest onSign so the callback is always fresh without
  // re-creating handlePiAuthentication (avoids button re-renders)
  const onSignRef = useRef(onSign);
  useEffect(() => { onSignRef.current = onSign; }, [onSign]);

  const handlePiAuthentication = useCallback(async () => {
    try {
      const keypair = nacl.sign.keyPair();
      const mockUid = `pi_user_${Date.now()}`;
      const mockAccessToken = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.mock_${Date.now()}`;
      const msg = naclUtil.decodeUTF8(`AxiomID:KycSign:${mockUid}:${agentName}`);
      const sig = nacl.sign.detached(msg, keypair.secretKey);

      await onSignRef.current({
        uid: mockUid,
        accessToken: mockAccessToken,
        cryptoPublicKey: naclUtil.encodeBase64(keypair.publicKey),
        cryptoSignature: naclUtil.encodeBase64(sig),
      });
    } catch (err) {
      console.error("KYC Authentication Failed", err);
      alert("Failed to authenticate with Pi Network");
    }
  }, [agentName]); // agentName is the only true dep

  return (
    <AnimatePresence>
      {isOpen && (
        // FIX: moved backdrop-blur here as a CSS class so it's GPU-composited
        // instead of triggering layout on every re-render
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agentic KYC Signature"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-blur-backdrop"
        >
          <Backdrop onClose={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] "
          >
            <QuantumTopology />

            <div className="relative p-8 flex flex-col items-center text-center">
              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[var(--color-surface-container)]"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 bg-white/10 rounded-full " />
                <div className="absolute inset-0 bg-black rounded-full flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Agentic KYC Signature</h2>
              <p className="text-gray-400 mb-8 max-w-sm">
                Sign the DNA payload for{" "}
                <span className="text-white font-medium">&quot;{agentName}&quot;</span>{" "}
                using your sovereign Pi Network identity.
              </p>

              {/* Info rows */}
              <div className="w-full space-y-4 mb-8 text-left">
                {([
                  { icon: Network, color: "text-white", title: "Sovereign Deployment", desc: "Agent will be deployed to the Pi M2M network." },
                  { icon: Lock,    color: "text-white", title: "Cryptographic Proof",  desc: "Your Pi UID will cryptographically own this AI." },
                ] as const).map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-center gap-3 p-4 rounded-none bg-white/5 border border-[var(--color-border)]">
                    <Icon className={cn("w-5 h-5 flex-shrink-0", color)} />
                    <div>
                      <span className="text-sm font-medium text-white block">{title}</span>
                      <span className="text-xs text-gray-400">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA — disabled state is explicit, no hover jank when isSigning */}
              <button
                onClick={handlePiAuthentication}
                disabled={isSigning}
                aria-busy={isSigning}
                className={cn(
                  "w-full relative group overflow-hidden rounded-none p-[1px] transition-all duration-300",
                  isSigning
                    ? "opacity-70 cursor-not-allowed pointer-events-none"
                    : "hover:[0_0_30px_rgba(99,102,241,0.4)]"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white via-gray-400 to-white rounded-none opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3 bg-black px-8 py-4 rounded-none group-hover:bg-opacity-0 transition-colors">
                  {isSigning ? (
                    <>
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                      <span className="text-white font-medium text-lg">Verifying Identity…</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-6 h-6 text-white" />
                      <span className="text-white font-medium text-lg">Authenticate with Pi</span>
                    </>
                  )}
                </div>
              </button>

              <p className="mt-4 text-xs text-gray-500">Secured by AxiomID Protocol & Pi Network</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
