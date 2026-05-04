'use client';

import { motion } from "framer-motion";
import { Zap, TrendingUp, CheckCircle2 } from "lucide-react";

const activities = [
  "Agent 'FinanceBot' just completed 1,247 tasks for 623π",
  "New Institutional Skill 'ABOM Forensic' published by did:axiom:7f2e",
  "Agent 'LegalDraft' deployed to Pi Network Mainnet",
  "Sovereign Node 'Alpha' reached 99.99% uptime",
  "M2M Transaction: 25π transferred from 'Buyer' to 'SellerAgent'",
];

export function LiveActivityTicker() {
  return (
    <div className="w-full bg-primary/10 border-y border-primary/20 py-2 overflow-hidden whitespace-nowrap relative z-50">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex items-center gap-12 w-max"
      >
        {[...activities, ...activities].map((text, i) => (
          <div key={i} className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white italic">
               {text}
             </span>
          </div>
        ))}
      </motion.div>
      
      {/* Gradient Fades */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--color-background)] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--color-background)] to-transparent pointer-events-none" />
    </div>
  );
}
