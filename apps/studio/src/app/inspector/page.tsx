"use client";

import { useAgentStore } from "@/store/agents";
import { GlassPanel } from "@/components/aix/GlassPanel";
import { Activity, ShieldAlert, Bot } from "lucide-react";

export default function InspectorPage() {
  const agents = useAgentStore((s) => s.agents);
  const activeId = useAgentStore((s) => s.activeId);
  const active = agents.find((a) => a.manifest.meta.id === activeId);

  if (!active) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass-panel max-w-sm rounded-3xl p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground">
            <Bot className="h-8 w-8" />
          </div>
          <p className="mt-4 text-sm text-foreground/80">لم يتم تحديد وكيل لفحصه.</p>
          <p className="mt-1 text-xs text-muted-foreground">الرجاء اختيار وكيل من القائمة أو الرفع.</p>
        </div>
      </div>
    );
  }

  const { manifest } = active;

  const metrics = [
    { label: "Signatures", value: manifest.signatures?.length || 0, icon: ShieldAlert },
    { label: "Version", value: manifest.meta.version, icon: Activity },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">مفتش الوكيل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تحليل بنية {manifest.meta.name} ({manifest.meta.id})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <GlassPanel key={i} className="flex items-center gap-4 py-4">
              <div className="rounded-xl bg-white/5 p-3 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-0.5 font-medium text-foreground">{m.value}</div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <GlassPanel padded={false}>
            <div className="border-b border-white/5 px-5 py-3">
              <h3 className="text-sm font-medium text-foreground/90">مؤشرات الهوية (Persona)</h3>
            </div>
            <div className="p-5">
              {/* @ts-ignore */}
              <p className="text-sm leading-relaxed text-foreground/80">{manifest.persona.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {/* @ts-ignore */}
                {manifest.persona.traits?.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/70"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel padded={false}>
            <div className="border-b border-white/5 px-5 py-3">
              <h3 className="text-sm font-medium text-foreground/90">بنية المعرفة (Knowledge)</h3>
            </div>
            <div className="divide-y divide-white/5">
              {/* @ts-ignore */}
              {manifest.knowledge?.files?.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground/80">{f.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{f.hash.substring(0, 8)}...</span>
                </div>
              ))}
              {/* @ts-ignore */}
              {(!manifest.knowledge?.files || manifest.knowledge.files.length === 0) && (
                <div className="p-5 text-center text-sm text-muted-foreground">لا توجد ملفات معرفية</div>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="flex flex-col gap-6">
          <GlassPanel padded={false} className="flex-1">
            <div className="border-b border-white/5 px-5 py-3">
              <h3 className="text-sm font-medium text-foreground/90">التعليمات الأولية (System Prompt)</h3>
            </div>
            <div className="p-5">
              <div className="relative rounded-xl border border-white/5 bg-black/20 p-4">
                <p className="font-mono text-[11px] leading-relaxed text-azure/90 whitespace-pre-wrap">
                  {/* @ts-ignore */}
                  {manifest.persona.system_prompt}
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
