/**
 * @axiom/pi :: SOVEREIGN IDENTITY
 * Pi Network KYC & Domain Claim Adapter
 */

import crypto from 'crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { z } from 'zod';

// --- Schemas ---

export const PiAuthResultSchema = z.object({
  user: z.object({
    uid: z.string().min(3).max(256),
  }),
  accessToken: z.string().min(10).max(8192),
  signature: z.string().min(1).max(4096),
  publicKey: z.string().min(1).max(4096),
});

export const IdentityOptionsSchema = z.object({
  uidSalt: z.string().optional(),
  didAuthority: z.string().default('axiomid.app'),
  assuranceLevel: z.enum(['low', 'substantial', 'high']).default('substantial'),
});

export const PiClaimManifestSchema = z.object({
  id: z.string().startsWith('did:axiom:'),
  domain: z.string(),
  issued_at: z.string(),
  expires_at: z.string().optional(),
  owner_did: z.string().startsWith('did:axiom:'),
  environment: z.enum(['sandbox', 'production']).default('production'),
  nonce: z.string().optional(),
});

// --- Types ---

export type PiAuthResult = z.infer<typeof PiAuthResultSchema>;
export type IdentityOptions = z.infer<typeof IdentityOptionsSchema>;
export type PiClaimManifest = z.infer<typeof PiClaimManifestSchema>;

export interface AxiomIdentity {
  did: string;
  authority: string;
  issuedAt: string;
  publicKey: {
    algorithm: string;
    value: string;
    encoding: string;
    fingerprint: string;
  };
  kycProof: {
    version: string;
    provider: string;
    assuranceLevel: string;
    uidHash: string;
    accessTokenHash: string;
  };
}

export interface PiClaimArtifact {
  manifest: PiClaimManifest;
  signature: string; // base64
  publicKey: string; // base64
  well_known_url?: string;
}

// --- Logic ---

export class AxiomPi {
  /**
   * Generates a random nonce for claims.
   */
  static generateNonce(bytes: number = 16): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generates a Sovereign Identity (did:axiom) from Pi Auth results.
   */
  static generateIdentity(
    auth: unknown,
    options: unknown = {}
  ): AxiomIdentity {
    const validatedAuth = PiAuthResultSchema.parse(auth);
    const validatedOptions = IdentityOptionsSchema.parse(options);

    const { user, accessToken, signature, publicKey } = validatedAuth;

    // 1. Verify Signature
    if (!this.verifySignature(accessToken, signature, publicKey)) {
      throw new Error('[AxiomPi] Invalid signature from Pi Network');
    }

    // 2. Generate Privacy-Preserving UID Hash
    const salt = validatedOptions.uidSalt || process.env.AIX_UID_HASH_SALT || 'SOVEREIGN_DEFAULT_SALT';
    const uidHash = crypto
      .createHash('sha256')
      .update(`${user.uid}:${salt}`)
      .digest('hex')
      .slice(0, 32);

    // 3. Build did:axiom
    const did = `did:axiom:${validatedOptions.didAuthority}:${uidHash}`;
    const timestamp = new Date().toISOString();
    const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    return {
      did,
      authority: validatedOptions.didAuthority,
      issuedAt: timestamp,
      publicKey: {
        algorithm: 'Ed25519',
        value: publicKey,
        encoding: 'base64',
        fingerprint: crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16),
      },
      kycProof: {
        version: '2.0',
        provider: 'pi_network',
        assuranceLevel: validatedOptions.assuranceLevel,
        uidHash,
        accessTokenHash,
      }
    };
  }

  /**
   * Creates a signed Domain Claim artifact for Pi Network Browser.
   */
  static createClaim(
    input: { 
      domain: string; 
      ownerDid: string; 
      environment?: 'sandbox' | 'production';
      nonce?: string;
    },
    privateKeyB64: string
  ): PiClaimArtifact {
    const manifest: PiClaimManifest = {
      id: `did:axiom:${input.domain}:claim`,
      domain: input.domain,
      issued_at: new Date().toISOString(),
      owner_did: input.ownerDid,
      environment: input.environment || 'production',
      nonce: input.nonce || this.generateNonce(),
    };

    const manifestStr = JSON.stringify(manifest);
    const privateKey = naclUtil.decodeBase64(privateKeyB64);
    const publicKey = nacl.sign.keyPair.fromSecretKey(privateKey).publicKey;

    const signature = nacl.sign.detached(naclUtil.decodeUTF8(manifestStr), privateKey);

    return {
      manifest,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(publicKey),
      well_known_url: `https://${input.domain}/.well-known/pi-claim.json`,
    };
  }

  /**
   * Verifies a Domain Claim artifact.
   */
  static verifyClaim(artifact: PiClaimArtifact): boolean {
    try {
      const manifestStr = JSON.stringify(artifact.manifest);
      return this.verifySignature(manifestStr, artifact.signature, artifact.publicKey);
    } catch {
      return false;
    }
  }

  private static verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      const messageUint8 = naclUtil.decodeUTF8(message);
      const signatureUint8 = naclUtil.decodeBase64(signature);
      const publicKeyUint8 = naclUtil.decodeBase64(publicKey);
      return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
    } catch {
      return false;
    }
  }
}

// --- Payment Logic ---

export const PiPaymentSchema = z.object({
  identifier: z.string(),
  amount: z.number(),
  memo: z.string(),
  metadata: z.record(z.any()),
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']),
  txid: z.string().optional(),
});

export type PiPayment = z.infer<typeof PiPaymentSchema>;

export class PiPaymentService {
  private apiUrl: string = "https://api.minepi.com/v2";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Approves a payment on the Pi Platform.
   */
  async approvePayment(paymentId: string): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error("[PiPaymentService] Missing API Key");
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (e) {
      console.error("[PiPaymentService] Approval Error:", e);
      return false;
    }
  }

  /**
   * Completes a payment on the Pi Platform after blockchain confirmation.
   */
  async completePayment(paymentId: string, txid: string): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error("[PiPaymentService] Missing API Key");
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      return response.ok;
    } catch (e) {
      console.error("[PiPaymentService] Completion Error:", e);
      return false;
    }
  }
}
