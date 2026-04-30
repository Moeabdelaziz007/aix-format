"use client";

import { useEffect, useMemo, useState } from "react";
import { UploadCloud, ShieldCheck, ShieldX, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { parseYamlSafe } from "@/lib/utils";

async function sha256Hex(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const REQUIRED_AIX_KEYS = ["meta", "persona", "security", "identity_layer"] as const;

type ValidationResult = {
  valid: boolean;
  missing: string[];
  hasSignature: boolean;
  fieldCount: number;
  warnings: string[];
};

function validateAix(parsed: Record<string, unknown>): ValidationResult {
  const missing = REQUIRED_AIX_KEYS.filter((k) => !(k in parsed));
  const security = parsed.security as Record<string, unknown> | undefined;
  const sig = security?.signature as Record<string, unknown> | undefined;
  const hasSignature = Boolean(sig?.value);
  const fieldCount = Object.keys(parsed).length;

  // Fresh warnings array — never accumulated across calls
  const warnings: string[] = [];

  if (!hasSignature) {
    warnings.push("No cryptographic signature — agent cannot be trusted on-chain");
  }

  // validate live_voice section when present
  const lv = parsed.live_voice as Record<string, unknown> | undefined;
  if (lv !== undefined) {
    if (lv.enabled === true && !lv.provider) {
      warnings.push("live_voice: 'provider' is required when enabled is true");
    }
    if (lv.enabled === true && lv.provider === "generic") {
      warnings.push("live_voice: 'generic' provider has no built-in implementation — ensure a custom adapter is registered");
    }
    if (lv.enabled === false) {
      warnings.push("live_voice: section present but disabled — remove it or set enabled: true");
    }
  }

  // validate abom integrity_hash pattern if present
  const abom = parsed.abom as Record<string, unknown> | undefined;
  if (abom?.integrity_hash) {
    const h = abom.integrity_hash as string;
    if (h !== "pending" && h !== "sha256-empty-deps" && !/^[0-9a-f]{64}$/.test(h) && !/^sha256-/.test(h)) {
      warnings.push("abom.integrity_hash: value does not look like a valid sha256 hex or sentinel");
    }
  }

  return { valid: missing.length === 0, missing, hasSignature, fieldCount, warnings };
}

export default function LiveValidator({ 
  content: propContent, 
  fileName: propFileName 
}: { 
  content?: string; 
  fileName?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [hash, setHash] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>(propFileName || "");
  const [error, setError] = useState<string>("");

  const statusLabel = useMemo(() => {
    if (!validation) return "Awaiting AIX DNA";
    if (!validation.valid) return `Missing fields: ${validation.missing.join(", ")}`;
    return validation.hasSignature
      ? "Trust Chain: Signature Present"
      : "Trust Chain: Signature Missing";
  }, [validation]);

  const processContent = async (content: string, name: string) => {
    // Reset all derived state at the START of every processing run
    setError("");
    setValidation(null);
    setHash("");
    setFileName(name);
    try {
      let parsed: Record<string, unknown>;

      if (name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = await parseYamlSafe(content);
      }

      const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
      setHash(computedHash);
      // validateAix always returns a fresh ValidationResult — no accumulation
      setValidation(validateAix(parsed));
    } catch (e: unknown) {
      setError(
        `Invalid AIX payload: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  };

  useEffect(() => {
    if (propContent && propContent.trim().length > 0) {
      processContent(propContent, propFileName || "live-builder.aix");
    } else {
      // Content cleared — reset ALL state so stale warnings don't survive
      setValidation(null);
      setHash("");
      setError("");
      setFileName(propFileName || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propContent, propFileName]);

  const handleFile = async (file: File) => {
    const content = await file.text();
    await processContent(content, file.name);
  };

  const sigState = validation?.hasSignature
    ? "valid-structure"
    : validation
    ? "missing"
    : "unknown";

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[rgba(12,16,28,0.5)] p-5 backdrop-blur-xl">
      <h3 className="text-white font-semibold text-lg mb-2">Live Validator</h3>
      <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">
        Drop a .aix file to inspect SHA-256 DNA, required fields, and signature status.
      </p>

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-[var(--color-glass-border)] hover:border-white/20"
        }`}
      >
        <UploadCloud className="w-7 h-7 mx-auto text-cyan-300 mb-2" />
        <p className="text-sm text-white">
          Drag &amp; Drop <span className="font-semibold">.aix</span> here
        </p>
        <label className="mt-3 block cursor-pointer">
          <span className="text-xs text-gray-400 underline underline-offset-2">or browse</span>
          <input
            className="sr-only"
            type="file"
            accept=".aix,.json,.yaml,.yml"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />
        </label>
      </div>

      {fileName && (
        <p className="mt-4 text-xs text-gray-400 truncate" title={fileName}>File: {fileName}</p>
      )}

      {hash && (
        <p className="mt-2 text-[10px] font-mono break-all text-cyan-200/80">
          SHA-256: {hash}
        </p>
      )}

      {validation && (
        <div className="mt-3 space-y-2">
          {/* Structural validity */}
          <div className="flex items-center gap-2 text-sm">
            {validation.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span className={validation.valid ? "text-emerald-300" : "text-amber-300"}>
              {validation.valid
                ? `Valid AIX — ${validation.fieldCount} top-level fields`
                : `Invalid: missing ${validation.missing.join(", ")}`}
            </span>
          </div>

          {/* Signature status */}
          <div className="flex items-center gap-2 text-sm">
            {sigState === "valid-structure" ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldX className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span className={sigState === "valid-structure" ? "text-emerald-300" : "text-amber-300/80"}>
              {statusLabel}
            </span>
          </div>

          {/* Warnings — always freshly computed, never accumulated */}
          {validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-yellow-300/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-1.5">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!validation && !error && hash === "" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-on-surface-faint)]">
          <ShieldX className="w-4 h-4" />
          <span>{statusLabel}</span>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
