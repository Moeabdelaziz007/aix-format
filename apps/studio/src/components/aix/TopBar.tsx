"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Activity } from "lucide-react";
import { useAgentStore } from "@/store/agents";
import { useIdentityStore } from "@/store/identity";
import { KycSignatureModal } from "./KycSignatureModal";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [modalOpen, setModalOpen] = useState(false);
  const agents = useAgentStore((s) => s.agents);
  const activeId = useAgentStore((s) => s.activeId);
  const active = agents.find((a) => a.manifest.meta.id === activeId);
  const kycStatus = useIdentityStore((s) => s.kycStatus);
  const did = useIdentityStore((s) => s.did);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="glass-panel flex items-center justify-between gap-4 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-azure/20">
            <Sparkles className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="absolute -inset-0.5 rounded-xl ring-1 ring-white/10" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-foreground">AIX Studio</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Sovereign Protocol
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs md:flex">
          <Activity
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              pulse ? "text-status-online" : "text-status-online/50",
            )}
          />
          <span className="text-muted-foreground">الوكيل النشط:</span>
          <span className="font-medium text-foreground">
            {active?.manifest.meta.name ?? "—"}
          </span>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all",
            kycStatus === "verified"
              ? "border-status-online/30 bg-status-online/10 text-status-online hover:bg-status-online/15"
              : "border-white/10 bg-white/[0.05] text-foreground hover:bg-white/[0.08]",
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {kycStatus === "verified" ? (
            <span className="font-mono">{did?.slice(0, 18)}…</span>
          ) : (
            "بوابة الهوية"
          )}
        </button>
      </header>
      <KycSignatureModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
