/**
 * Pi Network SDK authentication wrapper.
 * Works in browser (Pi SDK) and server (bypass) environments.
 */

export interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
}

export interface PiSDK {
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void
  ) => Promise<{ user: { uid: string; username: string }; accessToken: string }>;
  createPayment: (
    payment: { amount: number; memo: string; metadata?: Record<string, unknown> },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, paymentId?: string) => void;
    }
  ) => Promise<{
    identifier: string;
    amount: number;
    memo: string;
    metadata?: Record<string, unknown>;
    status: {
      developer_approved?: boolean;
      transaction_verified?: boolean;
      developer_completed?: boolean;
      cancelled?: boolean;
      user_cancelled?: boolean;
    };
    transaction: {
      txid: string;
      type: string;
      amount: number;
    } | null;
  }>;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

/**
 * Default handler for incomplete payments.
 * Logs the payment identifier for manual resolution.
 */
function onIncompletePaymentFound(payment: unknown): void {
  const p = payment as { identifier?: string };
  console.warn("[@axiom/pi] Incomplete payment detected:", p?.identifier ?? "unknown");
}

/**
 * Authenticate a user via the Pi Network SDK.
 *
 * @param scopes - Permission scopes (default: ['payments', 'username'])
 * @returns PiUser with uid, username, and access token
 */
export async function authenticateUser(
  scopes: string[] = ["payments", "username"]
): Promise<PiUser> {
  if (typeof globalThis.window === "undefined") {
    console.log("[@axiom/pi] Running in server/Node mode. Bypassing Pi SDK.");
    return { uid: "SYSTEM_ROOT", username: "system", accessToken: "n/a" };
  }

  const Pi = (globalThis.window as Window).Pi;
  if (!Pi) {
    throw new Error("[@axiom/pi] Pi Network SDK not found. Are you running in Pi Browser?");
  }

  const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
  return {
    uid: auth.user.uid,
    username: auth.user.username,
    accessToken: auth.accessToken,
  };
}
