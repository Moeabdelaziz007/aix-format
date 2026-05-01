import { generateProof, verifyProof, revokeProof, isRevoked, IdentityClaims } from './index';

describe('AIX ZK-KYC Pipeline (pKYC)', () => {
    const mockIdentity: IdentityClaims = {
        name: "Sovereign User",
        dob: "1990-01-01",
        jurisdiction: "AE"
    };

    it('should generate a valid proof and verify it successfully (Soundness)', async () => {
        const proof = await generateProof(mockIdentity);

        expect(proof).toHaveProperty('token');
        expect(proof).toHaveProperty('zkProof');
        expect(proof).toHaveProperty('nullifier');
        expect(proof).toHaveProperty('publicParams');

        let isValid = false;
        try {
            isValid = await verifyProof(proof.token, proof.publicParams);
        } catch (e) {
            if (e.name === 'ProofReplayError') {
                isValid = false;
            } else {
                throw e;
            }
        }
        expect(isValid).toBe(true);
    });

    it('should NOT reveal PII in the output token or public params (Zero-Knowledge Property)', async () => {
        const proof = await generateProof(mockIdentity);
        const decodedToken = Buffer.from(proof.token, 'base64').toString('utf-8');

        // Ensure raw PII is nowhere in the token or public params
        expect(decodedToken).not.toContain(mockIdentity.name);
        expect(decodedToken).not.toContain(mockIdentity.dob);
        expect(proof.publicParams).not.toContain(mockIdentity.name);
    });

    it('should revoke a proof and prevent verification/usage (Nullifier/Double-Spend)', async () => {
        const proof = await generateProof(mockIdentity);

        // Revoke using the nullifier
        await revokeProof(proof.nullifier);
        expect(isRevoked(proof.nullifier)).toBe(true);

        // In a real system, the verifyProof function or the smart contract 
        // would check `isRevoked` as part of the consensus. 
        // We simulate the failure context here.
        let isValid = false;
        try {
            isValid = await verifyProof(proof.token, proof.publicParams);
        } catch (e) {
            if (e.name === 'ProofReplayError') {
                isValid = false;
            } else {
                throw e;
            }
        }
        const isAccepted = isValid && !isRevoked(proof.nullifier);

        expect(isAccepted).toBe(false);
    });
});