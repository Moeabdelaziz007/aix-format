import { z } from 'zod';

/**
 * Zod schema for groth16 proof object
 */
export const Groth16ProofSchema = z.object({
  pi_a: z.array(z.string()).length(3),
  pi_b: z.array(z.array(z.string()).length(2)).length(3),
  pi_c: z.array(z.string()).length(2),
  protocol: z.string().optional(),
  curve: z.string().optional(),
});

/**
 * Zod schema for ZKProof input
 */
export const ZKProofSchema = z.object({
  proof: z.any(), // We can further refine this if needed
  publicSignals: z.array(z.string()).min(1),
  nullifier: z.string().regex(/^[0-9a-fA-F]{64}$/, "Nullifier must be a 64-character hexadecimal string"),
  timestamp: z.number().int().positive(),
});

/**
 * Zod schema for IdentityClaims input
 */
export const IdentityClaimsSchema = z.object({
  name: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  jurisdiction: z.string().length(2), // Assuming ISO 3166-1 alpha-2
});

/**
 * Zod schema for pKYCProof input
 */
export const pKYCProofSchema = z.object({
  token: z.string().min(1),
  zkProof: z.string().min(1),
  nullifier: z.string().regex(/^[0-9a-fA-F]{64}$/, "Nullifier must be a 64-character hexadecimal string"),
  publicParams: z.string().min(1),
});

// Made with Moe Abdelaziz
