import { NextRequest, NextResponse } from 'next/server';
import { securePaymentId, secureTransactionHash } from '@/lib/security-core';
import { getTrustChain, getBus } from '@aix-core/src';
import { kv, KEYS } from '@/lib/redis';
import { requireAuth } from '@/lib/api-helpers';
import { z } from 'zod';

/**
 * AIX Sovereign Payment Engine
 * POST /api/agents/payment
 * 
 * RULE 0: Security First
 * RULE 1: Zod validation (Strict)
 * RULE 2: Zero Math.random (securePaymentId uses crypto)
 * RULE 3: TrustChain.append() + auditHash
 * 
 * Made with Moe Abdelaziz
 */

// RULE 1: Strict Validation Schemas
const PaymentRequestSchema = z.object({
  agentId: z.string().min(1),
  taskId: z.string().min(1),
  amount: z.number().positive(),
  userId: z.string().uuid().optional(), // Can be inferred from auth
  paymentMethod: z.enum(['pi_network', 'escrow']),
});

const ReleaseRequestSchema = z.object({
  paymentId: z.string().startsWith('pay-'),
  taskId: z.string().min(1),
  success: z.boolean(),
});

export async function POST(request: NextRequest) {
  return requireAuth(async (session) => {
    try {
      const body = await request.json();
      
      // RULE 1: Validate input
      const validatedData = PaymentRequestSchema.parse(body);
      const userId = session.user.id || validatedData.userId;

      // RULE 2: Generate secure ID
      const paymentId = securePaymentId();
      const trustChain = getTrustChain();
      
      let result;
      if (validatedData.paymentMethod === 'pi_network') {
        result = await processPiNetworkPayment({
          paymentId,
          agentId: validatedData.agentId,
          taskId: validatedData.taskId,
          amount: validatedData.amount,
          userId
        });
      } else {
        result = await processEscrowPayment({
          paymentId,
          agentId: validatedData.agentId,
          taskId: validatedData.taskId,
          amount: validatedData.amount,
          userId
        });
      }

      // RULE 3: Append to TrustChain + Persistent Storage
      const auditHash = await trustChain.append(validatedData.agentId, 'PAYMENT_INITIATED', {
        paymentId,
        taskId: validatedData.taskId,
        amount: validatedData.amount,
        method: validatedData.paymentMethod,
        userId
      });

      // Persist to Redis (Replace in-memory Map)
      const paymentRecord = {
        paymentId,
        agentId: validatedData.agentId,
        amount: validatedData.amount,
        userId,
        verified: result.status === 'completed',
        auditHash,
        timestamp: Date.now()
      };
      
      await kv.set(`pay:${paymentId}`, paymentRecord);
      await kv.set(KEYS.aixEconomicsLedger(validatedData.agentId), {
        lastPaymentId: paymentId,
        lastAuditHash: auditHash
      });

      return NextResponse.json({ ...result, auditHash }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('[PaymentEngine] Error:', error);
      return NextResponse.json({ success: false, error: 'Payment processing failed' }, { status: 500 });
    }
  });
}

async function processPiNetworkPayment(params: any) {
  // Simulate Pi Network (Replace with SDK in Phase 3)
  const transactionHash = secureTransactionHash();
  return {
    success: true,
    paymentId: params.paymentId,
    status: 'completed',
    transactionHash
  };
}

async function processEscrowPayment(params: any) {
  return {
    success: true,
    paymentId: params.paymentId,
    status: 'pending'
  };
}

export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });

    const payment = await kv.get(`pay:${paymentId}`);
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json(payment);
  });
}

export async function PUT(request: NextRequest) {
  return requireAuth(async (session) => {
    try {
      const body = await request.json();
      const { paymentId, taskId, success: taskSuccess } = ReleaseRequestSchema.parse(body);

      const payment: any = await kv.get(`pay:${paymentId}`);
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

      const trustChain = getTrustChain();

      if (taskSuccess) {
        payment.verified = true;
        const auditHash = await trustChain.append(payment.agentId, 'PAYMENT_RELEASED', { paymentId, taskId });
        payment.releaseAuditHash = auditHash;
        
        await kv.set(`pay:${paymentId}`, payment);
        return NextResponse.json({ success: true, message: 'Payment released', auditHash });
      } else {
        await kv.delete(`pay:${paymentId}`);
        await trustChain.append(payment.agentId, 'PAYMENT_REFUNDED', { paymentId, taskId });
        return NextResponse.json({ success: true, message: 'Payment refunded' });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  });
}

// Made with Moe Abdelaziz
e Abdelaziz
