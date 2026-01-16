import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { withAuth } from '../utils/auth-middleware';
import { withRateLimitTier } from '../utils/rate-limiter';
import { createClient } from '@supabase/supabase-js';
import {
  billingPortalSchema,
  formatValidationError,
} from '../utils/validation-schemas';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Updated: Nov 16th 2025 - Fixed missing authentication on Stripe payment endpoint
// Updated: Jan 10th 2026 - Added rate limiting and Zod validation
const authenticatedHandler = async (event: HandlerEvent & { user: { id: string; email?: string } }, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // SECURITY: Validate request body with Zod schema
    const parseResult = billingPortalSchema.safeParse(
      JSON.parse(event.body || '{}')
    );

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify(formatValidationError(parseResult.error)),
      };
    }

    const { customerId } = parseResult.data;

    // Updated: Nov 16th 2025 - Fixed missing authentication - verify customer belongs to authenticated user
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use .maybeSingle() to avoid 406 errors when subscription doesn't exist
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (!subscription || subscription.user_id !== event.user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: Customer ID does not belong to authenticated user',
        }),
      };
    }

    console.log('[Billing Portal] Creating session for customer:', customerId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.URL || 'http://localhost:5173'}/workforce`,
    });

    console.log('[Billing Portal] Session created:', session.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('[Billing Portal] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    };
  }
};

// Updated: Nov 16th 2025 - Fixed missing authentication - wrap handler with withAuth
// Updated: Jan 10th 2026 - Added payment tier rate limiting (5 req/min)
export const handler: Handler = withAuth(
  withRateLimitTier('payment')(authenticatedHandler)
);
