
import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

/**
 * 🔐 SOVEREIGN_CRYPTO_UTILS
 * The Single Source of Truth for all AIX cryptographic operations.
 * Made with Moe Abdelaziz
 */

export function generateHash(data: unknown): string {
  const hash = createHash('sha256');
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  hash.update(payload);
  return hash.digest('hex');
}

export function verifySignature(
  data: unknown,
  signature: string,
  publicKey: string
): boolean {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const message = util.decodeUTF8(dataString);
    const signatureBytes = Buffer.from(signature, 'hex');
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    
    return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('[Crypto:Sovereign] Signature verification failed');
    return false;
  }
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const pair = nacl.sign.keyPair();
  return {
    publicKey: Buffer.from(pair.publicKey).toString('hex'),
    privateKey: Buffer.from(pair.secretKey).toString('hex')
  };
}

export function signData(data: unknown, privateKey: string): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const message = util.decodeUTF8(dataString);
  const privateKeyBytes = Buffer.from(privateKey, 'hex');
  
  if (privateKeyBytes.length !== 64) {
    throw new Error('Invalid private key length: expected 64 bytes for Ed25519');
  }
  
  const signature = nacl.sign.detached(message, privateKeyBytes);
  return Buffer.from(signature).toString('hex');
}

export function ensureEd25519Key(key: string, type: 'public' | 'private'): void {
  const bytes = Buffer.from(key, 'hex');
  const expectedLength = type === 'public' ? 32 : 64;
  if (bytes.length !== expectedLength) {
    throw new Error(`Expected ed25519 ${type} key of length ${expectedLength} bytes`);
  }
}

export function generateTopologySignature(
  action: string, 
  agentId: string, 
  dataLength: number
): string {
  return createHash('md5')
    .update(`${action}:${agentId.slice(0, 8)}:${dataLength}`)
    .digest('hex');
}

export function verifyPoW(
  agentId: string, 
  nonce: number, 
  difficulty: number, 
  data: string
): boolean {
  const payload = `${agentId}:${nonce}:${data}`;
  const hash = generateHash(payload);
  return hash.startsWith('0'.repeat(difficulty));
}

/**
 * Calculates Shannon Entropy of a string to measure information density.
 */
export function shannonEntropy(str: string): number {
  if (!str) return 0;
  const freq: Record<string, number> = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  return -Object.values(freq).reduce((sum, f) => {
    const p = f / str.length;
    return sum + p * Math.log2(p);
  }, 0);
}
