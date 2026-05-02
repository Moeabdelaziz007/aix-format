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
        return { label: "Basic KYC", classes: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20" };
      case 2:
        return { label: "Standard KYC", classes: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20" };
      case 3:
        return { label: "Sovereign ★", classes: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" };
      case 0:
      default:
        return { label: "Unverified", classes: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
    }
  };

  const tierDetails = getTierDetails(kycTier);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c101c]/60  p-6 ",
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00dbe9]/5 blur-[60px] rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#d2bbff]/5 blur-[50px] rounded-full -ml-12 -mb-12" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00dbe9]/10 border border-[#00dbe9]/20 [0_0_15px_rgba(0,219,233,0.1)]">
              <Shield className="w-5 h-5 text-[#00dbe9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold tracking-tight">{username || "Anonymous Sovereign"}</h3>
                {verified && <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />}
              </div>
              <p className="text-[10px] text-[#00dbe9] font-bold uppercase tracking-widest">Master Identity</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border", tierDetails.classes)}>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tierDetails.label}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider">Axiom Identifier (DID)</label>
            <div className="flex items-center gap-2 group">
              <div className="flex-1  border border-white/[0.05] rounded-lg px-3 py-2.5 font-mono text-[11px] text-[#d2bbff] truncate transition-colors group-hover:border-white/10">
                {truncate(did, 20, 8)}
              </div>
              <button 
                onClick={() => handleCopy(did, setCopiedDid)}
                className="p-2.5 rounded-lg  border border-white/[0.05] hover: hover:border-white/20 text-[#8888a0] hover:text-white transition-all active:scale-95"
                title="Copy DID"
              >
                {copiedDid ? <CheckCircle2 className="w-4 h-4 text-[#00dbe9]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#8888a0] uppercase tracking-wider">Public Key</label>
            <div className="flex items-center gap-2 group">
              <div className="flex-1  border border-white/[0.05] rounded-lg px-3 py-2.5 font-mono text-[11px] text-[#d2bbff] truncate transition-colors group-hover:border-white/10">
                {truncate(publicKey, 12, 6)}
              </div>
              <button
                onClick={() => handleCopy(publicKey, setCopiedPk)}
                className="p-2.5 rounded-lg  border border-white/[0.05] hover: hover:border-white/20 text-[#8888a0] hover:text-white transition-all active:scale-95"
                title="Copy Public Key"
              >
                {copiedPk ? <CheckCircle2 className="w-4 h-4 text-[#00dbe9]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
