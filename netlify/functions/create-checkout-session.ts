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
    const { employeeId, employeeRole, price, userId, userEmail, provider } = JSON.parse(event.body || '{}');

    if (!employeeId || !employeeRole || !price || !userId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: employeeId, employeeRole, price, userId, userEmail' 
        }),
      };
    }

    console.log('[Stripe Checkout] Creating session for:', {
      employeeId,
      employeeRole,
      price,
      userId,
      userEmail,
      provider,
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

    // Prepare checkout session data
    const sessionData: any = {
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true, // Enable discount code field in Stripe Checkout
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AI Employee: ${employeeRole}`,
              description: `Monthly subscription for ${employeeRole}`,
              metadata: {
                employeeId,
                employeeRole,
                provider: provider || 'chatgpt', // Store provider for webhook
              },
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        employeeId,
        employeeRole,
        provider: provider || 'chatgpt',
      },
      success_url: `${process.env.URL || 'http://localhost:5173'}/workforce?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:5173'}/marketplace?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          employeeId,
          employeeRole,
          provider: provider || 'chatgpt',
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

