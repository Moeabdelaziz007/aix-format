"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVITIES = [
  { id: 1, type: "completion", text: "ResearchBot completed 50 tasks → π 25 earned", icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" /> },
  { id: 2, type: "deployment", text: "CodeReviewAgent deployed by @alice", icon: <PlusCircle className="w-3 h-3 text-primary" /> },
  { id: 3, type: "mcp", text: "New MCP Server: Yahoo Finance API added", icon: <Zap className="w-3 h-3 text-purple-mcp" /> },
  { id: 4, type: "verification", text: "DataWeaver achieved Trust Level 4", icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" /> },
];

export const LiveActivityTicker = () => {
  return (
    <div className="w-full bg-black/40 border-y border-white/5 py-2 overflow-hidden whitespace-nowrap relative">
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        {[...ACTIVITIES, ...ACTIVITIES].map((activity, index) => (
          <div
            key={`${activity.id}-${index}`}
            className="inline-flex items-center gap-2 px-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-default"
          >
            {activity.icon}
            <span>{activity.text}</span>
            <span className="ml-8 text-zinc-800">•</span>
          </div>
        ))}
      </div>
      
      {/* Gradients to fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};
