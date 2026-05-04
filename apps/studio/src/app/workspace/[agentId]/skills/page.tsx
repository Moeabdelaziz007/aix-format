"use client";

import { useParams } from "next/navigation";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { motion } from "framer-motion";
import {
  Zap, Lock, CheckCircle2, ChevronRight,
  Globe, Code2, Search, MessageSquare, Database, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Skill definitions ──────────────────────────────────────────────────────
const SKILL_TREE = [
  {
    category: "Core",
    color: "#3b82f6",
    skills: [
      { id: "web_search",    label: "Web Search",      icon: Search,       unlocked: true,  level: 3 },
      { id: "code_exec",     label: "Code Execution",  icon: Code2,        unlocked: true,  level: 2 },
      { id: "memory_read",   label: "Memory Read",     icon: Database,     unlocked: true,  level: 5 },
    ],
  },
  {
    category: "Communication",
    color: "#10b981",
    skills: [
      { id: "telegram",      label: "Telegram Bot",    icon: MessageSquare, unlocked: true,  level: 1 },
      { id: "webhook",       label: "Webhooks",        icon: Globe,         unlocked: false, level: 0 },
    ],
  },
  {
    category: "Security",
    color: "#8b5cf6",
    skills: [
      { id: "kyc_verify",    label: "KYC Verify",      icon: Shield,        unlocked: true,  level: 4 },
      { id: "sign_payload",  label: "Sign Payload",    icon: Lock,          unlocked: false, level: 0 },
    ],
  },
];

function SkillBar({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 w-4 rounded-full transition-all"
          style={{
            backgroundColor: i < level ? color : "rgba(255,255,255,0.06)",
            boxShadow: i < level ? `0 0 4px ${color}60` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function SkillsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgent } = useLocalAgents();
  const agent = getAgent(agentId);

  // Merge manifest capabilities with skill tree
  const manifestCaps: string[] = agent?.manifest?.abom?.capabilities ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-6 space-y-6"
    >
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Skill Tree</h2>
        <p className="text-sm text-white/30 mt-0.5">
          Modular capabilities — unlock new skills to expand agent power
        </p>
      </div>

      {/* Manifest capabilities */}
      {manifestCaps.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
            From AIX Manifest
          </p>
          <div className="flex flex-wrap gap-2">
            {manifestCaps.map((cap) => (
              <span
                key={cap}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300"
              >
                <CheckCircle2 className="w-3 h-3" />
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill tree */}
      <div className="space-y-6">
        {SKILL_TREE.map((cat, ci) => (
          <motion.div
            key={cat.category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-white/5" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] px-3"
                style={{ color: cat.color }}
              >
                {cat.category}
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.skills.map((skill, si) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: ci * 0.08 + si * 0.05 }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all group",
                    skill.unlocked
                      ? "bg-white/[0.03] border-white/8 hover:border-white/15"
                      : "bg-white/[0.01] border-white/5 opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: skill.unlocked ? `${cat.color}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${skill.unlocked ? cat.color + "30" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <skill.icon
                        className="w-4 h-4"
                        style={{ color: skill.unlocked ? cat.color : "rgba(255,255,255,0.2)" }}
                      />
                    </div>

                    {skill.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-white/20" />
                    )}
                  </div>

                  <p className={cn(
                    "text-sm font-bold mb-2",
                    skill.unlocked ? "text-white" : "text-white/30"
                  )}>
                    {skill.label}
                  </p>

                  <SkillBar level={skill.level} color={cat.color} />

                  {skill.unlocked && (
                    <button className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: cat.color }}>
                      Configure <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
