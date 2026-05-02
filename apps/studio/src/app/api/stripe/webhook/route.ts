import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { successResponse, errorResponse, requireEnv, ERR } from '@/lib/api-helpers';
import { kv } from '@/lib/redis';
import { monitoring } from '@/lib/monitoring';

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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return errorResponse('INVALID_SIGNATURE', 'Webhook signature verification failed', 400);
  }

  // Handle webhook events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const planId = paymentIntent.metadata?.planId;
        const credits = paymentIntent.metadata?.credits ? parseInt(paymentIntent.metadata.credits) : 0;
        
        console.log('[Stripe] Payment succeeded:', {
          paymentId: paymentIntent.id,
          userId,
          amount: paymentIntent.amount,
          planId,
          credits
        });
        
        if (userId) {
          // Update user credits in Redis
          const userKey = `user:${userId}:credits`;
          const currentCredits = await kv.get(userKey) || 0;
          const newCredits = (typeof currentCredits === 'number' ? currentCredits : 0) + credits;
          await kv.set(userKey, newCredits);
          
          // Store payment record
          const paymentKey = `payment:${paymentIntent.id}`;
          await kv.set(paymentKey, {
            userId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            planId,
            credits,
            timestamp: new Date().toISOString()
          }, { ex: 60 * 60 * 24 * 90 }); // 90 days retention
          
          // Log to monitoring
          monitoring.logEvent({
            level: 'info',
            category: 'business',
            message: 'Payment succeeded',
            metadata: { userId, paymentId: paymentIntent.id, amount: paymentIntent.amount, credits }
          });
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
        
        console.error('[Stripe] Payment failed:', {
          paymentId: paymentIntent.id,
          userId,
          error: errorMessage,
          amount: paymentIntent.amount
        });
        
        if (userId) {
          // Store failed payment record
          const failureKey = `payment:failed:${paymentIntent.id}`;
          await kv.set(failureKey, {
            userId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'failed',
            error: errorMessage,
            timestamp: new Date().toISOString()
          }, { ex: 60 * 60 * 24 * 30 }); // 30 days retention
          
          // Log error to monitoring
          monitoring.reportError({
            error: new Error(`Payment failed: ${errorMessage}`),
            context: 'stripe_webhook',
            severity: 'high',
            userId,
            metadata: { paymentId: paymentIntent.id, amount: paymentIntent.amount }
          });
          
          // TODO: Send email notification to user about payment failure
          // await sendPaymentFailureEmail(userId, errorMessage);
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const planId = subscription.items.data[0]?.price.id;
        
        console.log('[Stripe] Subscription updated:', {
          subscriptionId: subscription.id,
          userId,
          status: subscription.status,
          planId
        });
        
        if (userId && planId) {
          // Update user subscription in Redis
          const subKey = `user:${userId}:subscription`;
          await kv.set(subKey, {
            subscriptionId: subscription.id,
            planId,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date().toISOString()
          });
          
          // Update user plan
          const userPlanKey = `user:${userId}:plan`;
          await kv.set(userPlanKey, planId);
          
          // Log to monitoring
          monitoring.logEvent({
            level: 'info',
            category: 'business',
            message: event.type === 'customer.subscription.created' ? 'Subscription created' : 'Subscription updated',
            metadata: { userId, subscriptionId: subscription.id, planId, status: subscription.status }
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        console.log('[Stripe] Subscription cancelled:', {
          subscriptionId: subscription.id,
          userId
        });
        
        if (userId) {
          // Remove subscription from Redis
          const subKey = `user:${userId}:subscription`;
          await kv.del(subKey);
          
          // Downgrade to free plan
          const userPlanKey = `user:${userId}:plan`;
          await kv.set(userPlanKey, 'free');
          
          // Store cancellation record
          const cancelKey = `subscription:cancelled:${subscription.id}`;
          await kv.set(cancelKey, {
            userId,
            subscriptionId: subscription.id,
            cancelledAt: new Date().toISOString(),
            reason: subscription.cancellation_details?.reason || 'unknown'
          }, { ex: 60 * 60 * 24 * 90 }); // 90 days retention
          
          // Log to monitoring
          monitoring.logEvent({
            level: 'warn',
            category: 'business',
            message: 'Subscription cancelled',
            metadata: { userId, subscriptionId: subscription.id }
          });
          
          // TODO: Send email notification about subscription cancellation
          // await sendSubscriptionCancelledEmail(userId);
        }
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        
        console.log('[Stripe] Checkout completed:', {
          sessionId: session.id,
          userId,
          planId,
          paymentStatus: session.payment_status
        });
        
        if (userId && session.payment_status === 'paid') {
          // Store checkout session
          const sessionKey = `checkout:${session.id}`;
          await kv.set(sessionKey, {
            userId,
            planId,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentStatus: session.payment_status,
            completedAt: new Date().toISOString()
          }, { ex: 60 * 60 * 24 * 30 }); // 30 days retention
          
          // Log to monitoring
          monitoring.logEvent({
            level: 'info',
            category: 'business',
            message: 'Checkout completed',
            metadata: { userId, sessionId: session.id, planId, amount: session.amount_total }
          });
        }
        break;
      }
      
      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
        monitoring.logEvent({
          level: 'info',
          category: 'system',
          message: 'Unhandled Stripe webhook event',
          metadata: { eventType: event.type, eventId: event.id }
        });
    }

    // ALWAYS return 200 to Stripe (prevents retries)
    return successResponse({ received: true, eventType: event.type });
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Stripe Webhook] Processing error:', err.message);
    
    // Log error to monitoring
    monitoring.reportError({
      error: err,
      context: 'stripe_webhook_processing',
      severity: 'critical',
      metadata: { eventType: event.type, eventId: event.id }
    });
    
    // Still return 200 to prevent Stripe retries
    return successResponse({ received: true, error: 'Processing failed' });
  }
}

// Made with Bob
