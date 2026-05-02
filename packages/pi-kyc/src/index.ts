import { z } from 'zod';
import { AIXDocument, ISODateTime } from '@aix/core';
import { createHash } from 'crypto';

/**
 * Pi Network User ID Schema
 */
export const PiUidSchema = z.string().min(10, "Pi UID must be at least 10 characters").regex(/^[a-zA-Z0-9_-]+$/, "Invalid Pi UID format");

export type PiUid = z.infer<typeof PiUidSchema>;

export interface KycOptions {
  agentName: string;
  author: string;
  authority?: 'axiomid.app';
  salt?: string;
}

/**
 * Hashes a Pi UID with a salt for privacy and security
 */
export function hashPiUid(uid: string, salt: string): string {
  return createHash('sha256').update(`${uid}:${salt}`).digest('hex');
}

/**
 * Generates a SHA-256 content hash for an AIX document
 */
export function calculateContentHash(doc: Omit<AIXDocument, 'security'>): string {
  const content = JSON.stringify(doc);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generates an AIX Envelope (Document) based on a Pi Network UID
 */
export async function generateKycEnvelope(piUid: string, options: KycOptions): Promise<AIXDocument> {
  // Validate input
  const validatedUid = PiUidSchema.parse(piUid);
  const salt = options.salt || process.env.AIX_UID_HASH_SALT || 'default-secure-salt';
  
  const hashedUid = hashPiUid(validatedUid, salt);
  const timestamp = new Date().toISOString() as unknown as ISODateTime;

  // Partial document for hash calculation (security layer excluded initially)
  const docBase = {
    meta: {
      version: "1.3.0",
      id: `did:axiom:pi:${hashedUid}`,
      name: options.agentName,
      created: timestamp as string,
      author: options.author,
      description: `Sovereign Agent verified via Pi Network KYC (Hashed UID: ${hashedUid})`,
      framework: "AIX-Sovereign-v1.3"
    },
    persona: {
      role: "Verified Sovereign Agent",
      instructions: "Operate as a verified entity within the Axiom ecosystem."
    },
    identity_layer: {
      id: `did:axiom:pi:${hashedUid}`,
      authority: options.authority || 'axiomid.app',
      issuedAt: timestamp as string
    },
    pi_network: {
      app_id: "axiom-id-primary",
      environment: "production",
      kyc_required: true
    }
  };

  // Calculate integrity hash
  const contentHash = calculateContentHash(docBase);

  const envelope: AIXDocument = {
    ...docBase,
    security: {
      checksum: {
        algorithm: "sha256",
        value: contentHash
      },
      capabilities: {
        allowed_operations: ["identity_verification", "pi_payment_processing"],
        sandbox: true
      }
    }
  };

  return envelope;
}

/**
 * Validates an AIX Envelope's identity layer against a Pi UID
 */
export function verifyEnvelopeIdentity(envelope: AIXDocument, piUid: string, salt: string): boolean {
  const expectedHash = hashPiUid(piUid, salt);
  return envelope.identity_layer.id === `did:axiom:pi:${expectedHash}`;
}
