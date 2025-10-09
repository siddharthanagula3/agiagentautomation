import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { employeeId, employeeName, employeeRole, price, userId, userEmail, provider, billingPeriod = 'yearly' } = JSON.parse(event.body || '{}');

    if (!employeeId || !employeeName || !employeeRole || !price || !userId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: employeeId, employeeName, employeeRole, price, userId, userEmail' 
        }),
      };
    }

    console.log('[Stripe Checkout] Creating session for:', {
      employeeId,
      employeeName,
      employeeRole,
      price,
      userId,
      userEmail,
      provider,
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
      console.log('[Stripe Checkout] Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      console.log('[Stripe Checkout] Created new customer:', customer.id);
    }

    // Calculate price based on billing period
    const interval = billingPeriod === 'monthly' ? 'month' : 'year';
    const totalPrice = billingPeriod === 'monthly' ? price : price * 12;

    // Prepare checkout session data
    const sessionData: any = {
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true, // Enable discount code field in Stripe Checkout (includes "Betatester" coupon)
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AI Employee: ${employeeRole}`,
              description: billingPeriod === 'yearly' 
                ? `Yearly subscription for ${employeeRole} - $${price}/month billed annually` 
                : `Monthly subscription for ${employeeRole}`,
              metadata: {
                employeeId,
                employeeRole,
                provider: provider || 'chatgpt',
                billingPeriod,
              },
            },
            recurring: {
              interval: interval as 'month' | 'year',
            },
            unit_amount: totalPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        employeeId,
        employeeName,
        employeeRole,
        provider: provider || 'chatgpt',
        billingPeriod,
      },
      success_url: `${process.env.URL || 'http://localhost:5173'}/workforce?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:5173'}/marketplace?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          employeeId,
          employeeName,
          employeeRole,
          provider: provider || 'chatgpt',
          billingPeriod,
        },
      },
    };


    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionData);

    console.log('[Stripe Checkout] Session created:', session.id);

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
    console.error('[Stripe Checkout] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : String(error),
      }),
    };
  }
};

