'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Search, Rocket, ShieldCheck, Star, Users, Briefcase } from "lucide-react";
import { Badge } from "@/components/shared";

const VoiceOrb = dynamic(
  () => import("@/design-system/agentic-components").then(mod => mod.VoiceOrb),
  { ssr: false, loading: () => <div className="w-64 h-64 animate-pulse bg-white/5 rounded-none" /> }
);

export function HeroSection() {
  const promptSuggestions = [
    "Build a legal researcher",
    "Analyze DeFi protocols",
    "Deploy a KYC-verified bot"
  ];

  return (
    <div className="flex flex-col gap-16 py-12">
      {/* Dual Messaging Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Consumer Portal */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="group glass-panel-heavy p-8 rounded-sm border-white/5  hover: transition-all flex flex-col gap-6 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Search size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">I want to Hire</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Discover 1,314+ KYC-verified agents ready to automate your professional workflows.</p>
          </div>
          <Link href="/marketplace" className="mt-4 flex items-center justify-between group-hover:text-primary transition-colors">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Explore Marketplace</span>
            <div className="w-10 h-10 rounded-none border border-white/10 flex items-center justify-center group-hover:border-primary/40">
              <Star size={16} />
            </div>
          </Link>
        </motion.div>

        {/* Producer Portal */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="group glass-panel-heavy p-8 rounded-sm border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.04] transition-all flex flex-col gap-6 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary text-black flex items-center justify-center [0_0_20px_rgba(57,255,20,0.3)]">
            <Rocket size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">I want to Build</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Join 4,200+ developers architecting the future of sovereign intelligence on Pi Network.</p>
          </div>
          <Link href="/builder" className="mt-4 flex items-center justify-between group-hover:text-primary transition-colors">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Launch AIX Studio</span>
            <div className="w-10 h-10 rounded-none border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
              <ShieldCheck size={16} />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Voice Orb with Suggestions */}
      <div className="flex flex-col items-center gap-12 relative py-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-center space-y-2">
           <Badge variant="outline" className="text-[10px] font-black tracking-widest border-primary/20 text-primary uppercase">Voice-First Orchestration</Badge>
           <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Speak your agent into existence</h3>
        </div>

        <div className="relative group">
           {/* Prompt Suggestions */}
           <div className="absolute inset-0 pointer-events-none">
              {promptSuggestions.map((text, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.4, 0.8, 0.4]
                  }}
                  transition={{ 
                    duration: 4, 
                    delay: i * 1.2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "absolute whitespace-nowrap px-4 py-2 rounded-full border border-white/5   text-[9px] font-black text-zinc-400 uppercase tracking-widest",
                    i === 0 ? "-top-12 -left-32" : i === 1 ? "top-12 -right-40" : "-bottom-12 -left-12"
                  )}
                >
                   {text}
                </motion.div>
              ))}
           </div>
           
           <div className="w-64 h-64 cursor-pointer hover:scale-105 transition-transform">
             <VoiceOrb />
           </div>
        </div>
      </div>

      {/* Social Proof & Trusted By */}
      <div className="pt-8 border-t border-white/5">
        <div className="flex flex-col items-center gap-8">
           <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Institutional Verification Powered By</div>
           <div className="flex flex-wrap items-center justify-center gap-12 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              {/* Mock Logo Icons representing Pi, Axiom, etc. */}
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded bg-white" />
                 <span className="font-black text-white tracking-tighter text-xl">Pi Network</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-none border-2 border-white flex items-center justify-center font-black text-[10px]">ID</div>
                 <span className="font-black text-white tracking-tighter text-xl uppercase">AxiomID</span>
              </div>
              <div className="flex items-center gap-3">
                 <ShieldCheck size={28} className="text-white" />
                 <span className="font-black text-white tracking-tighter text-xl">SLSA v1.0</span>
              </div>
              <div className="flex items-center gap-3">
                 <Briefcase size={28} className="text-white" />
                 <span className="font-black text-white tracking-tighter text-xl">Coinbase M2M</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
