import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPayment } from '../src/payment.js';

describe('payment', () => {
  beforeEach(() => {
    (global as any).window = {
      Pi: {
        createPayment: vi.fn()
      }
    };
  });

  it('should create payment successfully', async () => {
    (global as any).window.Pi.createPayment.mockResolvedValue({
      identifier: 'pay-123'
    });

    const result = await createPayment({ amount: 1, memo: 'Test' });
    expect(result.status).toBe('completed');
    expect(result.identifier).toBe('pay-123');
  });

  it('should handle payment cancellation', async () => {
    (global as any).window.Pi.createPayment.mockRejectedValue(new Error('User cancelled the payment'));

    const result = await createPayment({ amount: 1, memo: 'Test' });
    expect(result.status).toBe('cancelled');
  });

  it('should handle payment error', async () => {
    (global as any).window.Pi.createPayment.mockRejectedValue(new Error('Network error'));

    const result = await createPayment({ amount: 1, memo: 'Test' });
    expect(result.status).toBe('error');
  });

  it('should return error for invalid amount', async () => {
    const result = await createPayment({ amount: -1, memo: 'Test' });
    expect(result.status).toBe('error');
  });
});
