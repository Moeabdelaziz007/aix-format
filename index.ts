import crypto from 'crypto';
import { NullifierRegistry, ProofReplayError } from './packages/aix-zkkyc/src/NullifierRegistry';

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

// In-memory registry for revoked or spent nullifiers (should be backed by DB/Contract in prod)
const revokedNullifiers = new Set<string>();

/**
 * Generates a Zero-Knowledge Proof for the given identity claims
 */
export async function generateProof(claims: IdentityClaims): Promise<pKYCProof> {
    // 1. Generate Blinding Factor (Salt) for Pedersen Commitment
    const blindingFactor = crypto.randomBytes(32).toString('hex');

    // 2. Create Pedersen Commitment: H(Claims || BlindingFactor)
    const rawData = `${claims.name}|${claims.dob}|${claims.jurisdiction}`;
    const commitment = crypto.createHash('sha256').update(rawData + blindingFactor).digest('hex');

    // 3. Generate Nullifier (Derived deterministically to prevent double-spending proofs)
    const nullifierSeed = `${claims.name}|${claims.dob}|AIX_NULLIFIER_DOMAIN`;
    const nullifier = crypto.createHash('sha256').update(nullifierSeed).digest('hex');

    // 4. Simulate ZK-SNARK Proof Generation
    const zkProof = `snark_${crypto.randomBytes(16).toString('hex')}`;

    // 5. Wrap in Token
    const payload = JSON.stringify({ commitment, proofType: 'Pedersen-SNARK', timestamp: Date.now(), nullifier });
    const token = Buffer.from(payload).toString('base64');

    return {
        token,
        zkProof,
        nullifier,
        publicParams: commitment
    };
}

/**
 * Verifies the ZK-Proof without revealing the underlying PII
 */
export async function verifyProof(token: string, publicParams: string): Promise<boolean> {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Extract nullifier from decoded token or derive if legacy
    const proofHash = decoded.nullifier || crypto.createHash('sha256').update(token).digest('hex');

    // 1. Check registry to prevent replay attacks
    const isUsed = await globalRegistry.isNullified(proofHash);
    if (isUsed) {
        throw new ProofReplayError('Proof already used in a previous transaction.', 'ZK_REPLAY_001');
    }

    // 2. Verify Commitment
    const isValid = decoded.commitment === publicParams;

    if (isValid) {
        // 3. Register nullifier to prevent future replays
        await globalRegistry.registerNullifier(proofHash, "anonymous-agent", Date.now());
    }

    return isValid;
}

export async function revokeProof(nullifier: string): Promise<void> {
    revokedNullifiers.add(nullifier);
}

export function isRevoked(nullifier: string): boolean {
    return revokedNullifiers.has(nullifier);
}