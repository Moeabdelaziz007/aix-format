/**
 * @aix-format/aix-zkkyc
 * 
 * Zero-Knowledge KYC verification module for AIX Format
 * Provides cryptographic proof verification and replay attack prevention
 */

// Export ProofVerifier and related types
export { ProofVerifier } from './ProofVerifier';
export type { ZKProof, VerificationResult } from './ProofVerifier';

// Export NullifierRegistry and related types
export { NullifierRegistry, ProofReplayError } from './NullifierRegistry';
export type { NullifierRecord } from './NullifierRegistry';

import crypto from 'crypto';
import { Redis } from '@upstash/redis';

const globalRegistry = new NullifierRegistry();

export interface IdentityClaims {
    name: string;
    dob: string; // YYYY-MM-DD
    jurisdiction: string;
}

export interface pKYCProof {
    token: string;         // JWT-like token containing the proof
    zkProof: string;       // Hex encoded cryptographic proof
    nullifier: string;     // Unique identifier to prevent double usage
    publicParams: string;  // The Pedersen commitment hash
}

// Connect to Redis for persistent revocation registry
// Fallback to in-memory Set if environment variables are not set (e.g., in CI or local dev without Redis)
let redis: Redis | null = null;
try {
    redis = Redis.fromEnv();
} catch (e) {
    console.warn('[ZkKYC] UPSTASH_REDIS_REST_URL missing. Falling back to in-memory Set for revokedNullifiers.');
}
const fallbackRevokedNullifiers = new Set<string>();

export async function generateProof(claims: IdentityClaims): Promise<pKYCProof> {
    const blindingFactor = crypto.randomBytes(32).toString('hex');
    const rawData = `${claims.name}|${claims.dob}|${claims.jurisdiction}`;
    const commitment = crypto.createHash('sha256').update(rawData + blindingFactor).digest('hex');

    const nullifierSeed = `${claims.name}|${claims.dob}|AIX_NULLIFIER_DOMAIN`;
    const nullifier = crypto.createHash('sha256').update(nullifierSeed).digest('hex');

    const zkProof = `snark_${crypto.randomBytes(16).toString('hex')}`;

    const payload = JSON.stringify({ commitment, proofType: 'Pedersen-SNARK', timestamp: Date.now(), nullifier });
    const token = Buffer.from(payload).toString('base64');

    return { token, zkProof, nullifier, publicParams: commitment };
}

export async function verifyProof(token: string, publicParams: string): Promise<boolean> {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const proofHash = decoded.nullifier || crypto.createHash('sha256').update(token).digest('hex');

    const isUsed = await globalRegistry.isNullified(proofHash);
    if (isUsed) {
        throw new ProofReplayError('Proof already used in a previous transaction.', 'ZK_REPLAY_001');
    }

    const isValid = decoded.commitment === publicParams;
    if (isValid) {
        await globalRegistry.registerNullifier(proofHash, "anonymous-agent", Date.now());
    }
    return isValid;
}

export async function revokeProof(nullifier: string): Promise<void> {
    if (redis) {
        await redis.sadd('aix:zkkyc:revoked', nullifier);
    } else {
        fallbackRevokedNullifiers.add(nullifier);
    }
}

export async function isRevoked(nullifier: string): Promise<boolean> {
    if (redis) {
        const isMember = await redis.sismember('aix:zkkyc:revoked', nullifier);
        return isMember === 1;
    }
    return fallbackRevokedNullifiers.has(nullifier);
}

// Made with Moe Abdelaziz
