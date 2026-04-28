"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck2, AlertCircle, Hash, Trash2 } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { aixManifestSchema, type LoadedAgent } from "@/lib/aix/schema";
import { sha256Hex, shortHash } from "@/lib/aix/hash";
import { useAgentStore } from "@/store/agents";
import { useSignalStore } from "@/store/signals";
import { cn } from "@/lib/utils";
import { mockManifests } from "@/lib/aix/mock-data";

export function UploadSidebar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const agents = useAgentStore((s) => s.agents);
  const addAgent = useAgentStore((s) => s.addAgent);
  const removeAgent = useAgentStore((s) => s.removeAgent);
  const activeId = useAgentStore((s) => s.activeId);
  const setActive = useAgentStore((s) => s.setActive);
  const pushSignal = useSignalStore((s) => s.push);

  const ingestText = useCallback(
    async (text: string, sourceName: string) => {
      setError(null);
      setBusy(true);
      try {
        const json = JSON.parse(text);
        const parsed = aixManifestSchema.parse(json);
        const hash = await sha256Hex(JSON.stringify(parsed));
        const agent: LoadedAgent = {
          manifest: parsed,
          hash,
          loadedAt: new Date().toISOString(),
          status: "online",
          voiceState: "idle",
        };
        addAgent(agent);
        pushSignal({
          kind: "success",
          source: "upload",
          message: `تم تحميل ${parsed.meta.name} (${sourceName})`,
          payload: { hash: shortHash(hash) },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "ملف غير صالح";
        setError(msg);
        pushSignal({ kind: "error", source: "upload", message: `فشل التحقق: ${msg}` });
      } finally {
        setBusy(false);
      }
    },
    [addAgent, pushSignal],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (const f of Array.from(files)) {
        const text = await f.text();
        await ingestText(text, f.name);
      }
    },
    [ingestText],
  );

  const loadSample = useCallback(async () => {
    const sample = mockManifests[1];
    await ingestText(JSON.stringify(sample), "sample.aix");
  }, [ingestText]);

  return (
    <GlassPanel className="flex h-full flex-col gap-4" padded>
      <div>
        <h3 className="text-sm font-medium tracking-wide text-foreground/90">
          مصفوفة الرفع
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          اسحب ملف <code className="text-azure">.aix</code> أو{" "}
          <code className="text-azure">manifest.schema.json</code>
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition-all",
          "hover:border-white/30 hover:bg-white/[0.04]",
          dragOver && "border-azure/50 bg-azure/5 ring-2 ring-azure/20",
        )}
      >
        <motion.div
          animate={{ y: dragOver ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="rounded-full bg-white/5 p-3"
        >
          <Upload className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
        </motion.div>
        <div className="text-xs text-muted-foreground">
          {busy ? "جارٍ التحقق…" : "إفلات أو اضغط للاختيار"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".aix,.json,application/json"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <button
        onClick={loadSample}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground/80 transition-colors hover:bg-white/[0.07]"
      >
        تحميل عيّنة AIX
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-all">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 border-t border-white/5 pt-3">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          المحمّلة ({agents.length})
        </h4>
        <div className="scrollbar-thin flex max-h-[40vh] flex-col gap-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {agents.map((a) => (
              <motion.div
                key={a.manifest.meta.id}
                layout
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => setActive(a.manifest.meta.id)}
                className={cn(
                  "group cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-3 text-start transition-all hover:bg-white/[0.06]",
                  activeId === a.manifest.meta.id &&
                    "border-azure/40 bg-azure/5 ring-1 ring-azure/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-status-online" />
                      <span className="truncate text-xs font-medium text-foreground/90">
                        {a.manifest.meta.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Hash className="h-2.5 w-2.5" />
                      <span className="font-mono">{shortHash(a.hash)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAgent(a.manifest.meta.id);
                      pushSignal({
                        kind: "warn",
                        source: "upload",
                        message: `أُزيل ${a.manifest.meta.name}`,
                      });
                    }}
                    className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="إزالة"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {agents.length === 0 && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-muted-foreground">
              لا توجد ملفات بعد
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
