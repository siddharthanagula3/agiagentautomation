import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Import AI employees data to get correct provider
// Note: In production, this should ideally come from database
const AI_EMPLOYEES_DATA = {
  // This will be populated from the employee metadata in Stripe
  // For now, we'll get it from the database lookup
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event: HandlerEvent) => {
  const sig = event.headers['stripe-signature'];

  if (!sig) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No signature provided' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }),
    };
  }

  console.log('[Stripe Webhook] Event received:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout completed:', session.id);

        const { userId, employeeId, employeeRole, provider } = session.metadata || {};

        if (!userId || !employeeId || !employeeRole) {
          console.error('[Stripe Webhook] Missing metadata in session');
          break;
        }

        // Get the subscription ID
        const subscriptionId = session.subscription as string;

        // Get customer ID
        const customerId = session.customer as string;

        // Use provider from metadata (passed from frontend via checkout session)
        const employeeProvider = provider || 'chatgpt';
        console.log('[Stripe Webhook] Using provider:', employeeProvider);

        // Update user with Stripe customer ID if not already set
        // Note: user_profiles table may not exist, so we'll skip this for now
        // await supabase
        //   .from('user_profiles')
        //   .upsert({
        //     id: userId,
        //     stripe_customer_id: customerId,
        //     updated_at: new Date().toISOString(),
        //   });

        // Create purchased employee record
        const { error: purchaseError } = await supabase
          .from('purchased_employees')
          .insert({
            user_id: userId,
            employee_id: employeeId,
            role: employeeRole,
            provider: employeeProvider, // Use actual LLM provider
            is_active: true,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
          });

        if (purchaseError) {
          console.error('[Stripe Webhook] Failed to create purchased employee:', purchaseError);
        } else {
          console.log('[Stripe Webhook] Successfully created purchased employee');
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Payment succeeded:', invoice.id);

        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Update subscription status to active
          const { error } = await supabase
            .from('purchased_employees')
            .update({
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('[Stripe Webhook] Failed to update subscription status:', error);
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Payment failed:', invoice.id);

        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Deactivate employee access
          const { error } = await supabase
            .from('purchased_employees')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('[Stripe Webhook] Failed to deactivate employee:', error);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription updated:', subscription.id);

        const isActive = subscription.status === 'active';

        const { error } = await supabase
          .from('purchased_employees')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Stripe Webhook] Failed to update subscription:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

        // Soft delete - mark as inactive
        const { error } = await supabase
          .from('purchased_employees')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Stripe Webhook] Failed to delete subscription:', error);
        }

        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', stripeEvent.type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    };
  }
};

