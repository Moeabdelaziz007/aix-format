import { z } from "zod";

/**
 * AIX Format — Sovereign Protocol Manifest Schema
 * Local mirror of the AIX schema from Moeabdelaziz007/aix-format.
 * Validates packaged autonomous AI agents, VLA systems, and Multi-sig entities.
 */

export const aixMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  publisher: z.string().min(1),
  created_at: z.string(),
  description: z.string().optional(),
  license: z.string().optional(),
});

export const aixPersonaSchema = z.object({
  tone: z.enum(["formal", "neutral", "warm", "playful", "stoic"]),
  languages: z.array(z.string()).min(1),
  archetype: z.string().optional(),
  voice_signature: z.string().optional(),
});

export const aixCapabilitySchema = z.object({
  name: z.string(),
  type: z.enum(["tool", "skill", "vla", "multi-sig", "perception", "actuation"]),
  scope: z.array(z.string()).optional(),
});

export const aixSecuritySchema = z.object({
  signature_alg: z.enum(["EdDSA", "ES256", "RS256", "Pi-KYC-JWS"]),
  did: z.string().regex(/^did:[a-z]+:[a-zA-Z0-9._-]+$/),
  kyc_status: z.enum(["unverified", "pending", "verified", "revoked"]),
  multisig: z
    .object({
      threshold: z.number().int().positive(),
      signers: z.array(z.string()).min(1),
    })
    .optional(),
});

export const aixRuntimeSchema = z.object({
  engine: z.string(),
  memory_mb: z.number().int().positive().optional(),
  network: z.enum(["isolated", "outbound", "full"]).default("outbound"),
});

export const aixSignatureSchema = z.object({
  signer: z.string(),
  alg: z.string(),
  created_at: z.string(),
  jws: z.string(),
});

export const aixManifestSchema = z.object({
  schema: z.literal("aix/v1"),
  meta: aixMetaSchema,
  persona: aixPersonaSchema,
  capabilities: z.array(aixCapabilitySchema),
  security: aixSecuritySchema,
  runtime: aixRuntimeSchema,
  signatures: z.array(aixSignatureSchema).default([]),
});

export type AixManifest = z.infer<typeof aixManifestSchema>;
export type AixMeta = z.infer<typeof aixMetaSchema>;
export type AixPersona = z.infer<typeof aixPersonaSchema>;
export type AixCapability = z.infer<typeof aixCapabilitySchema>;
export type AixSecurity = z.infer<typeof aixSecuritySchema>;
export type AixSignature = z.infer<typeof aixSignatureSchema>;

export type AgentStatus = "online" | "pending" | "offline";
export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface LoadedAgent {
  manifest: AixManifest;
  hash: string;
  loadedAt: string;
  status: AgentStatus;
  voiceState: VoiceState;
}
