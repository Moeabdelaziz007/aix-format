export interface PiUser {
    uid: string;
    username?: string;
}
export interface PiAuthResult {
    user: PiUser;
    accessToken: string;
    signature: string;
    publicKey: string;
    vlaDevice?: {
        adapter?: string;
        id?: string;
    };
}
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
export interface PiKycOptions {
    uidSalt?: string;
    didMethod?: 'did:axiom' | 'did:web';
    didAuthority?: string;
    assuranceLevel?: 'low' | 'substantial' | 'high';
    minAssuranceLevel?: 'low' | 'substantial' | 'high';
    enforceJwtExpiry?: boolean;
    enforceJwtAlg?: boolean;
    allowedJwtAlgs?: string[];
    challengeNonce?: string;
    blockchainAnchor?: {
        chain: string;
        txid: string;
        blockHeight?: number;
        anchoredAt?: string;
    };
}
export interface KycResponse {
    identity_layer: IdentityLayer;
    kyc_proof: KycProof;
}
export declare class PiKycAdapter {
    /**
     * Verify Pi KYC proof and generate an identity layer and KYC proof.
     */
    static generateIdentity(piAuthResult: PiAuthResult, options?: PiKycOptions): KycResponse;
    static buildDid(method: string, authority: string, subject: string): string;
    static validateJwtTimestamps(token: string, options?: PiKycOptions): void;
    static validateJwtHeader(token: string, options?: PiKycOptions): void;
    static enforceAssurancePolicy(level: string, options?: PiKycOptions): void;
    static buildBlockchainAnchor(anchor: PiKycOptions['blockchainAnchor'], accessTokenHash: string, timestamp: string): any;
    static isValidBase64(value: string): boolean;
}
