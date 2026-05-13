/**
 * Pi Network KYC Adapter (TypeScript + Zod)
 * Secure, type-safe KYC verification with privacy-preserving identity generation
 */
import { z } from 'zod';
declare const PiAuthResultSchema: any;
declare const AdapterOptionsSchema: any;
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
export declare class PiKycAdapter {
    /**
     * Verify Pi KYC proof and generate an identity layer and KYC proof.
     *
     * @throws {Error} If validation fails or signature is invalid
     */
    static generateIdentity(piAuthResult: unknown, options?: unknown): GenerateIdentityResult;
    /**
     * Verify signature using NaCl (Ed25519)
     */
    private static verifySignature;
    /**
     * Build DID (Decentralized Identifier)
     */
    static buildDid(method: string, authority: string, subject: string): string;
    /**
     * Validate JWT timestamps (exp, nbf)
     */
    static validateJwtTimestamps(token: string, options: AdapterOptions): void;
    /**
     * Validate JWT header (algorithm)
     */
    static validateJwtHeader(token: string, options: AdapterOptions): void;
    /**
     * Enforce minimum assurance level policy
     */
    static enforceAssurancePolicy(level: string, options: AdapterOptions): void;
    /**
     * Build blockchain anchor proof
     */
    static buildBlockchainAnchor(anchor: NonNullable<AdapterOptions['blockchainAnchor']>, accessTokenHash: string, timestamp: string): KycProof['blockchain_anchor'];
    /**
     * Validate base64 encoding
     */
    static isValidBase64(value: string): boolean;
}
export {};
