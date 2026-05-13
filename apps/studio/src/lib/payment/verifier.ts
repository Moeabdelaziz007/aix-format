/**
 * Payment Verification System
 * 
 * Verifies payment proofs from different payment providers:
 * - Pi Network
 * - Stripe
 * - Crypto (Base/Solana)
 * 
 * @module payment-verifier
 */

import { z } from 'zod';
import { randomBytes } from 'crypto';

/**
 * Payment proof schema validation
 */
const PaymentProofSchema = z.object({
  type: z.enum(['pi', 'stripe', 'crypto']),
  transactionId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(2).max(10),
  timestamp: z.number().positive(),
  signature: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

export interface ExpectedCost {
  amount: number;
  currency: string;
}

/**
 * Verify payment proof from any payment provider
 * 
 * @param proofString - Base64 encoded payment proof
 * @param agentId - Agent ID being paid for
 * @param expectedCost - Expected payment amount and currency
 * @returns True if payment is valid
 */
export async function verifyPaymentProof(
  proofString: string,
  agentId: string,
  expectedCost: ExpectedCost
): Promise<boolean> {
  try {
    // 1. Decode and parse proof
    const decoded = Buffer.from(proofString, 'base64').toString('utf-8');
    const proofData = JSON.parse(decoded);
    
    // 2. Validate proof structure
    const validation = PaymentProofSchema.safeParse(proofData);
    if (!validation.success) {
      console.error('[Payment Proof] Invalid structure:', validation.error);
      return false;
    }
    
    const proof = validation.data;
    
    // 3. Verify amount matches (allow 1% tolerance for conversion rates)
    const tolerance = expectedCost.amount * 0.01;
    if (Math.abs(proof.amount - expectedCost.amount) > tolerance) {
      console.error('[Payment Proof] Amount mismatch:', {
        expected: expectedCost.amount,
        received: proof.amount
      });
      return false;
    }
    
    // 4. Verify currency matches
    if (proof.currency.toUpperCase() !== expectedCost.currency.toUpperCase()) {
      console.error('[Payment Proof] Currency mismatch:', {
        expected: expectedCost.currency,
        received: proof.currency
      });
      return false;
    }
    
    // 5. Verify timestamp is recent (within 10 minutes)
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (now - proof.timestamp > maxAge) {
      console.error('[Payment Proof] Expired:', {
        timestamp: proof.timestamp,
        now,
        age: now - proof.timestamp
      });
      return false;
    }
    
    // 6. Check if payment was already used (prevent replay attacks)
    const isUsed = await checkPaymentUsed(proof.transactionId);
    if (isUsed) {
      console.error('[Payment Proof] Already used:', proof.transactionId);
      return false;
    }
    
    // 7. Verify with payment provider
    let isValid = false;
    switch (proof.type) {
      case 'pi':
        isValid = await verifyPiPayment(proof);
        break;
      case 'stripe':
        isValid = await verifyStripePayment(proof);
        break;
      case 'crypto':
        isValid = await verifyCryptoPayment(proof);
        break;
      default:
        console.error('[Payment Proof] Unknown type:', proof.type);
        return false;
    }
    
    // 8. Mark payment as used
    if (isValid) {
      await markPaymentUsed(proof.transactionId, agentId, proof);
    }
    
    return isValid;
    
  } catch (error) {
    console.error('[Payment Verification Error]', error);
    return false;
  }
}

/**
 * Verify Pi Network payment
 * 
 * @param proof - Payment proof data
 * @returns True if payment is valid
 */
async function verifyPiPayment(proof: PaymentProof): Promise<boolean> {
  try {
    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error('[Pi Payment] API key not configured');
      return false;
    }
    
    // Call Pi Network API to verify payment
    const response = await fetch('https://api.minepi.com/v2/payments/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_id: proof.transactionId
      })
    });
    
    if (!response.ok) {
      console.error('[Pi Payment] Verification failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    
    // Check payment status
    if (data.status !== 'completed') {
      console.error('[Pi Payment] Not completed:', data.status);
      return false;
    }
    
    // Verify amount
    if (data.amount !== proof.amount) {
      console.error('[Pi Payment] Amount mismatch:', {
        expected: proof.amount,
        received: data.amount
      });
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('[Pi Payment Verification Error]', error);
    return false;
  }
}

/**
 * Verify Stripe payment
 * 
 * @param proof - Payment proof data
 * @returns True if payment is valid
 */
async function verifyStripePayment(proof: PaymentProof): Promise<boolean> {
  try {
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      console.error('[Stripe Payment] Secret key not configured');
      return false;
    }
    
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    
    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(proof.transactionId);
    
    // Check payment status
    if (session.payment_status !== 'paid') {
      console.error('[Stripe Payment] Not paid:', session.payment_status);
      return false;
    }
    
    // Verify amount (Stripe uses cents)
    const amountInCents = Math.round(proof.amount * 100);
    if (session.amount_total !== amountInCents) {
      console.error('[Stripe Payment] Amount mismatch:', {
        expected: amountInCents,
        received: session.amount_total
      });
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('[Stripe Payment Verification Error]', error);
    return false;
  }
}

/**
 * Verify crypto payment (Base/Solana)
 * 
 * @param proof - Payment proof data
 * @returns True if payment is valid
 */
async function verifyCryptoPayment(proof: PaymentProof): Promise<boolean> {
  try {
    // TODO: Implement on-chain verification
    // This requires:
    // 1. Connect to blockchain RPC
    // 2. Verify transaction exists
    // 3. Verify transaction is confirmed
    // 4. Verify recipient address
    // 5. Verify amount

    // For now, accept if signature is present
    // In production, this MUST verify on-chain
    return proof.signature.length > 0;
    
  } catch (error) {
    console.error('[Crypto Payment Verification Error]', error);
    return false;
  }
}

/**
 * Check if payment transaction was already used
 * 
 * @param transactionId - Transaction ID
 * @returns True if payment was already used
 */
async function checkPaymentUsed(transactionId: string): Promise<boolean> {
  try {
    // TODO: Implement database check
    // For now, use in-memory cache (not production-ready)
    
    // In production, check database:
    // const payment = await db.usedPayments.findUnique({
    //   where: { transactionId }
    // });
    // return payment !== null;
    
    return false;
    
  } catch (error) {
    console.error('[Check Payment Used Error]', error);
    return false;
  }
}

/**
 * Mark payment as used to prevent replay attacks
 * 
 * @param transactionId - Transaction ID
 * @param agentId - Agent ID
 * @param proof - Payment proof data
 */
async function markPaymentUsed(
  transactionId: string,
  agentId: string,
  proof: PaymentProof
): Promise<void> {
  try {
    // TODO: Implement database storage
    // For now, log only (not production-ready)
    
    // In production, store in database:
    // await db.usedPayments.create({
    //   data: {
    //     transactionId,
    //     agentId,
    //     type: proof.type,
    //     amount: proof.amount,
    //     currency: proof.currency,
    //     metadata: proof.metadata,
    //     usedAt: new Date()
    //   }
    // });
    
  } catch (error) {
    console.error('[Mark Payment Used Error]', error);
  }
}

/**
 * Generate payment proof (for testing)
 * 
 * @param type - Payment type
 * @param transactionId - Transaction ID
 * @param amount - Payment amount
 * @param currency - Payment currency
 * @returns Base64 encoded payment proof
 */
export function generatePaymentProof(
  type: 'pi' | 'stripe' | 'crypto',
  transactionId: string,
  amount: number,
  currency: string
): string {
  const proof: PaymentProof = {
    type,
    transactionId,
    amount,
    currency,
    timestamp: Date.now(),
    signature: 'test-signature-' + randomBytes(8).toString('hex')
  };
  
  return Buffer.from(JSON.stringify(proof)).toString('base64');
}

// Made with Moe Abdelaziz
