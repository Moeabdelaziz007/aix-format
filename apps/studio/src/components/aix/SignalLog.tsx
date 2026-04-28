import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, FileSignature, ChevronRight, Trash2 } from "lucide-react";
import { useSignalStore, type SignalKind } from "@/store/signals";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

const iconMap: Record<SignalKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
  signature: FileSignature,
};

const colorMap: Record<SignalKind, string> = {
  info: "text-foreground/70",
  success: "text-status-online",
  warn: "text-status-pending",
  error: "text-status-offline",
  signature: "text-azure",
};

export function SignalLog() {
  const signals = useSignalStore((s) => s.signals);
  const clear = useSignalStore((s) => s.clear);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <GlassPanel className="flex h-full flex-col" padded={false}>
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <h3 className="text-sm font-medium text-foreground/90">سجل الإشارات</h3>
          <p className="text-[10px] text-muted-foreground">آخر {signals.length} حدث</p>
        </div>
        <button
          onClick={clear}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="مسح"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
        <AnimatePresence initial={false}>
          {signals.map((s) => {
            const Icon = iconMap[s.kind];
            const isOpen = expanded === s.id;
            return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="group mb-1 rounded-lg px-2 py-2 hover:bg-white/[0.03]"
              >
                <button
                  onClick={() => s.payload != null && setExpanded(isOpen ? null : s.id)}
                  className="flex w-full items-start gap-2.5 text-start"
                >
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", colorMap[s.kind])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-foreground/85">{s.message}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {new Date(s.ts).toLocaleTimeString("en-GB", { hour12: false })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.payload != null ? (
                        <ChevronRight
                          className={cn("h-2.5 w-2.5 transition-transform", isOpen && "rotate-90")}
                        />
                      ) : null}
                      {s.source}
                    </div>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && s.payload != null && (
                    <motion.pre
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden rounded-md bg-black/30 p-2 font-mono text-[10px] text-foreground/70"
                    >
                      <code>{JSON.stringify(s.payload, null, 2)}</code>
                    </motion.pre>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {signals.length === 0 && (
          <div className="flex h-full items-center justify-center px-4 py-12 text-center text-xs text-muted-foreground">
            القناة هادئة — لا أحداث بعد
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
