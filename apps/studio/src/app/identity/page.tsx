"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Fingerprint, 
  ShieldCheck, 
  Key, 
  History, 
  Cpu, 
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Lock
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { DIDCard } from "@/components/studio/DIDCard";
import { cn } from "@/lib/utils";

const IDENTITY_FEATURES = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Zero-Knowledge Proofs",
    description: "Verify your identity without revealing sensitive underlying data.",
    status: "Active"
  },
  {
    icon: <Key className="w-5 h-5" />,
    title: "Key Management",
    description: "Securely rotate and manage your cryptographic signing keys.",
    status: "Locked"
  },
  {
    icon: <History className="w-5 h-5" />,
    title: "Audit Trail",
    description: "Immutable history of all identity claims and authorizations.",
    status: "Active"
  }
];

export default function IdentityPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e8] font-body selection:bg-[#00dbe9]/30 overflow-x-hidden">
      <Navbar />
      <SovereignStatusBar />

      <main className="max-w-[1400px] mx-auto px-6 py-12 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00dbe9]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#d2bbff]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          {/* Left Side: Hero & DID Card */}
          <section className="flex-1 space-y-10">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00dbe9]/10 border border-[#00dbe9]/20 text-[#00dbe9] text-[10px] font-bold uppercase tracking-widest"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Sovereign Identity Layer
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight leading-tight"
              >
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00dbe9] to-[#d2bbff]">AxiomID</span> Control Plane
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-[#8888a0] max-w-xl"
              >
                Manage your Decentralized Identifier (DID), manage cryptographic keys, and authorize AI agents to act on your behalf across the Sovereign Network.
              </motion.p>
            </div>

            <DIDCard 
              did="did:axiom:axiomid.app:user-3829-f921-bc01"
              name="Cryptojoker Sovereign"
              type="Master Identity"
              className="max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#00dbe9] hover:bg-[#00c5d2] text-black font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(0,219,233,0.2)]">
                Manage Keys
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all">
                Export Identity
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Right Side: Features & Stats */}
          <section className="w-full lg:w-[450px] space-y-6">
            <div className="glass-panel rounded-2xl p-6 border-white/[0.08] space-y-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#d2bbff]" />
                Identity Security
              </h3>
              
              <div className="space-y-4">
                {IDENTITY_FEATURES.map((feature, idx) => (
                  <div key={idx} className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-white/5 text-[#8888a0] group-hover:text-white transition-colors">
                        {feature.icon}
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        feature.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-[#404050]"
                      )}>
                        {feature.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{feature.title}</h4>
                    <p className="text-xs text-[#8888a0] leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Security Notice</p>
                  <p className="text-[11px] text-amber-200/60 leading-relaxed">
                    Your master key is stored in your secure enclave. Never share your seed phrase with anyone.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border-white/[0.08]">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-[#404050] uppercase tracking-widest mb-1">Network Presence</p>
                  <h4 className="text-2xl font-display font-bold text-white">82% Verified</h4>
                </div>
                <div className="w-24 h-12 flex items-end gap-1">
                  {[40, 65, 45, 80, 95, 70, 82].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#00dbe9]/20 rounded-t-sm" style={{ height: `${h}%` }}>
                      <div className="w-full bg-[#00dbe9] rounded-t-sm transition-all duration-1000" style={{ height: i === 6 ? '100%' : '30%' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .glass-panel {
          background: rgba(20, 20, 25, 0.6);
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
