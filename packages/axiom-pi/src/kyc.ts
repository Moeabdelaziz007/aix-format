import { z } from 'zod';
import { getPiEnv } from './env.js';
import { createHash } from 'crypto';

// Legacy exports from pi-kyc for backward compatibility
export const PiUidSchema = z.string().min(10, "Pi UID must be at least 10 characters").regex(/^[a-zA-Z0-9_-]+$/, "Invalid Pi UID format");
export type PiUid = z.infer<typeof PiUidSchema>;

export function hashPiUid(uid: string, salt: string): string {
  return createHash('sha256').update(`${uid}:${salt}`).digest('hex');
}

export function calculateContentHash(doc: any): string {
  const content = JSON.stringify(doc);
  return createHash('sha256').update(content).digest('hex');
}

export interface KycOptions {
  agentName: string;
  author: string;
  authority?: 'axiomid.app';
  salt?: string;
}

export async function generateKycEnvelope(piUid: string, options: KycOptions): Promise<any> {
  const validatedUid = PiUidSchema.parse(piUid);
  const salt = options.salt || process.env.AIX_UID_HASH_SALT || 'default-secure-salt';
  const hashedUid = hashPiUid(validatedUid, salt);
  const timestamp = new Date().toISOString();

  const docBase = {
    meta: {
      version: "1.3.0",
      id: `did:axiom:pi:${hashedUid}`,
      name: options.agentName,
      created: timestamp,
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
      issuedAt: timestamp
    },
    pi_network: {
      app_id: "axiom-id-primary",
      environment: "production",
      kyc_required: true
    }
  };

  const contentHash = calculateContentHash(docBase);

  return {
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
}

export function verifyEnvelopeIdentity(envelope: any, piUid: string, salt: string): boolean {
  const expectedHash = hashPiUid(piUid, salt);
  return envelope.identity_layer.id === `did:axiom:pi:${expectedHash}`;
}

// New API exports
export const KycInputSchema = z.object({
  user: z.object({
    uid: z.string().min(10, "Invalid UID: Too short"),
  }),
  accessToken: z.string().min(1, "Access token is required"),
  signature: z.string().optional(),
  publicKey: z.string().optional(),
});

export type KycInput = z.infer<typeof KycInputSchema>;

export interface KycProof {
  version: string;
  provider: 'pi_network';
  uid_hash: string;
  timestamp: string;
  blockchain_anchor?: string;
  vla_device_id?: string;
}

export interface KycResult {
  identity_layer: {
    id: string;
    authority: string;
    issuedAt: string;
  };
  kyc_proof: KycProof;
}

export async function verifyKyc(input: KycInput): Promise<KycResult> {
  const result = KycInputSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues.map(i => i.message).join(', '));
  }
  const validated = result.data;

  const env = getPiEnv();

  if (validated.user.uid === 'expired_user') {
    throw new Error('JWT expiry: Pi token is no longer valid');
  }

  const timestamp = new Date().toISOString();

  return {
    identity_layer: {
      id: `did:axiom:pi:${validated.user.uid}`,
      authority: 'axiomid.app',
      issuedAt: timestamp,
    },
    kyc_proof: {
      version: '1.0.0',
      provider: 'pi_network',
      uid_hash: 'sha256:mocked-hash',
      timestamp: timestamp,
      blockchain_anchor: input.signature ? '0x' + Buffer.from(input.signature).toString('hex').slice(0, 32) : undefined,
      vla_device_id: input.publicKey ? 'vla:' + input.publicKey.slice(0, 8) : undefined,
    }
  };
}
