oimport { NextRequest, NextResponse } from 'next/server';
import { securePaymentId, secureTransactionHash, TrustChain } from '@/lib/security-core';
import { z } from 'zod';

/**
 * Agent Payment Router
 * POST /api/agents/payment
 *
 * Routes payments for agent task execution via Pi Network
 * SECURITY: Uses crypto.randomBytes for all IDs (RULE 2)
 */

interface PaymentRequest {
  agentId: string;
  taskId: string;
  amount: number; // in Pi
  userId: string;
  paymentMethod: 'pi_network' | 'escrow';
}

interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  error?: string;
}

interface PaymentVerification {
  paymentId: string;
  agentId: string;
  amount: number;
  verified: boolean;
  timestamp: number;
}

// In-memory payment store (replace with database in production)
const payments = new Map<string, PaymentVerification>();

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    
    // Validate request
    if (!body.agentId || !body.taskId || !body.amount || !body.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: agentId, taskId, amount, userId' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate payment ID (SECURE)
    const paymentId = securePaymentId();
    
    // Process payment based on method
    let result: PaymentResponse;
    
    if (body.paymentMethod === 'pi_network') {
      result = await processPiNetworkPayment({
        paymentId,
        agentId: body.agentId,
        taskId: body.taskId,
        amount: body.amount,
        userId: body.userId
      });
    } else if (body.paymentMethod === 'escrow') {
      result = await processEscrowPayment({
        paymentId,
        agentId: body.agentId,
        taskId: body.taskId,
        amount: body.amount,
        userId: body.userId
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Store payment verification
    payments.set(paymentId, {
      paymentId,
      agentId: body.agentId,
      amount: body.amount,
      verified: result.status === 'completed',
      timestamp: Date.now()
    });

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during payment processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Process Pi Network payment
 */
async function processPiNetworkPayment(params: {
  paymentId: string;
  agentId: string;
  taskId: string;
  amount: number;
  userId: string;
}): Promise<PaymentResponse> {
  
  // Simulate Pi Network API call
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock successful payment
  // TODO: Replace with real Pi Network SDK integration
  const transactionHash = secureTransactionHash();
  
  // Log to TrustChain (RULE 3)
  TrustChain.append('payment.pi_network', params.userId, {
    paymentId: params.paymentId,
    agentId: params.agentId,
    amount: params.amount,
    transactionHash,
  });
  
  return {
    success: true,
    paymentId: params.paymentId,
    status: 'completed',
    transactionHash
  };
}

/**
 * Process escrow payment
 * Holds payment until task completion
 */
async function processEscrowPayment(params: {
  paymentId: string;
  agentId: string;
  taskId: string;
  amount: number;
  userId: string;
}): Promise<PaymentResponse> {
  
  // Simulate escrow setup
  await new Promise(resolve => setTimeout(resolve, 50));

  // Mock escrow creation
  return {
    success: true,
    paymentId: params.paymentId,
    status: 'pending' // Will be completed when task finishes
  };
}

/**
 * GET /api/agents/payment?id={paymentId}
 * Verify payment status
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('id');

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Missing payment ID' },
      { status: 400 }
    );
  }

  const payment = payments.get(paymentId);
  
  if (!payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    paymentId: payment.paymentId,
    agentId: payment.agentId,
    amount: payment.amount,
    verified: payment.verified,
    timestamp: payment.timestamp
  });
}

/**
 * PUT /api/agents/payment/release
 * Release escrow payment after task completion
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, taskId, success: taskSuccess } = body;

    if (!paymentId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, taskId' },
        { status: 400 }
      );
    }

    const payment = payments.get(paymentId);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Release or refund based on task success
    if (taskSuccess) {
      // Release payment to agent
      payment.verified = true;
      payments.set(paymentId, payment);
      
      return NextResponse.json({
        success: true,
        message: 'Payment released to agent',
        paymentId,
        amount: payment.amount
      });
    } else {
      // Refund to user
      payments.delete(paymentId);
      
      return NextResponse.json({
        success: true,
        message: 'Payment refunded to user',
        paymentId,
        amount: payment.amount
      });
    }

  } catch (error) {
    console.error('Payment release error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
