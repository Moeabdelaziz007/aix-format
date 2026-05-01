import { AIXManifest } from "@aix-types";
import { SUPPORTED_VERSIONS } from "@/constants/protocol";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  risk_score: number;
}

/**
 * Sovereign Protocol Validator
 * Enforces strict compliance with AIX standards.
 */
export function validateSovereignManifest(manifest: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let risk_score = 0;

  // 1. Core Metadata
  if (!manifest.meta) {
    errors.push("Missing 'meta' block");
  } else {
    if (!manifest.meta.name) errors.push("meta.name is required");
    if (!manifest.meta.format_version || !SUPPORTED_VERSIONS.includes(manifest.meta.format_version)) {
      errors.push(`Invalid format_version. Supported: ${SUPPORTED_VERSIONS.join(", ")}`);
    }
    if (!manifest.meta.author) warnings.push("Missing meta.author (Sovereign recommendation)");
  }

  // 2. Identity Layer (Sovereign Requirement)
  if (!manifest.identity_layer) {
    errors.push("Missing 'identity_layer' (Required for AIX v1.3.0)");
  } else {
    if (!manifest.identity_layer.id) errors.push("identity_layer.id (DID) is required");
    if (!manifest.identity_layer.id.startsWith("did:")) {
      errors.push("identity_layer.id must be a valid DID (did:axiom, did:web, etc.)");
    }
  }

  // 3. Security & Sandboxing
  if (!manifest.security) {
    errors.push("Missing 'security' block");
  } else {
    if (manifest.security.sandboxed === undefined) {
      errors.push("security.sandboxed explicitly must be true/false");
    }
    if (!manifest.security.checksum?.value) {
      warnings.push("No checksum provided. Integrity cannot be verified.");
    }
  }

  // 4. ABOM (Risk Enforcement)
  if (!manifest.abom) {
    warnings.push("Missing 'abom' block. Risk score defaulted to maximum.");
    risk_score = 100;
  } else {
    if (manifest.abom.risk_level === 'critical') risk_score = 100;
    else if (manifest.abom.risk_level === 'high') risk_score = 75;
    else if (manifest.abom.risk_level === 'medium') risk_score = 50;
    else risk_score = 10;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    risk_score
  };
}
