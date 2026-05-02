"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import { parseYamlLight } from "@/lib/utils";

// Minimal SHA-256 for the browser.
async function sha256Hex(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AIXSecurity {
  signature?: {
    value?: string;
    algorithm?: string;
  };
}

// Minimal static checker
function validateAix(parsed: Record<string, unknown> | null) {
  if (!parsed || typeof parsed !== "object") return { valid: false, missing: ["<not an object>"] };
  const reqs = ["meta", "persona", "security", "identity_layer"];
  const missing = reqs.filter((r) => !(r in parsed));

  const security = parsed.security as AIXSecurity | undefined;
  const hasSig = Boolean(security?.signature?.value && security?.signature?.algorithm);

  return {
    valid: missing.length === 0,
    missing,
    fieldCount: Object.keys(parsed).length,
    hasSignature: hasSig,
  };
}

interface LiveValidatorProps {
  content?: string;
  fileName?: string;
}

export default function LiveValidator({ 
  content: propContent, 
  fileName: propFileName 
}: LiveValidatorProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [hash, setHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    missing: string[];
    fieldCount?: number;
    hasSignature?: boolean;
  } | null>(null);

  type SigState = "missing" | "valid-structure" | "unknown";
  const [sigState, setSigState] = useState<SigState>("unknown");

  let statusLabel = "Waiting for payload...";
  if (sigState === "missing") statusLabel = "Identity missing — Unsigned";
  if (sigState === "valid-structure") statusLabel = "Identity detected — Signed";

  const processContent = async (content: string, name: string) => {
    setFileName(name);
    setError(null);
    setValidation(null);
    setHash("");

    try {
      let parsed: Record<string, unknown>;

      if (name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = parseYamlLight(content);
      }

      const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
      setHash(computedHash);

      const security = parsed.security as AIXSecurity | undefined;
      const hasSig = Boolean(security?.signature?.value && security?.signature?.algorithm);
      setSigState(hasSig ? "valid-structure" : "missing");
      setValidation(validateAix(parsed));
    } catch (e: unknown) {
      setError(
        `Invalid AIX payload: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      setValidation(null);
    }
  };

  useEffect(() => {
    if (propContent) {
      processContent(propContent, propFileName || "live-builder.aix");
    }
  }, [propContent, propFileName]);

  const handleFile = async (file: File) => {
    const content = await file.text();
    await processContent(content, file.name);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[rgba(12,16,28,0.5)] p-5 ">
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
              {validation.valid ? `Valid AIX — ${validation.fieldCount} top-level fields` : `Invalid: missing ${validation.missing.join(", ")}`}
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
