import { NextRequest, NextResponse } from 'next/server';
import { getPiNetworkClient } from '@/lib/pi-network';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Get Pi Network client
    const piClient = getPiNetworkClient({
      environment: process.env.PI_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });

    // Get payment status
    const payment = await piClient.getPaymentStatus(paymentId, accessToken);

    // Verify payment details
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not in pending state' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Verify the payment amount matches expected amount
    // 2. Check if the payment hasn't been processed before
    // 3. Store payment record in database
    // 4. Approve the payment with Pi Network

    // For now, we'll just return success
    // In production, you'd call Pi Network API to approve
    return NextResponse.json({
      success: true,
      paymentId,
      status: 'approved',
      message: 'Payment approved successfully',
    });

  } catch (error) {
    console.error('[Pi Payment Approval] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
