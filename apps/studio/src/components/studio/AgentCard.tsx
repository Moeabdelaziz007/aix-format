"use client";

import { motion } from "framer-motion";
import { Shield, BrainCircuit, Activity } from "lucide-react";

interface AgentCardProps {
  name: string;
  role: string;
  price: string;
  status: "online" | "offline";
  color: string;
}

export function AgentCard({ name, role, price, status, color }: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative rounded-2xl glass-panel overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:border-[var(--color-primary)]/30"
    >
      {/* Subtle background glow based on agent color */}
      <div
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-20 blur-[60px] transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />

      <div className="p-6 relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
          >
            <BrainCircuit className="w-7 h-7" style={{ color }} />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(12,19,36,0.6)] border border-[var(--color-glass-border)]">
            <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-[#00e3fd] animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-white">
              {status}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-display font-semibold text-white mb-1">{name}</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)]">{role}</p>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--color-glass-border)] flex items-center justify-between mt-auto">
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">Cost Per Task</p>
            <p className="text-lg font-semibold text-white flex items-center gap-1">
              <span style={{ color }}>π</span> {price}
            </p>
          </div>

          <button className="px-5 py-2.5 rounded-xl bg-[var(--color-surface-container-high)] text-white text-sm font-medium border border-[var(--color-glass-border)] hover:bg-[var(--color-surface-container-highest)] hover:border-[var(--color-primary)]/50 transition-all">
            Hire Agent
          </button>
        </div>

        {/* KYC Badge Overlay - Only visible on hover for clean UI */}
        <div className="absolute top-0 left-0 w-full p-2 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300">
          <div className="mx-auto w-fit flex items-center gap-1.5 bg-[var(--color-secondary)]/10 backdrop-blur-md border border-[var(--color-secondary)]/20 px-3 py-1 rounded-full">
            <Shield className="w-3 h-3 text-[var(--color-secondary)]" />
            <span className="text-[10px] font-medium text-[var(--color-secondary)]">AxiomID Verified</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
