/**
 * AIX ABOM Risk Scanner — Studio local copy
 * Mirrors core/abom-scanner.ts so apps/studio builds self-contained.
 * Full scoring logic: penalises missing security fields, high-risk
 * permissions, untrusted registries, and absent provenance.
 */

export interface AbomScanResult {
  risk_score: number; // 0-100 (100 = critical risk, 0 = safe)
  risks: string[];
  tier: "safe" | "moderate" | "high" | "critical";
}

const PENALISED_PERMISSIONS = [
  "read:filesystem",
  "write:filesystem",
  "network:unrestricted",
  "exec:shell",
  "access:secrets",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scanAgent(manifest: Record<string, any>): AbomScanResult {
  let risk_score = 0;
  const risks: string[] = [];

  // 1. Check ABOM block exists
  if (!manifest?.abom) {
    risk_score += 20;
    risks.push("Missing ABOM block");
  }

  // 2. Accumulate risk from dangerous permissions
  const permissions: string[] =
    manifest?.abom?.permissions ?? manifest?.permissions ?? [];
  for (const perm of PENALISED_PERMISSIONS) {
    if (permissions.includes(perm)) {
      risk_score += 10;
      risks.push(`High-risk permission: ${perm}`);
    }
  }

  // 3. Check build provenance
  if (!manifest?.abom?.build_provenance && !manifest?.build_provenance) {
    risk_score += 10;
    risks.push("Missing build_provenance");
  }

  // 4. Check saas_services for untrusted origins
  const saasServices: Array<{ provider?: string; trusted?: boolean }> =
    manifest?.abom?.saas_services ?? [];
  for (const svc of saasServices) {
    if (svc.trusted === false) {
      risk_score += 5;
      risks.push(`Untrusted SaaS service: ${svc.provider ?? "unknown"}`);
    }
  }

  // 5. Check required identity fields
  if (!manifest?.agent?.did && !manifest?.did) {
    risk_score += 10;
    risks.push("Missing agent DID");
  }
  if (!manifest?.agent?.name && !manifest?.name) {
    risk_score += 5;
    risks.push("Missing agent name");
  }

  risk_score = Math.max(0, Math.min(100, risk_score));

  let tier: AbomScanResult["tier"] = "safe";
  if (risk_score >= 90) tier = "critical";
  else if (risk_score >= 70) tier = "high";
  else if (risk_score >= 40) tier = "moderate";

  return { risk_score, risks, tier };
}

export default scanAgent;
