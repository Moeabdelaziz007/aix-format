/**
 * Pi Network Connect Flow (T-F1)
 * Implements E2E authentication flow using Pi SDK.
 * Ref: RFC Pi-Connect-001
 */

export interface PiUser {
  uid: string;
  username: string;
}

export interface PiAuthResponse {
  accessToken: string;
  user: PiUser;
}

export class PiConnectFlow {
  private static sdkInitialized = false;

  /**
   * Initializes the Pi SDK safely.
   * Ensures it only runs in the Pi Browser environment.
   */
  static async initSDK(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    // Check if Pi SDK is loaded via <script> tag
    if (!(window as any).Pi) {
      console.warn('[Pi-Connect] Pi SDK not found. Please ensure you are in the Pi Browser.');
      return false;
    }

    try {
      await (window as any).Pi.init({ version: '2.0', sandbox: process.env.NODE_ENV !== 'production' });
      this.sdkInitialized = true;
      return true;
    } catch (error) {
      console.error('[Pi-Connect] Failed to initialize Pi SDK:', error);
      return false;
    }
  }

  /**
   * Triggers the "Connect Pi" auth flow.
   */
  static async authenticate(): Promise<PiAuthResponse> {
    if (!this.sdkInitialized) {
      const ok = await this.initSDK();
      if (!ok) throw new Error('Pi SDK not available');
    }

    const scopes = ['username', 'payments']; // Standard scopes
    
    return new Promise((resolve, reject) => {
      (window as any).Pi.authenticate(scopes, (onIncompletePayment: any) => {
        // Handle incomplete payments if necessary (hidden pattern)
        console.log('[Pi-Connect] Incomplete payment detected:', onIncompletePayment);
      })
      .then((auth: PiAuthResponse) => {
        console.log('[Pi-Connect] Authenticated successfully:', auth.user.username);
        resolve(auth);
      })
      .catch((error: any) => {
        console.error('[Pi-Connect] Authentication failed:', error);
        reject(error);
      });
    });
  }

  /**
   * Sends the token to the backend for verification (Double-Check pattern).
   */
  static async verifyOnBackend(auth: PiAuthResponse): Promise<boolean> {
    try {
      const response = await fetch('/api/pi/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: auth.accessToken, uid: auth.user.uid }),
      });
      return response.ok;
    } catch (error) {
      console.error('[Pi-Connect] Backend verification failed:', error);
      return false;
    }
  }
}
