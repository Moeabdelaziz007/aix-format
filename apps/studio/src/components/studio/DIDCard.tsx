"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DIDCardProps {
  did: string;
  publicKey: string;
  kycTier: 0 | 1 | 2 | 3;
  verified: boolean;
  username?: string;
  className?: string;
}

export function DIDCard({ did, publicKey, kycTier, verified, username, className }: DIDCardProps) {
  const [copiedDid, setCopiedDid] = React.useState(false);
  const [copiedPk, setCopiedPk] = React.useState(false);

  const handleCopy = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (str: string, first: number, last: number) => {
    if (str.length <= first + last) return str;
    return `${str.slice(0, first)}...${str.slice(-last)}`;
  };

  const getTierDetails = (tier: number) => {
    switch (tier) {
      case 1:
        return { label: "Basic KYC", classes: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20" };
      case 2:
        return { label: "Standard KYC", classes: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20" };
      case 3:
        return { label: "Sovereign ★", classes: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20" };
      case 0:
      default:
        return { label: "Unverified", classes: "bg-white/5 text-[var(--color-on-surface-faint)] border-white/10" };
    }
  };

  const tierDetails = getTierDetails(kycTier);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card relative overflow-hidden p-6 ",
        className
      )}
    >

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
              <Shield className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold tracking-tight">{username || "Anonymous Sovereign"}</h3>
                {verified && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />}
              </div>
              <p className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest">Master Identity</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-sm border", tierDetails.classes)}>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tierDetails.label}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Axiom Identifier (DID)</label>
            <div className="flex items-center gap-2 group">
              <div className="flex-1 border border-white/[0.05] rounded-sm px-3 py-2.5 font-mono text-[11px] text-[var(--color-purple-mcp)] truncate transition-colors group-hover:border-white/10">
                {truncate(did, 20, 8)}
              </div>
              <button 
                onClick={() => handleCopy(did, setCopiedDid)}
                className="p-2.5 rounded-sm border border-white/[0.05] text-[var(--color-on-surface-faint)] hover:text-white transition-all active:scale-95"
                title="Copy DID"
              >
                {copiedDid ? <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Public Key</label>
            <div className="flex items-center gap-2 group">
              <div className="flex-1 border border-white/[0.05] rounded-sm px-3 py-2.5 font-mono text-[11px] text-[var(--color-purple-mcp)] truncate transition-colors group-hover:border-white/10">
                {truncate(publicKey, 12, 6)}
              </div>
              <button
                onClick={() => handleCopy(publicKey, setCopiedPk)}
                className="p-2.5 rounded-sm border border-white/[0.05] text-[var(--color-on-surface-faint)] hover:text-white transition-all active:scale-95"
                title="Copy Public Key"
              >
                {copiedPk ? <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
