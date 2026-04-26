"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, X } from "lucide-react";

interface KycSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => void;
  agentName: string;
}

export function KycSignatureModal({ isOpen, onClose, onSign, agentName }: KycSignatureModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(7,13,31,0.8)] backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel-heavy p-1"
        >
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-transparent to-[var(--color-secondary)] opacity-20" />

          <div className="relative bg-[var(--color-surface-container)] rounded-xl p-8 h-full">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--color-on-surface-variant)] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)] border-dashed animate-[spin_10s_linear_infinite]" />
                <Fingerprint className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-2xl font-display font-semibold text-white mb-2">Cryptographic KYC Signature</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                You are about to bind your verified Pi Network Identity to this AIX payload. This creates a Sovereign Proof of Ownership.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-glass-border)] flex items-start gap-4">
                <ShieldCheck className="w-5 h-5 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-white">Identity Assertion</h4>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    Your Pi KYC status acts as an Oracle. It guarantees to the network that this agent ({agentName}) is owned by a verified human, preventing Sybil attacks.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-glass-border)] flex items-start gap-4">
                <Lock className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-white">Immutable Binding</h4>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    Once signed, the AIX file will include a digital signature block verifiable via the AxiomID protocol.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onSign}
              className="w-full py-4 rounded-xl bg-gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,219,233,0.2)]"
            >
              <Fingerprint className="w-5 h-5" />
              Sign & Deploy to Pi Network
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
