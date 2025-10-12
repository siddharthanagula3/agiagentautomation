import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(
      `[Stripe Webhook] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  },
  error: (message: string, error?: any) => {
    console.error(`[Stripe Webhook] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Stripe Webhook] ${message}`, data);
  },
};

// Initialize Stripe with error handling
let stripe: Stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    timeout: 10000, // 10 second timeout
    maxNetworkRetries: 3,
  });
} catch (error) {
  logger.error('Failed to initialize Stripe:', error);
  throw error;
}

// Initialize Supabase with error handling
let supabase: ReturnType<typeof createClient>;
try {
  if (
    !process.env.VITE_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase environment variables are required');
  }
  supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
} catch (error) {
  logger.error('Failed to initialize Supabase:', error);
  throw error;
}

// Webhook event processing registry for idempotency
const processedEvents = new Set<string>();

// Helper function to check if event was already processed
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

// Helper function to mark event as processed
function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  // Clean up old events (keep only last 1000)
  if (processedEvents.size > 1000) {
    const eventsArray = Array.from(processedEvents);
    eventsArray
      .slice(0, eventsArray.length - 1000)
      .forEach(id => processedEvents.delete(id));
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now();

  try {
    // Validate request
    if (!event.body) {
      logger.error('No request body provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No request body provided' }),
      };
    }

    const sig = event.headers['stripe-signature'];
    if (!sig) {
      logger.error('No signature provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No signature provided' }),
      };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET environment variable is required');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' }),
      };
    }

    // Verify webhook signature
    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }),
      };
    }

    // Check for idempotency
    if (isEventProcessed(stripeEvent.id)) {
      logger.info(`Event ${stripeEvent.id} already processed, skipping`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          received: true,
          message: 'Event already processed',
        }),
      };
    }

    logger.info(`Processing event: ${stripeEvent.type}`, {
      eventId: stripeEvent.id,
      created: stripeEvent.created,
    });

    // Process the event
    try {
      await processStripeEvent(stripeEvent);

      // Mark event as processed only after successful processing
      markEventProcessed(stripeEvent.id);

      const processingTime = Date.now() - startTime;
      logger.info(`Event ${stripeEvent.id} processed successfully`, {
        processingTime: `${processingTime}ms`,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          received: true,
          eventId: stripeEvent.id,
          processingTime: `${processingTime}ms`,
        }),
      };
    } catch (processingError) {
      logger.error(
        `Failed to process event ${stripeEvent.id}:`,
        processingError
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Event processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
          eventId: stripeEvent.id,
        }),
      };
    }
  } catch (error) {
    logger.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    };
  }
};

// Separate function for processing Stripe events
async function processStripeEvent(stripeEvent: Stripe.Event): Promise<void> {
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      logger.info('Checkout completed', { sessionId: session.id });

      const {
        userId,
        employeeId,
        employeeName,
        employeeRole,
        provider,
        plan,
        billingPeriod,
      } = session.metadata || {};

      logger.info('Session metadata', session.metadata);

      // Get the subscription ID and customer ID
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      // Handle Pro or Max Plan Subscription
      if ((plan === 'pro' || plan === 'max') && userId) {
        logger.info(`Processing ${plan.toUpperCase()} plan subscription`, {
          userId,
          subscriptionId,
          customerId,
        });

        // Calculate subscription dates
        const now = new Date();
        const endDate = new Date(now);
        if (billingPeriod === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update user's plan and Stripe info with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let userUpdateError: any = null;

        while (retryCount < maxRetries) {
          try {
            const { error } = await supabase
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

            if (error) {
              userUpdateError = error;
              retryCount++;
              if (retryCount < maxRetries) {
                logger.warn(
                  `User update attempt ${retryCount} failed, retrying...`,
                  error
                );
                await new Promise(resolve =>
                  setTimeout(resolve, 1000 * retryCount)
                ); // Exponential backoff
              }
            } else {
              logger.info(
                `Successfully upgraded user to ${plan.toUpperCase()} plan`,
                { userId }
              );
              break;
            }
          } catch (error) {
            userUpdateError = error;
            retryCount++;
            if (retryCount < maxRetries) {
              logger.warn(
                `User update attempt ${retryCount} failed with exception, retrying...`,
                error
              );
              await new Promise(resolve =>
                setTimeout(resolve, 1000 * retryCount)
              );
            }
          }
        }

        if (userUpdateError && retryCount >= maxRetries) {
          logger.error(
            `Failed to update user to ${plan} plan after ${maxRetries} attempts:`,
            userUpdateError
          );
          throw new Error(
            `Failed to update user subscription: ${userUpdateError.message || 'Unknown error'}`
          );
        }

        break;
      }

      // AI Employee purchases are now free - no Stripe handling needed
      logger.info('Checkout session completed (not a subscription)');
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = stripeEvent.data.object as Stripe.Invoice;
      logger.info('Payment succeeded', { invoiceId: invoice.id });

      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        try {
          // Update user subscription status to active
          const { error } = await supabase
            .from('users')
            .update({
              plan_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            logger.error('Failed to update user subscription status:', error);
            throw error;
          } else {
            logger.info('Successfully updated user subscription to active', {
              subscriptionId,
            });
          }
        } catch (error) {
          logger.error('Error processing payment succeeded event:', error);
          throw error;
        }
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice;
      logger.info('Payment failed', { invoiceId: invoice.id });

      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        try {
          // Update user subscription status to past_due
          const { error } = await supabase
            .from('users')
            .update({
              plan_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            logger.error(
              'Failed to update user subscription status to past_due:',
              error
            );
            throw error;
          } else {
            logger.info('Successfully updated user subscription to past_due', {
              subscriptionId,
            });
          }
        } catch (error) {
          logger.error('Error processing payment failed event:', error);
          throw error;
        }
      }

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      logger.info('Subscription updated', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      const now = new Date();

      try {
        // Update user plan status
        const { error: userError } = await supabase
          .from('users')
          .update({
            plan_status:
              subscription.status === 'active'
                ? 'active'
                : subscription.status === 'past_due'
                  ? 'past_due'
                  : subscription.status === 'canceled'
                    ? 'cancelled'
                    : 'unpaid',
            subscription_end_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: now.toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (userError) {
          logger.error('Failed to update user subscription status:', userError);
          throw userError;
        } else {
          logger.info('Successfully updated user subscription status', {
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        }
      } catch (error) {
        logger.error('Error processing subscription updated event:', error);
        throw error;
      }

      // AI Employees are free - no need to update purchased_employees
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      logger.info('Subscription deleted', { subscriptionId: subscription.id });

      const now = new Date();

      try {
        // Downgrade user to free plan with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let userUpdateError: any = null;

        while (retryCount < maxRetries) {
          try {
            const { error } = await supabase
              .from('users')
              .update({
                plan: 'free',
                plan_status: 'cancelled',
                subscription_end_date: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('stripe_subscription_id', subscription.id);

            if (error) {
              userUpdateError = error;
              retryCount++;
              if (retryCount < maxRetries) {
                logger.warn(
                  `User downgrade attempt ${retryCount} failed, retrying...`,
                  error
                );
                await new Promise(resolve =>
                  setTimeout(resolve, 1000 * retryCount)
                ); // Exponential backoff
              }
            } else {
              logger.info('Successfully downgraded user to free plan', {
                subscriptionId: subscription.id,
              });
              break;
            }
          } catch (error) {
            userUpdateError = error;
            retryCount++;
            if (retryCount < maxRetries) {
              logger.warn(
                `User downgrade attempt ${retryCount} failed with exception, retrying...`,
                error
              );
              await new Promise(resolve =>
                setTimeout(resolve, 1000 * retryCount)
              );
            }
          }
        }

        if (userUpdateError && retryCount >= maxRetries) {
          logger.error(
            `Failed to downgrade user to free plan after ${maxRetries} attempts:`,
            userUpdateError
          );
          throw new Error(
            `Failed to downgrade user subscription: ${userUpdateError.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        logger.error('Error processing subscription deleted event:', error);
        throw error;
      }

      // AI Employees remain active - they are free and not tied to subscriptions
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      logger.info('Trial will end', {
        subscriptionId: subscription.id,
        trialEnd: subscription.trial_end,
      });

      // Could send notification email to user about trial ending
      // For now, just log the event
      break;
    }

    case 'invoice.upcoming': {
      const invoice = stripeEvent.data.object as Stripe.Invoice;
      logger.info('Upcoming invoice', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      });

      // Could send notification email to user about upcoming payment
      // For now, just log the event
      break;
    }

    case 'payment_method.attached': {
      const paymentMethod = stripeEvent.data.object as Stripe.PaymentMethod;
      logger.info('Payment method attached', {
        paymentMethodId: paymentMethod.id,
        customerId: paymentMethod.customer,
      });
      break;
    }

    case 'payment_method.detached': {
      const paymentMethod = stripeEvent.data.object as Stripe.PaymentMethod;
      logger.info('Payment method detached', {
        paymentMethodId: paymentMethod.id,
        customerId: paymentMethod.customer,
      });
      break;
    }

    default:
      logger.info('Unhandled event type', { eventType: stripeEvent.type });
  }
}
