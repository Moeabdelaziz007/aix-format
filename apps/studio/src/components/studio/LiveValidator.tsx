"use client";

import { useMemo, useState } from "react";
import { UploadCloud, ShieldCheck, ShieldX } from "lucide-react";

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function LiveValidator() {
  const [dragging, setDragging] = useState(false);
  const [hash, setHash] = useState<string>("");
  const [sigState, setSigState] = useState<"unknown" | "valid-structure" | "missing">("unknown");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const statusLabel = useMemo(() => {
    if (sigState === "valid-structure") return "Trust Chain: Signature Present";
    if (sigState === "missing") return "Trust Chain: Signature Missing";
    return "Awaiting AIX DNA";
  }, [sigState]);

  const handleFile = async (file: File) => {
    setError("");
    setFileName(file.name);
    try {
      const content = await file.text();
      let parsed: Record<string, unknown> | null = null;
      if (file.name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        const [{ load }] = await Promise.all([import("js-yaml")]);
        parsed = load(content) as Record<string, unknown>;
      }

      const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
      setHash(computedHash);

      // We don't have deep type info, so cast to a structure to check fields safely
      const parsedAny = parsed as any;
      const hasSig = Boolean(parsedAny?.security?.signature?.value && parsedAny?.security?.signature?.algorithm);
      setSigState(hasSig ? "valid-structure" : "missing");
    } catch (e: unknown) {
      setError(`Invalid AIX payload: ${e instanceof Error ? e.message : String(e)}`);
      setHash("");
      setSigState("unknown");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[rgba(12,16,28,0.5)] p-5 backdrop-blur-xl">
      <h3 className="text-white font-semibold text-lg mb-2">Live Validator</h3>
      <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">Drop a .aix file to inspect SHA-256 DNA and signature status instantly.</p>

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-cyan-400 bg-cyan-500/10" : "border-[var(--color-glass-border)]"}`}
      >
        <UploadCloud className="w-7 h-7 mx-auto text-cyan-300 mb-2" />
        <p className="text-sm text-white">Drag & Drop <span className="font-semibold">.aix</span> here</p>
        <input
          className="mt-3 text-xs text-gray-300"
          type="file"
          accept=".aix,.json,.yaml,.yml"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {fileName && <p className="mt-4 text-xs text-gray-400">File: {fileName}</p>}
      {hash && <p className="mt-2 text-xs break-all text-cyan-200">SHA-256: {hash}</p>}
      <div className="mt-3 flex items-center gap-2 text-sm text-white">
        {sigState === "valid-structure" ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldX className="w-4 h-4 text-amber-400" />}
        <span>{statusLabel}</span>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
