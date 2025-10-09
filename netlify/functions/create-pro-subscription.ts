import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Plan Pricing
const PLAN_PRICES = {
  pro: {
    monthly: 20, // $20/month
    yearly: 200, // $200/year (save $40)
  },
  max: {
    monthly: 299, // $299/month
    yearly: 2990, // $2990/year (save $598)
  },
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
    const { userId, userEmail, billingPeriod = 'monthly', plan = 'pro' } = JSON.parse(event.body || '{}');

    if (!userId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: userId, userEmail' 
        }),
      };
    }

    if (!['pro', 'max'].includes(plan)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid plan. Must be "pro" or "max"' 
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
      console.log(`[${plan.toUpperCase()} Subscription] Found existing customer:`, customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      console.log(`[${plan.toUpperCase()} Subscription] Created new customer:`, customer.id);
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
      success_url: `${process.env.URL || 'http://localhost:5173'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:5173'}/billing?canceled=true`,
    });

    console.log(`[${plan.toUpperCase()} Subscription] Session created:`, session.id);

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
    console.error('[Plan Subscription] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : String(error),
      }),
    };
  }
};

