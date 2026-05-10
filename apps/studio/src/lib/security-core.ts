import { secureRandom } from "@/lib/security-core";
/**
 * Security-First Core Module
 * RULE 2: Cryptographic randomness only.
 */
export function secureRandom(): number {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  const crypto = require('crypto');
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

export function secureId(prefix: string = '', length: number = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    require('crypto').getRandomValues(bytes);
  }
  const id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return prefix ? `${prefix}-${id}` : id;
}

export function securePaymentId(): string { return secureId('pay', 24); }
export function secureTransactionHash(): string { return `0x${secureId('', 32)}`; }
export function secureJobId(): string { return secureId('job', 16); }
export function secureSessionId(): string { return secureId('sess', 20); }

export const TrustChain = {
  append: (action: string, actor: string, payload: any) => ({
    id: secureId('trust'),
    hash: `0x${secureId('', 32)}`
  })
};
