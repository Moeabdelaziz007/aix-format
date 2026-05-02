"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, AlertCircle, CheckCircle2, Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface PulseEvent {
  id:        string;
  type:      "task" | "error" | "success" | "info" | "deploy";
  message:   string;
  timestamp: string;
  meta?:     Record<string, string>;
}

const TYPE_CONFIG = {
  task:    { icon: Zap,          color: "#f59e0b", bg: "bg-amber-500/10",   border: "border-amber-500/20"  },
  error:   { icon: AlertCircle,  color: "#ef4444", bg: "bg-red-500/10",     border: "border-red-500/20"    },
  success: { icon: CheckCircle2, color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20"},
  info:    { icon: Activity,     color: "#3b82f6", bg: "bg-blue-500/10",    border: "border-blue-500/20"   },
  deploy:  { icon: Radio,        color: "#8b5cf6", bg: "bg-purple-500/10",  border: "border-purple-500/20" },
};

// ── Mock events for demo when SSE has no data ──────────────────────────────
function mockEvent(agentId: string): PulseEvent {
  const types = ["task", "success", "info", "deploy"] as const;
  const msgs  = [
    "Processed user query in 340ms",
    "Memory node indexed: session_2847",
    "Skill invoked: web_search",
    "KYC verification passed",
    "MCP tool call: fetch_data",
    "Response generated — 512 tokens",
  ];
  return {
    id:        crypto.randomUUID(),
    type:      types[Math.floor(Math.random() * types.length)],
    message:   msgs[Math.floor(Math.random() * msgs.length)],
    timestamp: new Date().toISOString(),
    meta:      { agentId },
  };
}

export default function PulsePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [events, setEvents]     = useState<PulseEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── SSE connection ─────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    let demo: NodeJS.Timeout | null = null;

    try {
      es = new EventSource(`/api/pulse/stream?agentId=${agentId}`);
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "PULSE" && Array.isArray(data.events)) {
            setEvents(prev => [...data.events, ...prev].slice(0, 100));
          }
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => setConnected(false);

      // ── Demo: inject mock events every 3s when stream is quiet ──────────
      demo = setInterval(() => {
        setEvents(prev => {
          if (prev.length > 0 && Date.now() - new Date(prev[0].timestamp).getTime() < 5000) return prev;
          return [mockEvent(agentId), ...prev].slice(0, 100);
        });
      }, 3000);
    } catch (err) {
      console.error("[Pulse] SSE init failed:", err);
    }

    return () => {
      es?.close();
      if (demo) clearInterval(demo);
    };
  }, [agentId]);

  // Auto-scroll to top (newest events)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <ErrorBoundary>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 md:p-6 h-full flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Live Pulse</h2>
          <p className="text-xs md:text-sm text-white/30 mt-0.5">Real-time event stream for this agent</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] md:text-xs font-bold transition-all",
          connected
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-white/5 border-white/10 text-white/30"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            connected ? "bg-emerald-400 animate-pulse" : "bg-white/20"
          )} />
          {connected ? "Connected" : "Connecting…"}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["task","success","error","deploy"] as const).map(type => {
          const cfg   = TYPE_CONFIG[type];
          const count = events.filter(e => e.type === type).length;
          return (
            <div key={type} className={cn("p-3 md:p-4 rounded-2xl border", cfg.bg, cfg.border)}>
              <cfg.icon className="w-4 h-4 mb-2" style={{ color: cfg.color }} />
              <p className="text-xl md:text-2xl font-black text-white">{count}</p>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: cfg.color }}>
                {type}s
              </p>
            </div>
          );
        })}
      </div>

      {/* Event feed */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false} mode="popLayout">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white/20 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-white/40">Synchronizing Pulse...</p>
              <p className="text-xs text-white/10 mt-1">Waiting for agent event broadcast</p>
            </div>
          ) : (
            events.map((ev) => {
              const cfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.info;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    cfg.bg, cfg.border
                  )}
                >
                  <cfg.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-snug">{ev.message}</p>
                    {ev.meta && Object.keys(ev.meta).filter(k => k !== "agentId").length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {Object.entries(ev.meta)
                          .filter(([k]) => k !== "agentId")
                          .map(([k, v]) => (
                            <span key={k} className="text-[10px] font-mono text-white/30">
                              {k}={v}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </motion.div>
    </ErrorBoundary>
  );
}

