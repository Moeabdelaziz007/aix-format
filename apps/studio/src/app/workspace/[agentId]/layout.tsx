"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BrainCircuit, Zap, Rocket, ArrowLeft,
  Cpu, Shield, ChevronRight, Sparkles
} from "lucide-react";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { AgentPet } from "@/components/shared/AgentPet";
import { AgentRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Sidebar nav items ──────────────────────────────────────────────────────
const NAV = [
  { href: "pulse",     icon: Activity,     label: "Pulse",     color: "#10b981", desc: "Live event stream"  },
  { href: "wikibrain", icon: BrainCircuit, label: "WikiBrain", color: "#8b5cf6", desc: "Memory graph"       },
  { href: "skills",    icon: Zap,          label: "Skills",    color: "#f59e0b", desc: "Skill tree"         },
  { href: "pet",       icon: Sparkles,     label: "Pet",       color: "#ec4899", desc: "Agent persona"      },
  { href: "deploy",    icon: Rocket,       label: "Deploy",    color: "#3b82f6", desc: "One-click deploy"   },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { agentId } = useParams<{ agentId: string }>();
  const pathname    = usePathname();
  const router      = useRouter();
  const { getAgent, loaded } = useLocalAgents();
  const [agent, setAgent]    = useState<AgentRecord | null>(null);

  useEffect(() => {
    if (loaded) {
      const found = getAgent(agentId);
      if (!found) router.replace("/my-agents");
      else setAgent(found);
    }
  }, [loaded, agentId, getAgent, router]);

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeTab = NAV.find(n => pathname.endsWith(n.href))?.href ?? "pulse";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* ── Top bar ── */}
      <header className="h-14 border-b border-white/5 flex items-center px-4 gap-4 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-40">
        <Link
          href="/my-agents"
          className="flex items-center gap-1.5 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Agents
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-white/10" />

        <div className="flex items-center gap-2.5">
          <AgentPet pet={agent.pet} size="sm" />
          <div className="leading-none">
            <p className="text-sm font-black text-white tracking-tight">{agent.name}</p>
            <p className="text-[10px] text-white/30 font-medium">{agent.role}</p>
          </div>
        </div>

        {/* DNA badge */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            AXIOM DNA · {agent.kyc_tier ?? "unverified"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {agent.status ?? "online"}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-56 border-r border-white/5 bg-[#0d0d14]/60 flex flex-col py-4 gap-1 px-2 shrink-0">
          {NAV.map((item) => {
            const active = activeTab === item.href;
            return (
              <Link
                key={item.href}
                href={`/workspace/${agentId}/${item.href}`}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                  active
                    ? "bg-white/5 border border-white/8"
                    : "hover:bg-white/[0.03] border border-transparent"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="ws-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: active ? `${item.color}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? item.color + "30" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <item.icon
                    className="w-3.5 h-3.5 transition-colors"
                    style={{ color: active ? item.color : "rgba(255,255,255,0.3)" }}
                  />
                </div>

                <div className="min-w-0">
                  <p className={cn(
                    "text-xs font-bold transition-colors leading-none",
                    active ? "text-white" : "text-white/40 group-hover:text-white/70"
                  )}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5 truncate">{item.desc}</p>
                </div>
              </Link>
            );
          })}

          {/* DNA signature at bottom */}
          <div className="mt-auto px-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 mx-1">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">AXIOM DNA</p>
            <p className="text-[9px] font-mono text-white/15 break-all leading-relaxed">
              {agent.did
                ? agent.did.slice(0, 32) + "…"
                : "did:axiom:" + agent.id.slice(0, 20) + "…"}
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
