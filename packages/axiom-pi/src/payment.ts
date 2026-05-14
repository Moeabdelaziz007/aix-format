import { getPiEnv } from './env.js';

export interface PaymentInput {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  identifier: string;
  status: 'completed' | 'cancelled' | 'error';
  txid?: string;
}

/**
 * Creates a Pi Network payment.
 */
export async function createPayment(input: PaymentInput): Promise<PaymentResult> {
  if (typeof window === 'undefined' || !(window as any).Pi) {
    throw new Error('createPayment requires Pi SDK in browser environment');
  }

  const Pi = (window as any).Pi;

  if (input.amount <= 0) {
    return { identifier: 'error-invalid-amount', status: 'error' };
  }

  try {
    const payment = await Pi.createPayment({
      amount: input.amount,
      memo: input.memo,
      metadata: input.metadata || {},
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        // Callback to server for approval
        console.log('Payment ready for server approval:', paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        // Callback to server for completion
        console.log('Payment ready for server completion:', paymentId, txid);
      },
      onCancel: (paymentId: string) => {
        console.log('Payment cancelled:', paymentId);
      },
      onError: (error: any, payment?: any) => {
        console.error('Payment error:', error, payment);
      },
    });

    return {
      identifier: payment.identifier,
      status: 'completed',
    };
  } catch (err: any) {
    if (err.message?.includes('cancelled')) {
      return { identifier: 'cancelled', status: 'cancelled' };
    }
    return { identifier: 'error', status: 'error' };
  }
}
