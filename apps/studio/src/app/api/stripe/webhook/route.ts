import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { successResponse, errorResponse, requireEnv, ERR } from '@/lib/api-helpers';

/**
 * POST /api/stripe/webhook
 * Stripe webhook handler with signature verification
 * 
 * CRITICAL: This endpoint MUST verify webhook signatures to prevent
 * unauthorized payment manipulation.
 */
export async function POST(req: NextRequest) {
  const stripeSecret = requireEnv('STRIPE_SECRET_KEY');
  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
  
  if (!stripeSecret || !webhookSecret) {
    return ERR.NOT_CONFIGURED('Stripe not configured');
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
  const sig = req.headers.get('stripe-signature');
  
  if (!sig) {
    return errorResponse('MISSING_SIGNATURE', 'Webhook signature missing', 400);
  }

  let event: Stripe.Event;
  
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return errorResponse('INVALID_SIGNATURE', 'Webhook signature verification failed', 400);
  }

  // Handle webhook events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe] Payment succeeded:', paymentIntent.id);
        // TODO: Grant user access / update credits
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe] Payment failed:', paymentIntent.id);
        // TODO: Log failure / notify user
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe] Subscription updated:', subscription.id);
        // TODO: Update user plan
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe] Subscription cancelled:', subscription.id);
        // TODO: Downgrade user plan
        break;
      }
      
      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    // ALWAYS return 200 to Stripe (prevents retries)
    return successResponse({ received: true });
    
  } catch (err: any) {
    console.error('[Stripe Webhook] Processing error:', err.message);
    // Still return 200 to prevent Stripe retries
    return successResponse({ received: true, error: 'Processing failed' });
  }
}

// Made with Bob
