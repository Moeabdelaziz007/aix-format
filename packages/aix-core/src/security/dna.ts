import { createHash } from 'crypto';

/**
 * Generates a deterministic DNA fingerprint hash for an agent manifest.
 */
export function generateDNAFingerprint(manifest: any): string {
  // Sort keys to ensure deterministic output
  const canonicalString = JSON.stringify(manifest, Object.keys(manifest).sort());
  return createHash('sha256').update(canonicalString).digest('hex');
}
