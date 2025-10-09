import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Pro Plan Pricing
const PRO_PLAN_PRICES = {
  monthly: 20, // $20/month
  yearly: 200, // $200/year (save $40)
};

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId, userEmail, billingPeriod = 'monthly' } = JSON.parse(event.body || '{}');

    if (!userId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: userId, userEmail' 
        }),
      };
    }

    console.log('[Pro Subscription] Creating session for:', {
      userId,
      userEmail,
      billingPeriod,
    });

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('[Pro Subscription] Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      console.log('[Pro Subscription] Created new customer:', customer.id);
    }

    // Determine price based on billing period
    const price = billingPeriod === 'yearly' ? PRO_PLAN_PRICES.yearly : PRO_PLAN_PRICES.monthly;
    const interval = billingPeriod === 'yearly' ? 'year' : 'month';

    // Create checkout session
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
              name: 'Pro Plan',
              description: '10M tokens/month (2.5M per LLM), all providers, priority support',
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
        plan: 'pro',
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          plan: 'pro',
          billingPeriod,
        },
      },
      success_url: `${process.env.URL || 'http://localhost:5173'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:5173'}/billing?canceled=true`,
    });

    console.log('[Pro Subscription] Session created:', session.id);

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
    console.error('[Pro Subscription] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to create Pro subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : String(error),
      }),
    };
  }
};

