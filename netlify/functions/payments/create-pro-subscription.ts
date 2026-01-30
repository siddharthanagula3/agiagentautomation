import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimitTier } from '../utils/rate-limiter';
import {
  createSubscriptionSchema,
  formatValidationError,
} from '../utils/validation-schemas';
import {
  sanitizeBillingError,
} from '../utils/billing-error-sanitizer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Plan Pricing - PRODUCTION PRICING
const PLAN_PRICES = {
  pro: {
    monthly: 29, // $29/month
    yearly: 299.88, // $299.88/year ($24.99/month if billed yearly)
  },
  max: {
    monthly: 299, // $299/month
    yearly: 2990, // $2990/year (save $598)
  },
};

// Updated: Nov 16th 2025 - Fixed missing authentication on Stripe payment endpoint
// Updated: Jan 10th 2026 - Added rate limiting and Zod validation
const authenticatedHandler = async (event: HandlerEvent & { user: { id: string; email?: string } }, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Validate request body with Zod schema
    const parseResult = createSubscriptionSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { userId, userEmail, billingPeriod, plan } = parseResult.data;

    // Updated: Nov 16th 2025 - Fixed missing authentication - verify userId matches authenticated user
    if (event.user.id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: User ID mismatch',
        }),
      };
    }

    console.log(`[${plan.toUpperCase()} Subscription] Creating session for:`, {
      userId,
      userEmail,
      billingPeriod,
      plan,
    });

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(
        `[${plan.toUpperCase()} Subscription] Found existing customer:`,
        customer.id
      );
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      console.log(
        `[${plan.toUpperCase()} Subscription] Created new customer:`,
        customer.id
      );
    }

    // Determine price based on billing period and plan
    const prices = PLAN_PRICES[plan as 'pro' | 'max'];
    const price = billingPeriod === 'yearly' ? prices.yearly : prices.monthly;
    const interval = billingPeriod === 'yearly' ? 'year' : 'month';

    // Plan descriptions
    const planDescriptions = {
      pro: '10M tokens/month (2.5M per LLM), all providers, priority support',
      max: '40M tokens/month (10M per LLM), all providers, dedicated support, advanced features',
    };

    // SECURITY FIX: Generate idempotency key to prevent duplicate charges
    // Key is based on userId + plan + billing period + timestamp rounded to minute
    // This allows retries within 1 minute but prevents duplicate subscriptions
    const idempotencyKey = `sub_${userId}_${plan}_${billingPeriod}_${Math.floor(Date.now() / 60000)}`;

    // Create checkout session with idempotency key
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan === 'pro' ? 'Pro' : 'Max'} Plan`,
              description: planDescriptions[plan as 'pro' | 'max'],
              images: ['https://agiagentautomation.com/favicon.ico'],
            },
            recurring: {
              interval: interval as 'month' | 'year',
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          billingPeriod,
        },
      },
      success_url: `${process.env.URL || 'https://agiagentautomation.com'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'https://agiagentautomation.com'}/billing?canceled=true`,
    }, {
      idempotencyKey,
    });

    console.log(
      `[${plan.toUpperCase()} Subscription] Session created:`,
      session.id
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    // Log full error server-side for debugging
    console.error('[Plan Subscription] Error:', error);

    // SECURITY FIX: Never expose stack traces to client
    // Return generic error message to prevent information disclosure
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to create subscription. Please try again or contact support.',
        code: 'SUBSCRIPTION_ERROR',
      }),
    };
  }
};

// Updated: Nov 16th 2025 - Fixed missing authentication - wrap handler with withAuth
// Updated: Jan 10th 2026 - Added payment tier rate limiting (5 req/min)
export const handler: Handler = withAuth(
  withRateLimitTier('payment')(authenticatedHandler)
);
