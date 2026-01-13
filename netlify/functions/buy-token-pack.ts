import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { withAuth } from './utils/auth-middleware';
import { withRateLimitTier } from './utils/rate-limiter';
import {
  buyTokenPackSchema,
  formatValidationError,
} from './utils/validation-schemas';

/**
 * Netlify Function: Buy Token Pack
 *
 * Creates a Stripe checkout session for one-time token pack purchases.
 * Similar to create-pro-subscription but for one-time payments instead of recurring.
 */
// Updated: Nov 16th 2025 - Fixed missing authentication on Stripe payment endpoint
// Updated: Jan 10th 2026 - Added rate limiting and Zod validation
const authenticatedHandler: Handler = async (
  event: HandlerEvent & { user: { id: string; email?: string } },
  context: HandlerContext
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
    const parseResult = buyTokenPackSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { userId, userEmail, packId, tokens, price } = parseResult.data;

    // Updated: Nov 16th 2025 - Fixed missing authentication - verify userId matches authenticated user
    if (event.user.id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: User ID mismatch',
        }),
      };
    }

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Payment system not configured' }),
      };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get base URL for redirect
    const baseUrl = process.env.URL || 'http://localhost:8888';

    console.log('[Buy Token Pack] Creating checkout session:');
    console.log('[Buy Token Pack]   User ID:', userId);
    console.log('[Buy Token Pack]   Pack ID:', packId);
    console.log('[Buy Token Pack]   Tokens:', tokens.toLocaleString());
    console.log('[Buy Token Pack]   Price:', `$${price}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment (not subscription)
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price * 100, // Convert dollars to cents
            product_data: {
              name: `${(tokens / 1000000).toFixed(1)}M Token Pack`,
              description: `${tokens.toLocaleString()} tokens for your AI employees`,
              images: [], // Optional: Add product image URL
            },
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId, // Store user ID for webhook processing
      metadata: {
        userId,
        packId,
        tokens: tokens.toString(),
        type: 'token_pack_purchase',
      },
      success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}&tokens=${tokens}`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      allow_promotion_codes: true, // Allow discount codes
    });

    console.log('[Buy Token Pack] ✅ Checkout session created:', session.id);

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
    console.error('[Buy Token Pack] ❌ Error creating checkout session:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Updated: Nov 16th 2025 - Fixed missing authentication - wrap handler with withAuth
// Updated: Jan 10th 2026 - Added payment tier rate limiting (5 req/min)
export const handler: Handler = withAuth(
  withRateLimitTier('payment')(authenticatedHandler)
);
