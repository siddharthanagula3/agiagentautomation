import type { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimitTier } from '../utils/rate-limiter';
import { formatValidationError } from '../utils/validation-schemas';
import {
  sanitizeBillingError,
  BILLING_ERROR_CODES,
} from '../utils/billing-error-sanitizer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

/**
 * Cancel subscription request schema
 * SECURITY: atPeriodEnd defaults to true for graceful cancellation
 */
const cancelSubscriptionSchema = z.object({
  atPeriodEnd: z.boolean().default(true),
});

// =============================================================================
// HANDLER
// =============================================================================

const authenticatedHandler = async (
  event: HandlerEvent & { user: { id: string; email?: string } }
) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Validate request body with Zod schema
    const parseResult = cancelSubscriptionSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { atPeriodEnd } = parseResult.data;
    const userId = event.user.id;

    console.log('[Cancel Subscription] Request from user:', {
      userId,
      atPeriodEnd,
    });

    // Look up the user's Stripe subscription ID from the database
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id, plan')
      .eq('id', userId)
      .maybeSingle();

    if (dbError) {
      console.error('[Cancel Subscription] Database error:', dbError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to retrieve subscription information.',
          code: BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
        }),
      };
    }

    if (!userData?.stripe_subscription_id) {
      console.warn('[Cancel Subscription] No active subscription found for user:', userId);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'No active subscription found.',
          code: BILLING_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
        }),
      };
    }

    const subscriptionId = userData.stripe_subscription_id;

    console.log('[Cancel Subscription] Cancelling subscription:', {
      subscriptionId,
      atPeriodEnd,
      currentPlan: userData.plan,
    });

    let subscription: Stripe.Subscription;

    if (atPeriodEnd) {
      // Graceful cancellation: subscription remains active until end of billing period
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      console.log(
        '[Cancel Subscription] Subscription set to cancel at period end:',
        subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : 'unknown'
      );
    } else {
      // Immediate cancellation
      subscription = await stripe.subscriptions.cancel(subscriptionId);
      console.log('[Cancel Subscription] Subscription cancelled immediately');
    }

    // Update the user record in the database
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (!atPeriodEnd) {
      // Immediate cancel: reset plan to free
      updateData.plan = 'free';
      updateData.plan_status = 'cancelled';
      updateData.stripe_subscription_id = null;
    } else {
      // Graceful cancel: mark as pending cancellation
      updateData.plan_status = 'cancelled';
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      // Log but don't fail -- the Stripe cancellation already succeeded
      console.error('[Cancel Subscription] Failed to update user record:', updateError);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: atPeriodEnd
          ? 'Subscription will be cancelled at the end of the current billing period.'
          : 'Subscription cancelled immediately.',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        },
      }),
    };
  } catch (error) {
    // Log full error server-side for debugging
    console.error('[Cancel Subscription] Error:', error);

    // SECURITY: Return sanitized error message to client
    const sanitized = sanitizeBillingError(error, 'subscription');

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    };
  }
};

// Wrap handler with authentication and payment tier rate limiting (5 req/min)
export const handler: Handler = withAuth(
  withRateLimitTier('payment')(authenticatedHandler)
);
