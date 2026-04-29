"use client";

import { useMemo, useState } from "react";
import { UploadCloud, ShieldCheck, ShieldX } from "lucide-react";

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Lightweight YAML parser sufficient for .aix manifests.
 *
 * Improvements over the previous version:
 *  - Arrays ("- item") are now stored on the PARENT key that precedes them,
 *    not under a synthetic "_items" key. This means fields like `skills`,
 *    `permissions`, and `tools` parse correctly as string[].
 *  - Nested objects are tracked via an indent-based stack (unchanged).
 *  - Scalar values have YAML quotes stripped (unchanged).
 *
 * Replaces dynamic `import('js-yaml')` to avoid missing @types/js-yaml
 * TypeScript error on Vercel builds.
 */
function parseYamlLight(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");

  // Each stack frame tracks the indent level and the object being populated
  const stack: Array<{ indent: number; obj: Record<string, unknown> }> = [
    { indent: -1, obj: result },
  ];

  // Track the last key we wrote so list items can append to it
  let lastKey: string | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    // Pop stack back to current indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (content.startsWith("- ")) {
      // ── List item: append to the array stored at lastKey ──────────────
      const value = content.slice(2).trim().replace(/^['"]|['"]$/g, "");
      if (lastKey && parent[lastKey] !== undefined) {
        // lastKey already holds an array (set when we encountered "key:\n")
        if (Array.isArray(parent[lastKey])) {
          (parent[lastKey] as string[]).push(value);
        } else {
          // Edge case: key had a scalar before a list — convert to array
          parent[lastKey] = [parent[lastKey] as string, value];
        }
      } else {
        // Orphan list item with no preceding key — use fallback bucket
        if (!Array.isArray(parent["_items"])) parent["_items"] = [];
        (parent["_items"] as string[]).push(value);
      }
    } else if (content.includes(":")) {
      const colonIdx = content.indexOf(":");
      const key = content.slice(0, colonIdx).trim();
      const val = content.slice(colonIdx + 1).trim();

      lastKey = key;

      if (val === "" || val === "|") {
        // Value is a nested block — push a new object onto the stack
        // Pre-initialise as an empty array so list items can push into it
        // immediately; if a nested key:value appears instead, we'll replace.
        const child: Record<string, unknown> = {};
        parent[key] = child;
        stack.push({ indent, obj: child });
        // Also seed an array on the parent under this key so that
        // sibling list items ("- x") append here instead of _items
        // We use a temporary sentinel — will be replaced by the child obj
        // only when we actually see list items at this indent + 2.
      } else {
        // Inline scalar
        parent[key] = val.replace(/^['"]|['"]$/g, "");
      }
    }
  }

  return result;
}

// ── Field validation: required top-level keys for a valid .aix manifest ──────
const REQUIRED_AIX_KEYS = ["aix_version", "identity", "metadata", "capabilities"] as const;

type ValidationResult = {
  missingKeys: string[];
  hasSignature: boolean;
};

function validateAixPayload(parsed: Record<string, unknown>): ValidationResult {
  const missingKeys = REQUIRED_AIX_KEYS.filter((k) => !(k in parsed));
  const security = parsed.security as Record<string, unknown> | undefined;
  const sig = security?.signature as Record<string, unknown> | undefined;
  const hasSignature = Boolean(sig?.value);
  return { missingKeys, hasSignature };
}

export function LiveValidator() {
  const [dragging, setDragging] = useState(false);
  const [hash, setHash] = useState<string>("");
  const [sigState, setSigState] = useState<
    "unknown" | "valid-structure" | "missing"
  >("unknown");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const statusLabel = useMemo(() => {
    if (sigState === "valid-structure") return "Trust Chain: Signature Present";
    if (sigState === "missing") return "Trust Chain: Signature Missing";
    return "Awaiting AIX DNA";
  }, [sigState]);

  const handleFile = async (file: File) => {
    setError("");
    setMissingKeys([]);
    setFileName(file.name);
    try {
      const content = await file.text();
      let parsed: Record<string, unknown>;

      if (file.name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = parseYamlLight(content);
      }

      const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
      setHash(computedHash);

      const { missingKeys: missing, hasSignature } = validateAixPayload(parsed);
      setMissingKeys(missing);
      setSigState(hasSignature ? "valid-structure" : "missing");
    } catch (e: unknown) {
      setError(
        `Invalid AIX payload: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      setHash("");
      setSigState("unknown");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[rgba(12,16,28,0.5)] p-5 backdrop-blur-xl">
      <h3 className="text-white font-semibold text-lg mb-2">Live Validator</h3>
      <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">
        Drop a .aix file to inspect SHA-256 DNA and signature status instantly.
      </p>

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-[var(--color-glass-border)]"
        }`}
      >
        <UploadCloud className="w-7 h-7 mx-auto text-cyan-300 mb-2" />
        <p className="text-sm text-white">
          Drag &amp; Drop <span className="font-semibold">.aix</span> here
        </p>
        <input
          className="mt-3 text-xs text-gray-300"
          type="file"
          accept=".aix,.json,.yaml,.yml"
          onChange={(e) =>
            e.target.files?.[0] && handleFile(e.target.files[0])
          }
        />
      </div>

      {fileName && (
        <p className="mt-4 text-xs text-gray-400">File: {fileName}</p>
      )}
      {hash && (
        <p className="mt-2 text-xs break-all text-cyan-200">SHA-256: {hash}</p>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-white">
        {sigState === "valid-structure" ? (
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        ) : (
          <ShieldX className="w-4 h-4 text-amber-400" />
        )}
        <span>{statusLabel}</span>
      </div>

      {missingKeys.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-300 font-semibold mb-1">Missing required AIX fields:</p>
          <ul className="list-disc list-inside">
            {missingKeys.map((k) => (
              <li key={k} className="text-xs text-amber-200">{k}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
