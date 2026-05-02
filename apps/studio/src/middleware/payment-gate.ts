/**
 * HTTP 402 Payment Gate Middleware
 * 
 * This middleware implements the HTTP 402 Payment Required protocol
 * for AIX agent operations. It transforms AIX from a free tool into
 * a revenue-generating protocol.
 * 
 * Flow:
 * 1. Calculate operation cost
 * 2. Check for payment proof
 * 3. If no proof → Return HTTP 402 with payment options
 * 4. If proof exists → Verify payment
 * 5. If valid → Allow execution
 * 
 * @module payment-gate
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateAgentCost } from '@/lib/pricing/engine';

export interface PaymentChallenge {
  error: string;
  code: 'PAYMENT_REQUIRED';
  cost: {
    amount: number;
    currency: string;
    breakdown: Record<string, any>;
  };
  paymentMethods: PaymentMethod[];
  expiresAt: number;
}

export interface PaymentMethod {
  type: 'pi' | 'stripe' | 'crypto';
  endpoint?: string;
  memo?: string;
  sessionId?: string;
  chains?: string[];
  address?: string;
}

export type AgentOperation = 'invoke' | 'train' | 'deploy' | 'clone';

/**
 * Payment gate middleware - checks if payment is required and verified
 * 
 * @param req - Next.js request object
 * @param agentId - Agent ID being operated on
 * @param operation - Type of operation (invoke, train, deploy, clone)
 * @returns NextResponse with 402 if payment needed, null if payment verified
 */
export async function paymentGate(
  req: NextRequest,
  agentId: string,
  operation: AgentOperation
): Promise<NextResponse | null> {
  try {
    // 1. Calculate operation cost
    const cost = await calculateAgentCost(agentId, operation);
    
    // 2. Check if operation is free (e.g., public agents, free tier)
    if (cost.amount === 0) {
      return null; // No payment required
    }
    
    // 3. Check for payment proof in headers
    const paymentProof = req.headers.get('x-payment-proof');
    
    if (!paymentProof) {
      // 4. No payment proof → Return HTTP 402 Payment Required
      return createPaymentChallenge(agentId, operation, cost);
    }
    
    // 5. Verify payment proof
    const { verifyPaymentProof } = await import('@/lib/payment/verifier');
    const isValid = await verifyPaymentProof(paymentProof, agentId, cost);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid payment proof',
          code: 'INVALID_PAYMENT_PROOF'
        },
        { status: 403 }
      );
    }
    
    // 6. Payment verified - allow execution
    return null;
    
  } catch (error) {
    console.error('[Payment Gate Error]', error);
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        code: 'PAYMENT_VERIFICATION_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Create HTTP 402 Payment Challenge response
 * 
 * @param agentId - Agent ID
 * @param operation - Operation type
 * @param cost - Calculated cost
 * @returns NextResponse with 402 status and payment options
 */
async function createPaymentChallenge(
  agentId: string,
  operation: AgentOperation,
  cost: { amount: number; currency: string; breakdown: any }
): Promise<NextResponse> {
  const paymentMethods: PaymentMethod[] = [];
  
  // Add Pi Network payment option
  if (process.env.NEXT_PUBLIC_PI_ENABLED === 'true') {
    paymentMethods.push({
      type: 'pi',
      endpoint: '/api/pi/payment-setup',
      memo: `agent:${agentId}:${operation}:${Date.now()}`
    });
  }
  
  // Add Stripe payment option
  if (process.env.STRIPE_SECRET_KEY) {
    const sessionId = await createStripeSession(agentId, operation, cost);
    paymentMethods.push({
      type: 'stripe',
      endpoint: '/api/stripe/checkout',
      sessionId
    });
  }
  
  // Add crypto payment option
  if (process.env.NEXT_PUBLIC_CRYPTO_ENABLED === 'true') {
    const address = await getPaymentAddress(agentId);
    paymentMethods.push({
      type: 'crypto',
      chains: ['base', 'solana'],
      address
    });
  }
  
  const challenge: PaymentChallenge = {
    error: 'Payment Required',
    code: 'PAYMENT_REQUIRED',
    cost: {
      amount: cost.amount,
      currency: cost.currency,
      breakdown: cost.breakdown
    },
    paymentMethods,
    expiresAt: Date.now() + 300000 // 5 minutes
  };
  
  return NextResponse.json(challenge, { status: 402 });
}

/**
 * Create Stripe checkout session
 * 
 * @param agentId - Agent ID
 * @param operation - Operation type
 * @param cost - Cost details
 * @returns Stripe session ID
 */
async function createStripeSession(
  agentId: string,
  operation: AgentOperation,
  cost: { amount: number; currency: string }
): Promise<string> {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: cost.currency.toLowerCase(),
            product_data: {
              name: `Agent ${operation}`,
              description: `Execute ${operation} operation on agent ${agentId}`
            },
            unit_amount: Math.round(cost.amount * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        agentId,
        operation
      }
    });
    
    return session.id;
  } catch (error) {
    console.error('[Stripe Session Error]', error);
    throw new Error('Failed to create Stripe session');
  }
}

/**
 * Get payment address for crypto payments
 * 
 * @param agentId - Agent ID
 * @returns Payment address
 */
async function getPaymentAddress(agentId: string): Promise<string> {
  // TODO: Implement proper payment address generation
  // For now, return protocol treasury address
  return process.env.PROTOCOL_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';
}

/**
 * Check if user has free tier access
 * 
 * @param userId - User ID
 * @param operation - Operation type
 * @returns True if user has free access
 */
export async function hasFreeTierAccess(
  userId: string,
  operation: AgentOperation
): Promise<boolean> {
  // TODO: Implement free tier logic
  // - New users get X free invocations
  // - Premium users get unlimited
  // - Check usage limits
  return false;
}

/**
 * Record payment attempt for analytics
 * 
 * @param agentId - Agent ID
 * @param operation - Operation type
 * @param cost - Cost details
 * @param success - Whether payment succeeded
 */
export async function recordPaymentAttempt(
  agentId: string,
  operation: AgentOperation,
  cost: { amount: number; currency: string },
  success: boolean
): Promise<void> {
  try {
    // TODO: Implement analytics recording
    console.log('[Payment Attempt]', {
      agentId,
      operation,
      cost,
      success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Record Payment Error]', error);
  }
}

// Made with Bob
