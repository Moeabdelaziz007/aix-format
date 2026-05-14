import { getPiEnv } from './env.js';

export interface PiUser {
  uid: string;
  username: string;
}

export interface AuthResult {
  user: PiUser;
  accessToken: string;
}

/**
 * Authenticates a user with Pi Network.
 * Supports both browser (SDK) and server (Direct API) modes.
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments']): Promise<AuthResult> {
  // Detection for browser vs server
  if (typeof window !== 'undefined' && (window as any).Pi) {
    // Browser mode via Pi SDK
    try {
      const auth = await (window as any).Pi.authenticate(scopes, (onIncompletePaymentFound: any) => {
        console.warn('Incomplete payment found:', onIncompletePaymentFound);
      });
      return {
        user: auth.user,
        accessToken: auth.accessToken,
      };
    } catch (err: any) {
      throw new Error(`Pi Browser Auth Failed: ${err.message}`);
    }
  } else {
    // Server mode or missing SDK
    // Typically server-side doesn't "authenticate" the user directly but verifies tokens
    // For the purpose of this module, we assume we might need to fetch something or just throw if not configured
    const env = getPiEnv();
    if (!env.PI_API_KEY) {
      throw new Error('Server-side authentication requires PI_API_KEY');
    }

    throw new Error('authenticateUser is primarily a client-side operation. Use verifyKyc on server-side.');
  }
}
