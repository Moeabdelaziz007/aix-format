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
  const genesisHash = (agent as any).genesis_hash || agent.id.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden h-screen">

      {/* ── Top bar (Sticky 56px) ── */}
      <header className="h-14 border-b border-white/5 flex items-center px-4 gap-4 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-40 shrink-0">
        <Link
          href="/my-agents"
          className="flex items-center gap-1.5 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Agents</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-white/10 shrink-0" />

        <div className="flex items-center gap-2.5 min-w-0">
          <AgentPet pet={agent.pet} size="sm" />
          <div className="leading-none truncate">
            <p className="text-sm font-black text-white tracking-tight truncate">{agent.name}</p>
            <p className="text-[10px] text-white/30 font-medium truncate">{agent.role}</p>
          </div>
        </div>

        {/* DNA badge (Genesis Hash) */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 shrink-0">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            DNA · <span className="text-blue-400/80">{genesisHash}</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 shrink-0">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {agent.status ?? "online"}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Sidebar (220px, hidden on mobile) ── */}
        <aside className="hidden md:flex w-[220px] border-r border-white/5 bg-[#0d0d14]/60 flex-col py-4 gap-1 px-2 shrink-0">
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
                    layoutId="workspace-active-indicator"
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
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">SIGNATURE</p>
            <p className="text-[9px] font-mono text-white/15 break-all leading-relaxed">
              {agent.did || `did:axiom:${agent.id.slice(0, 16)}...`}
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Mobile Bottom Navigation (Visible only < 768px) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0d0d14]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
          {NAV.map((item) => {
            const active = activeTab === item.href;
            return (
              <Link
                key={item.href}
                href={`/workspace/${agentId}/${item.href}`}
                className="flex flex-col items-center gap-1 relative"
              >
                {active && (
                  <motion.div
                    layoutId="workspace-active-indicator-mobile"
                    className="absolute -top-3 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <item.icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: active ? item.color : "rgba(255,255,255,0.3)" }}
                />
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-tighter transition-colors",
                  active ? "text-white" : "text-white/30"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

