import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import yaml from 'js-yaml'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robust YAML parser using js-yaml.
 */
export function parseYamlSafe(content: string): any {
  try {
    return yaml.load(content);
  } catch (error) {
    console.error("YAML Parse Error:", error);
    throw error;
  }
}

/**
 * Robust YAML stringifier using js-yaml.
 */
export function stringifyYamlSafe(data: any): string {
  try {
    return yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  } catch (error) {
    console.error("YAML Stringify Error:", error);
    return "# Error generating YAML\n" + (error as Error).message;
  }
}

/**
 * Generates a SHA-256 hex hash of the given string.
 * Used for ABOM integrity verification.
 */
export async function sha256Hex(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes a canonical SHA-256 checksum for a manifest.
 */
export function computeManifestChecksum(manifest: any): string {
  // Simple canonicalization: sort top-level keys
  const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
  const bytes = new TextEncoder().encode(canonical);
  return bytesToHex(sha256(bytes));
}

/**
 * Risk Score Normalization
 * Validator (100 = critical/risky, 0 = safe)
 * Scanner (0 = critical/risky, 100 = safe)
 * 
 * Logic: We standardize on the Validator scale (100 = risky) for the Pricing engine.
 */
export function normalizeRiskScore(rawScore: number, source: 'validator' | 'scanner'): number {
  if (!Number.isFinite(rawScore)) return 100; // Default to max risk on error
  return source === 'scanner' ? 100 - rawScore : rawScore;
}
