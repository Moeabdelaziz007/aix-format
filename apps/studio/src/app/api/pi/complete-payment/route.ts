import { NextRequest, NextResponse } from 'next/server';
import { getPiNetworkClient } from '@/lib/pi-network';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();
    
    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: 'Payment ID and transaction ID are required' },
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

    // Complete the payment
    const payment = await piClient.completePayment(paymentId, txid, accessToken);

    // Here you would typically:
    // 1. Update payment status in database
    // 2. Trigger any post-payment actions (e.g., activate agent, grant access)
    // 3. Send confirmation email/notification
    // 4. Update user balance/credits

    return NextResponse.json({
      success: true,
      identifier: payment.identifier,
      status: payment.status,
      txid: payment.txid,
      amount: payment.amount,
      timestamp: payment.timestamp,
      message: 'Payment completed successfully',
    });

  } catch (error) {
    console.error('[Pi Payment Completion] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
