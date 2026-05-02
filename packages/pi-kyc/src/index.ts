import { z } from 'zod';
import { AIXDocument, ISODateTime } from '@aix/core';

/**
 * Pi Network User ID Schema
 * Typically a UUID or a specific alphanumeric string from Pi SDK
 */
export const PiUidSchema = z.string().min(10, "Pi UID must be at least 10 characters").regex(/^[a-zA-Z0-9_-]+$/, "Invalid Pi UID format");

export type PiUid = z.infer<typeof PiUidSchema>;

export interface KycOptions {
  agentName: string;
  author: string;
  authority?: 'axiomid.app';
}

/**
 * Generates an AIX Envelope (Document) based on a Pi Network UID
 * This links the sovereign identity of the agent to the Pi Network account.
 */
export async function generateKycEnvelope(piUid: string, options: KycOptions): Promise<AIXDocument> {
  // Validate input
  const validatedUid = PiUidSchema.parse(piUid);

  const timestamp = new Date().toISOString() as unknown as ISODateTime;

  // Create the AIX Document structure
  const envelope: AIXDocument = {
    meta: {
      version: "1.3.0",
      id: `did:axiom:pi:${validatedUid}`,
      name: options.agentName,
      created: timestamp as string,
      author: options.author,
      description: `Sovereign Agent verified via Pi Network KYC (UID: ${validatedUid})`,
      framework: "AIX-Sovereign-v1.3"
    },
    persona: {
      role: "Verified Sovereign Agent",
      instructions: "Operate as a verified entity within the Axiom ecosystem."
    },
    security: {
      checksum: {
        algorithm: "sha256",
        value: "pending" // In a real scenario, we'd calculate this after finalizing content
      },
      capabilities: {
        allowed_operations: ["identity_verification", "pi_payment_processing"],
        sandbox: true
      }
    },
    identity_layer: {
      id: `did:axiom:pi:${validatedUid}`,
      authority: options.authority || 'axiomid.app',
      issuedAt: timestamp as string
    },
    pi_network: {
      app_id: "axiom-id-primary", // Default app ID
      environment: "production",
      kyc_required: true
    }
  };

  return envelope;
}

/**
 * Validates an AIX Envelope's identity layer against a Pi UID
 */
export function verifyEnvelopeIdentity(envelope: AIXDocument, piUid: string): boolean {
  return envelope.identity_layer.id === `did:axiom:pi:${piUid}`;
}
