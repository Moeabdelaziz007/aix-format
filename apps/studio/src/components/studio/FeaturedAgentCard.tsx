"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/shared";
import { cn } from "@/lib/utils";

interface FeaturedAgentCardProps {
  name: string;
  role: string;
  rating: number;
  price: string;
  icon?: React.ReactNode;
  verified?: boolean;
}

export const FeaturedAgentCard = ({ 
  name, 
  role, 
  rating, 
  price, 
  icon = <Zap size={24} />, 
  verified = true 
}: FeaturedAgentCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-panel-heavy p-6 rounded-[2.5rem] border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-primary shadow-xl group-hover:text-white group-hover:border-primary/50 transition-all">
          {icon}
        </div>
        {verified && (
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck size={14} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">{role}</p>
      </div>

      <div className="flex items-center gap-4 py-2 border-y border-white/5">
        <div className="flex items-center gap-1.5">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-black text-white">{rating}</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{price}</span>
        </div>
      </div>

      <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
        View Agent
      </button>
    </motion.div>
  );
};
