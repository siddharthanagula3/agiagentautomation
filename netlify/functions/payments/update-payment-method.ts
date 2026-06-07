import type { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimitTier } from '../utils/rate-limiter';
import {
  updatePaymentMethodSchema,
  formatValidationError,
} from '../utils/validation-schemas';
import {
  sanitizeBillingError,
  BILLING_ERROR_CODES,
} from '../utils/billing-error-sanitizer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const authenticatedHandler = async (event: HandlerEvent & { user: { id: string; email?: string } }) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Validate request body with Zod schema
    const parseResult = updatePaymentMethodSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { paymentMethodId } = parseResult.data;

    // Look up the Stripe customer ID for the authenticated user
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use .maybeSingle() to avoid 406 errors when subscription doesn't exist
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', event.user.id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'No billing account found. Please subscribe to a plan first.',
          code: BILLING_ERROR_CODES.CUSTOMER_NOT_FOUND,
        }),
      };
    }

    const customerId = subscription.stripe_customer_id;

    console.log('[Update Payment Method] Attaching payment method for customer:', customerId);

    // 1. Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // 2. Set it as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    console.log('[Update Payment Method] Successfully updated default payment method:', paymentMethodId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        paymentMethodId,
      }),
    };
  } catch (error) {
    // SECURITY: Log full error server-side for debugging
    console.error('[Update Payment Method] Error:', error);

    // SECURITY FIX: Return sanitized error message to client
    // Never expose internal error details, Stripe IDs, or stack traces
    const sanitized = sanitizeBillingError(error, 'subscription');

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitized),
    };
  }
};

// Wrap handler with authentication and payment tier rate limiting (5 req/min)
export const handler: Handler = withAuth(
  withRateLimitTier('payment')(authenticatedHandler)
);
