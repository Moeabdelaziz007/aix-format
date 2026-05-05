
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
