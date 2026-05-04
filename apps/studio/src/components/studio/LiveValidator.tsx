"use client";

import { useEffect, useMemo, useState } from "react";
import { UploadCloud, ShieldCheck, ShieldX, CheckCircle2, AlertTriangle } from "lucide-react";
import { parseYamlSafe, sha256Hex } from "@/lib/utils";

const REQUIRED_AIX_KEYS = ["meta", "persona", "security", "identity_layer"] as const;

type ValidationResult = {
  valid: boolean;
  missing: string[];
  hasSignature: boolean;
  fieldCount: number;
};

function validateAix(parsed: Record<string, unknown>): ValidationResult {
  const missing = REQUIRED_AIX_KEYS.filter((k) => !(k in parsed));
  const security = parsed.security as Record<string, unknown> | undefined;
  const sig = security?.signature as Record<string, unknown> | undefined;
  const hasSignature = Boolean(sig?.value);
  const fieldCount = Object.keys(parsed).length;
  return { valid: missing.length === 0, missing, hasSignature, fieldCount };
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
    if (!validation.valid) return `Missing protocol fields: ${validation.missing.join(", ")}`;
    return validation.hasSignature
      ? "Identity Verified: Sovereign Trust Active"
      : "Step 6: Sign with Pi KYC to activate trust";
  }, [validation]);

  const processContent = async (content: string, name: string) => {
    setError("");
    setFileName(name);
    try {
      let parsed: Record<string, unknown>;

      if (name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = parseYamlSafe(content);
      }

      const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
      setHash(computedHash);

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

  const sigState = validation?.hasSignature
    ? "valid-structure"
    : validation
    ? "missing"
    : "unknown";

  return (
    <div className="rounded-2xl border border-[var(var(--color-border))] bg-[rgba(12,16,28,0.5)] p-5 ">
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
            : "border-[var(var(--color-border))] hover:border-white/20"
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
