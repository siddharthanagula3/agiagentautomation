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

        const { userId, employeeId, employeeName, employeeRole, provider, plan, billingPeriod } = session.metadata || {};

        console.log('[Stripe Webhook] Session metadata:', session.metadata);

        // Get the subscription ID and customer ID
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Handle Pro or Max Plan Subscription
        if ((plan === 'pro' || plan === 'max') && userId) {
          console.log(`[Stripe Webhook] Processing ${plan.toUpperCase()} plan subscription for user:`, userId);

          // Calculate subscription dates
          const now = new Date();
          const endDate = new Date(now);
          if (billingPeriod === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          // Update user's plan and Stripe info
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({
              plan: plan, // 'pro' or 'max'
              plan_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_start_date: now.toISOString(),
              subscription_end_date: endDate.toISOString(),
              billing_period: billingPeriod || 'monthly',
              updated_at: now.toISOString(),
            })
            .eq('id', userId);

          if (userUpdateError) {
            console.error(`[Stripe Webhook] Failed to update user to ${plan} plan:`, userUpdateError);
          } else {
            console.log(`[Stripe Webhook] Successfully upgraded user to ${plan.toUpperCase()} plan`);
          }

          break;
        }

        // Handle AI Employee Purchase (legacy flow)
        if (!userId || !employeeId || !employeeName || !employeeRole) {
          console.error('[Stripe Webhook] Missing metadata in session:', {
            userId: !!userId,
            employeeId: !!employeeId,
            employeeName: !!employeeName,
            employeeRole: !!employeeRole,
            provider: !!provider
          });
          break;
        }

        // Use provider from metadata (passed from frontend via checkout session)
        const employeeProvider = provider || 'chatgpt';
        console.log('[Stripe Webhook] Using provider:', employeeProvider);

        // Create purchased employee record
        const { data: insertData, error: purchaseError } = await supabase
          .from('purchased_employees')
          .insert({
            user_id: userId,
            employee_id: employeeId,
            name: employeeName,
            role: employeeRole,
            provider: employeeProvider,
            is_active: true,
          })
          .select();

        if (purchaseError) {
          console.error('[Stripe Webhook] Failed to create purchased employee:', purchaseError);
          console.error('[Stripe Webhook] Error details:', JSON.stringify(purchaseError, null, 2));
        } else {
          console.log('[Stripe Webhook] Successfully created purchased employee:', insertData);
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
        const now = new Date();

        // Update user plan status
        const { error: userError } = await supabase
          .from('users')
          .update({
            plan_status: subscription.status === 'active' ? 'active' : 
                         subscription.status === 'past_due' ? 'past_due' :
                         subscription.status === 'canceled' ? 'cancelled' : 'unpaid',
            subscription_end_date: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
            updated_at: now.toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (userError) {
          console.error('[Stripe Webhook] Failed to update user subscription status:', userError);
        }

        // Also update purchased employees if any
        const { error } = await supabase
          .from('purchased_employees')
          .update({
            is_active: isActive,
            updated_at: now.toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Stripe Webhook] Failed to update purchased employee subscription:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);
        
        const now = new Date();

        // Downgrade user to free plan
        const { error: userError } = await supabase
          .from('users')
          .update({
            plan: 'free',
            plan_status: 'cancelled',
            subscription_end_date: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (userError) {
          console.error('[Stripe Webhook] Failed to downgrade user to free plan:', userError);
        }

        // Soft delete - mark purchased employees as inactive
        const { error } = await supabase
          .from('purchased_employees')
          .update({
            is_active: false,
            updated_at: now.toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[Stripe Webhook] Failed to deactivate purchased employees:', error);
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

