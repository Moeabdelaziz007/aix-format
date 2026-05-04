export interface IdentityLayer {
    id: string;
    provider: {
        type: string;
        name: string;
        authority: string;
    };
    verification: {
        status: string;
        trust_level: number;
        provider_specific_tier: string;
    };
    issuedAt: string;
    expiresAt?: string;
    publicKey?: {
        algorithm: string;
        value: string;
        encoding?: string;
    };
    signature?: {
        algorithm: string;
        value: string;
        canonicalization?: string;
    };
    dna_hash?: string;
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
}
export interface ProviderResult {
    uid: string;
    provider: 'pi_network' | 'world_id' | 'ens' | 'custom';
    accessToken: string;
    signature?: string;
    publicKey?: string;
    metadata?: Record<string, any>;
}
export interface AdapterOptions {
    uidSalt?: string;
    didMethod?: string;
    didAuthority?: string;
    minTrustLevel?: number;
}
/**
 * IdentityAdapter - Multi-provider abstraction for AIX Identity Layer.
 * Resolves Pattern 4 (Single Point of Failure) by decoupling from Pi Network.
 */
export declare class IdentityAdapter {
    /**
     * Generates a standardized AIX Identity Layer from a provider result.
     */
    static generateIdentity(result: ProviderResult, options?: AdapterOptions): Promise<{
        identity_layer: IdentityLayer;
        kyc_proof: KycProof;
    }>;
    /**
     * Extensible verification logic.
     */
    private static verifyProvider;
    /**
     * Map provider specific status to normalized trust levels (0-3).
     */
    private static calculateTrustLevel;
}
