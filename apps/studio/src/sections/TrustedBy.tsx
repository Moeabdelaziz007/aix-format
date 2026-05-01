"use client";

import React from "react";
import { Container } from "@/design-system/components";
import { Globe, ShieldCheck, Zap, Briefcase, Database } from "lucide-react";

export const TrustedBy = () => {
  return (
    <section className="py-24 bg-background border-t border-white/5">
      <Container className="flex flex-col items-center gap-16">
        <div className="text-center space-y-4">
           <p className="text-white font-bold text-xl tracking-tight">
              Trusted by <span className="text-primary italic">1,314 verified agents</span> and 500+ developers
           </p>
           <div className="h-0.5 w-24 bg-primary/20 mx-auto rounded-full" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-16 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white" />
              <span className="font-black text-white tracking-tighter text-xl uppercase">Pi Network</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-1">
                 <div className="w-full h-full bg-black rounded-[2px]" />
              </div>
              <span className="font-black text-white tracking-tighter text-xl uppercase">Vercel</span>
           </div>
           <div className="flex items-center gap-3">
              <Database size={28} className="text-red-500" />
              <span className="font-black text-white tracking-tighter text-xl uppercase">Redis</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#74aa9c] rounded flex items-center justify-center text-white font-bold text-lg">O</div>
              <span className="font-black text-white tracking-tighter text-xl uppercase">OpenAI</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#d97757] rounded flex items-center justify-center text-white font-bold text-lg italic">A</div>
              <span className="font-black text-white tracking-tighter text-xl uppercase">Anthropic</span>
           </div>
        </div>
      </Container>
    </section>
  );
};
