/**
 * Pi Network KYC Adapter (TypeScript + Zod)
 * Secure, type-safe KYC verification with privacy-preserving identity generation
 */

import crypto from 'crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { z } from 'zod';

// ─── Zod Validation Schemas ───────────────────────────────

const PiAuthResultSchema = z.object({
  user: z.object({
    uid: z.string().min(3).max(256),
  }),
  accessToken: z.string().min(10).max(8192),
  signature: z.string().min(1).max(4096),
  publicKey: z.string().min(1).max(4096),
  vlaDevice: z.object({
    adapter: z.string().optional(),
    id: z.string().optional(),
  }).optional(),
});

const AdapterOptionsSchema = z.object({
  uidSalt: z.string().optional(),
  didMethod: z.string().optional(),
  didAuthority: z.string().optional(),
  assuranceLevel: z.enum(['low', 'substantial', 'high']).optional(),
  minAssuranceLevel: z.enum(['low', 'substantial', 'high']).optional(),
  enforceJwtExpiry: z.boolean().optional(),
  enforceJwtAlg: z.boolean().optional(),
  allowedJwtAlgs: z.array(z.string()).optional(),
  challengeNonce: z.string().optional(),
  blockchainAnchor: z.object({
    chain: z.string(),
    txid: z.string(),
    blockHeight: z.number().optional(),
    anchoredAt: z.string().optional(),
  }).optional(),
});

// ─── TypeScript Types ───────────────────────────────

export type PiAuthResult = z.infer<typeof PiAuthResultSchema>;
export type AdapterOptions = z.infer<typeof AdapterOptionsSchema>;

export interface IdentityLayer {
  id: string;
  authority: string;
  issuedAt: string;
  publicKey: {
    algorithm: string;
    value: string;
    encoding: string;
    fingerprint: string;
  };
}

export interface KycProof {
  version: string;
  provider: string;
  assurance_level: string;
  uid_hash: string;
  uid_hash_algorithm: string;
  uid_hash_salted: boolean;
  verified_at: string;
  access_token_hash: string;
  challenge_binding_hash?: string;
  blockchain_anchor?: {
    chain: string;
    txid: string;
    block_height?: number;
    anchored_at: string;
    anchor_hash: string;
  };
  vla_device_registry?: {
    adapter: string;
    hardware_id: string;
  };
}

export interface GenerateIdentityResult {
  identity_layer: IdentityLayer;
  kyc_proof: KycProof;
}

// ─── PiKycAdapter Class ───────────────────────────────

export class PiKycAdapter {
  /**
   * Verify Pi KYC proof and generate an identity layer and KYC proof.
   * 
   * @throws {Error} If validation fails or signature is invalid
   */
  static generateIdentity(
    piAuthResult: unknown,
    options: unknown = {}
  ): GenerateIdentityResult {
    // Validate inputs with Zod
    const validatedResult = PiAuthResultSchema.parse(piAuthResult);
    const validatedOptions = AdapterOptionsSchema.parse(options);

    const { user, accessToken, signature, publicKey } = validatedResult;

    // Validate base64 encoding
    if (!PiKycAdapter.isValidBase64(signature) || !PiKycAdapter.isValidBase64(publicKey)) {
      throw new Error('Invalid Pi Auth Result: signature/publicKey must be valid base64');
    }

    // Verify the signature
    const isValid = PiKycAdapter.verifySignature(accessToken, signature, publicKey);
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const normalizedUid = user.uid.trim();
    const normalizedToken = accessToken.trim();

    // JWT validation
    PiKycAdapter.validateJwtTimestamps(normalizedToken, validatedOptions);
    PiKycAdapter.validateJwtHeader(normalizedToken, validatedOptions);

    // Generate privacy-preserving UID hash (salted when configured)
    const uidSalt = validatedOptions.uidSalt || process.env.AIX_UID_HASH_SALT || '';
    const uidHash = crypto
      .createHash('sha256')
      .update(`${normalizedUid}:${uidSalt}`)
      .digest('hex')
      .slice(0, 32);

    // Generate SHA-256 hash of the access token
    const accessTokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex');
    
    // Optional challenge binding
    const challengeBinding = validatedOptions.challengeNonce
      ? crypto
          .createHash('sha256')
          .update(`${normalizedToken}:${validatedOptions.challengeNonce}`)
          .digest('hex')
      : undefined;

    const didMethod = validatedOptions.didMethod || 'did:axiom';
    const didAuthority = validatedOptions.didAuthority || 'axiomid.app';
    const did = PiKycAdapter.buildDid(didMethod, didAuthority, uidHash);
    const timestamp = new Date().toISOString();

    const identity_layer: IdentityLayer = {
      id: did,
      authority: didAuthority,
      issuedAt: timestamp,
      publicKey: {
        algorithm: 'Ed25519',
        value: publicKey,
        encoding: 'base64',
        fingerprint: crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16),
      },
    };

    const kyc_proof: KycProof = {
      version: '2.0',
      provider: 'pi_network',
      assurance_level: validatedOptions.assuranceLevel || 'substantial',
      uid_hash: uidHash,
      uid_hash_algorithm: 'sha256',
      uid_hash_salted: Boolean(uidSalt),
      verified_at: timestamp,
      access_token_hash: accessTokenHash,
      challenge_binding_hash: challengeBinding,
    };

    // Enforce assurance policy
    PiKycAdapter.enforceAssurancePolicy(kyc_proof.assurance_level, validatedOptions);

    // Optional blockchain anchor
    if (validatedOptions.blockchainAnchor) {
      kyc_proof.blockchain_anchor = PiKycAdapter.buildBlockchainAnchor(
        validatedOptions.blockchainAnchor,
        accessTokenHash,
        timestamp
      );
    }

    // Optional VLA device registry
    if (validatedResult.vlaDevice) {
      kyc_proof.vla_device_registry = {
        adapter: validatedResult.vlaDevice.adapter || 'generic',
        hardware_id: validatedResult.vlaDevice.id || 'unknown',
      };
    }

    return { identity_layer, kyc_proof };
  }

  /**
   * Verify signature using NaCl (Ed25519)
   */
  private static verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const messageUint8 = naclUtil.decodeUTF8(message);
      const signatureUint8 = naclUtil.decodeBase64(signature);
      const publicKeyUint8 = naclUtil.decodeBase64(publicKey);

      if (publicKeyUint8.length !== nacl.sign.publicKeyLength) {
        throw new Error('Invalid public key size');
      }
      if (signatureUint8.length !== nacl.sign.signatureLength) {
        throw new Error('Invalid signature size');
      }

      return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
    } catch (error) {
      throw new Error('Signature verification failed: malformed signature payload');
    }
  }

  /**
   * Build DID (Decentralized Identifier)
   */
  static buildDid(method: string, authority: string, subject: string): string {
    if (method === 'did:web') return `did:web:${authority}:${subject}`;
    return `${method}:${authority}:${subject}`;
  }

  /**
   * Validate JWT timestamps (exp, nbf)
   */
  static validateJwtTimestamps(token: string, options: AdapterOptions): void {
    if (!options.enforceJwtExpiry) return;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid Pi Auth Result: JWT format required when enforceJwtExpiry is enabled');
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      if (typeof payload.exp === 'number' && payload.exp < now) {
        throw new Error('JWT has expired');
      }
      if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
        throw new Error('JWT not active yet');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'JWT has expired' || err.message === 'JWT not active yet') {
          throw err;
        }
      }
      throw new Error('Invalid Pi Auth Result: unable to parse JWT payload timestamps');
    }
  }

  /**
   * Validate JWT header (algorithm)
   */
  static validateJwtHeader(token: string, options: AdapterOptions): void {
    if (!options.enforceJwtAlg) return;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid JWT format for header validation');
    }

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const allowed = options.allowedJwtAlgs || ['EdDSA'];

      if (!allowed.includes(header.alg)) {
        throw new Error(`JWT signing algorithm '${header.alg}' is not allowed`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('not allowed')) {
        throw err;
      }
      throw new Error('Invalid Pi Auth Result: unable to parse JWT header');
    }
  }

  /**
   * Enforce minimum assurance level policy
   */
  static enforceAssurancePolicy(level: string, options: AdapterOptions): void {
    if (!options.minAssuranceLevel) return;

    const order = ['low', 'substantial', 'high'];
    const currentIndex = order.indexOf(level);
    const requiredIndex = order.indexOf(options.minAssuranceLevel);

    if (currentIndex < requiredIndex) {
      throw new Error(
        `Insufficient assurance level: required ${options.minAssuranceLevel}, got ${level}`
      );
    }
  }

  /**
   * Build blockchain anchor proof
   */
  static buildBlockchainAnchor(
    anchor: NonNullable<AdapterOptions['blockchainAnchor']>,
    accessTokenHash: string,
    timestamp: string
  ): KycProof['blockchain_anchor'] {
    return {
      chain: anchor.chain,
      txid: anchor.txid,
      block_height: anchor.blockHeight,
      anchored_at: anchor.anchoredAt || timestamp,
      anchor_hash: crypto
        .createHash('sha256')
        .update(`${anchor.chain}:${anchor.txid}:${accessTokenHash}`)
        .digest('hex'),
    };
  }

  /**
   * Validate base64 encoding
   */
  static isValidBase64(value: string): boolean {
    if (typeof value !== 'string' || value.length === 0 || value.length > 4096) {
      return false;
    }
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
  }
}

// Made with Moe Abdelaziz

// Made with Moe Abdelaziz
