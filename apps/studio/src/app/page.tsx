"use client";

import { useState } from "react";
import { useAgentStore } from "@/store/agents";
import { useSignalStore } from "@/store/signals";
import { SwarmCanvas } from "@/components/aix/SwarmCanvas";
import { SignalLog } from "@/components/aix/SignalLog";
import { VoiceOrb } from "@/components/aix/VoiceOrb";
import { GlassPanel } from "@/components/aix/GlassPanel";
import type { VoiceState } from "@/lib/aix/schema";
import { Mic, Brain, Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrchestrationPage() {
  const agents = useAgentStore((s) => s.agents);
  const activeId = useAgentStore((s) => s.activeId);
  const setActive = useAgentStore((s) => s.setActive);
  const setVoiceState = useAgentStore((s) => s.setVoiceState);
  const active = agents.find((a) => a.manifest.meta.id === activeId);
  const pushSignal = useSignalStore((s) => s.push);
  const [orbState, setOrbState] = useState<VoiceState>("idle");

  const trigger = (state: VoiceState) => {
    setOrbState(state);
    if (active) setVoiceState(active.manifest.meta.id, state);
    pushSignal({
      kind: state === "idle" ? "info" : "success",
      source: active?.manifest.meta.id ?? "swarm",
      message: `الحالة: ${state}`,
    });
  };

  const controls: { state: VoiceState; icon: typeof Mic; label: string }[] = [
    { state: "listening", icon: Mic, label: "إنصات" },
    { state: "processing", icon: Brain, label: "معالجة" },
    { state: "speaking", icon: Volume2, label: "تحدّث" },
    { state: "idle", icon: Square, label: "سكون" },
  ];

  return (
    <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
      {/* Canvas + Orb */}
      <div className="flex flex-col gap-4">
        <GlassPanel className="flex-1 min-h-[420px]" padded={false}>
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div>
              <h2 className="text-sm font-medium text-foreground/90">قماش السرب</h2>
              <p className="text-[10px] text-muted-foreground">
                {agents.length} وكيل · انقر لاختيار النشط
              </p>
            </div>
          </div>
          <div className="h-[calc(100%-58px)] min-h-[360px]">
            <SwarmCanvas agents={agents} activeId={activeId} onSelect={setActive} />
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-col items-center gap-6 py-8 md:flex-row md:items-center md:justify-around md:gap-4">
          <VoiceOrb state={orbState} size={200} label={active?.manifest.meta.name ?? "Voice Channel"} />
          <div className="flex flex-col gap-2.5">
            {controls.map((c) => {
              const Icon = c.icon;
              const active2 = orbState === c.state;
              return (
                <button
                  key={c.state}
                  onClick={() => trigger(c.state)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all",
                    active2
                      ? "border-azure/40 bg-azure/10 text-foreground ring-1 ring-azure/30"
                      : "border-white/10 bg-white/[0.03] text-foreground/80 hover:bg-white/[0.06]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* Signal log */}
      <div className="min-h-[400px] xl:h-full">
        <SignalLog />
      </div>
    </div>
  );
}
