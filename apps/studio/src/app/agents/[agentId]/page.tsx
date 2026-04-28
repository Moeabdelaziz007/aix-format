"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAgentStore } from "@/store/agents";
import { AgentCard } from "@/components/aix/AgentCard";
import { VoiceOrb } from "@/components/aix/VoiceOrb";
import { GlassPanel } from "@/components/aix/GlassPanel";
import type { VoiceState } from "@/lib/aix/schema";
import { ArrowRight, FileSignature } from "lucide-react";
import { shortHash } from "@/lib/aix/hash";

export default function AgentDetail() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = useAgentStore((s) =>
    s.agents.find((a) => a.manifest.meta.id === agentId),
  );
  const [orb, setOrb] = useState<VoiceState>("idle");

  if (!agent) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="text-sm text-muted-foreground">لم يتم العثور على هذا الوكيل.</p>
        <Link
          href="/agents"
          className="mt-4 inline-flex items-center gap-1 text-xs text-azure hover:underline"
        >
          العودة للوكلاء <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const cycle = () => {
    const next: Record<VoiceState, VoiceState> = {
      idle: "listening",
      listening: "processing",
      processing: "speaking",
      speaking: "idle",
    };
    setOrb((s) => next[s]);
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-auto lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        <AgentCard agent={agent} active />

        <GlassPanel padded={false}>
          <div className="border-b border-white/5 px-5 py-3">
            <h3 className="text-sm font-medium text-foreground/90">سجل التواقيع</h3>
          </div>
          <div className="divide-y divide-white/5">
            {agent.manifest.signatures.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                لا توجد توقيعات بعد
              </div>
            )}
            {agent.manifest.signatures.map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="rounded-lg bg-azure/10 p-2 text-azure">
                  <FileSignature className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-foreground/90">{s.signer}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {s.alg} · {new Date(s.created_at).toLocaleString("ar")}
                  </div>
                  <code className="mt-2 block break-all rounded-md bg-black/30 p-2 font-mono text-[10px] text-foreground/70">
                    {shortHash(s.jws, 24, 16)}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="flex flex-col gap-4">
        <GlassPanel className="flex flex-col items-center gap-4 py-8">
          <VoiceOrb state={orb} size={220} label={agent.manifest.persona.voice_signature ?? "Voice"} />
          <button
            onClick={cycle}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2 text-xs text-foreground transition-all hover:bg-white/[0.08]"
          >
            تبديل الحالة
          </button>
        </GlassPanel>

        <GlassPanel padded={false}>
          <div className="border-b border-white/5 px-5 py-3">
            <h3 className="text-sm font-medium text-foreground/90">المخطط الكامل</h3>
          </div>
          <pre className="scrollbar-thin max-h-[40vh] overflow-auto p-4 font-mono text-[10px] leading-relaxed text-foreground/80">
            <code>{JSON.stringify(agent.manifest, null, 2)}</code>
          </pre>
        </GlassPanel>
      </div>
    </div>
  );
}
