import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';

interface BuyTokenPackRequest {
  userId: string;
  userEmail: string;
  packId: string;
  tokens: number;
  price: number;
}

/**
 * Netlify Function: Buy Token Pack
 *
 * Creates a Stripe checkout session for one-time token pack purchases.
 * Similar to create-pro-subscription but for one-time payments instead of recurring.
 */
export const handler: Handler = async (
  event: HandlerEvent,
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
    const body = JSON.parse(event.body || '{}') as BuyTokenPackRequest;
    const { userId, userEmail, packId, tokens, price } = body;

    // Validate required fields
    if (!userId || !userEmail || !packId || !tokens || !price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
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
