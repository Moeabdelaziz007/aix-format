import { canonicalizeForSigning } from '../../../core/canonicalize.js';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import crypto from 'crypto';

export function generateDNAFingerprint(manifest: any): string {
    const { canonicalString } = canonicalizeForSigning(manifest);
    const hash = crypto.createHash('sha256').update(canonicalString).digest('hex');

    // Generate a new ed25519 keypair for the agent's DNA
    const keyPair = nacl.sign.keyPair();
    const signature = nacl.sign.detached(util.decodeUTF8(hash), keyPair.secretKey);
    const signatureHex = Buffer.from(signature).toString('hex');

    return `${hash}:${signatureHex}`;
}
