/**
 * Pi Network payment service.
 * Handles user-to-app and app-to-user payments via the Pi SDK.
 */

export interface PaymentInput {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, paymentId?: string) => void;
}

interface PiPayment {
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
}

/**
 * Create a Pi Network payment from user to app.
 *
 * @param payment - Payment details (amount in Pi, memo, optional metadata)
 * @param callbacks - Lifecycle callbacks for the payment
 * @returns The completed PiPayment object
 */
export async function createPayment(
  payment: PaymentInput,
  callbacks?: Partial<PaymentCallbacks>
): Promise<PiPayment> {
  if (typeof globalThis.window === "undefined") {
    throw new Error("[@axiom/pi] Pi payments require a browser environment (Pi Browser).");
  }

  const Pi = (globalThis.window as Window & { Pi?: import("./auth.js").PiSDK }).Pi;
  if (!Pi) {
    throw new Error("[@axiom/pi] Pi SDK not found. Run in Pi Browser.");
  }

  const defaultCallbacks: PaymentCallbacks = {
    onReadyForServerApproval: (paymentId) => {
      console.log("[@axiom/pi] Payment ready for approval:", paymentId);
    },
    onReadyForServerCompletion: (paymentId, txid) => {
      console.log("[@axiom/pi] Payment completed:", paymentId, txid);
    },
    onCancel: (paymentId) => {
      console.warn("[@axiom/pi] Payment cancelled:", paymentId);
    },
    onError: (error, paymentId) => {
      console.error("[@axiom/pi] Payment error:", error, paymentId);
    },
  };

  const merged = { ...defaultCallbacks, ...callbacks };

  try {
    const result = await Pi.createPayment(
      {
        amount: payment.amount,
        memo: payment.memo,
        metadata: payment.metadata,
      },
      merged
    );
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    merged.onError(err);
    throw err;
  }
}
