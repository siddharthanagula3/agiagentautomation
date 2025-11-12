import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Enhanced logging utility with structured logging
const logger = {
  info: (message: string, data?: unknown) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'stripe-webhook',
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
    };
    console.log(JSON.stringify(logEntry));
  },
  error: (message: string, error?: unknown) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'stripe-webhook',
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };
    console.error(JSON.stringify(logEntry));
  },
  warn: (message: string, data?: unknown) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'stripe-webhook',
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
    };
    console.warn(JSON.stringify(logEntry));
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        service: 'stripe-webhook',
        message,
        data: data ? JSON.stringify(data, null, 2) : undefined,
      };
      console.log(JSON.stringify(logEntry));
    }
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

// SECURITY FIX: Database-backed idempotency instead of in-memory Set
// In-memory Set resets on server restart, allowing duplicate processing

/**
 * Check if webhook event was already processed (database-backed)
 * CRITICAL: Prevents duplicate processing of Stripe events
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('webhook_audit_log')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('action', 'processed')
      .limit(1);

    if (error) {
      logger.error('Error checking event idempotency:', error);
      // On error, assume not processed to prevent blocking legitimate events
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    logger.error('Exception in isEventProcessed:', error);
    return false;
  }
}

/**
 * Mark event as processed (database-backed)
 * Stores in webhook_audit_log for permanent record
 */
async function markEventProcessed(
  requestId: string,
  eventId: string,
  eventType: string
): Promise<void> {
  try {
    await logAuditTrail(requestId, eventId, eventType, 'processed', {
      timestamp: new Date().toISOString(),
      markedAsProcessed: true,
    });
  } catch (error) {
    logger.warn('Failed to mark event as processed:', error);
    // Non-critical - audit trail logging failure shouldn't block webhook
  }
}

// Rate limiting registry
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per minute per IP

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'",
};

// Maximum payload size (1MB)
const MAX_PAYLOAD_SIZE = 1024 * 1024;

// Validate payload size
function validatePayloadSize(body: string): boolean {
  const size = Buffer.byteLength(body, 'utf8');
  return size <= MAX_PAYLOAD_SIZE;
}

// Audit trail function
async function logAuditTrail(
  requestId: string,
  eventId: string,
  eventType: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const auditEntry = {
      request_id: requestId,
      event_id: eventId,
      event_type: eventType,
      action,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('webhook_audit_log')
      .insert(auditEntry);

    if (error) {
      logger.warn('Failed to log audit trail', { requestId, error });
    }
  } catch (error) {
    logger.warn('Audit trail logging failed', { requestId, error });
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Extract client IP for rate limiting
    const clientIP =
      event.headers['x-forwarded-for'] ||
      event.headers['x-real-ip'] ||
      event.headers['client-ip'] ||
      'unknown';

    logger.info(`Webhook request started`, {
      requestId,
      clientIP,
      userAgent: event.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      logger.warn(`Rate limit exceeded for IP: ${clientIP}`, { requestId });
      return {
        statusCode: 429,
        headers: {
          ...SECURITY_HEADERS,
          'Retry-After': '60',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      };
    }

    // Validate request method
    if (event.httpMethod !== 'POST') {
      logger.error(`Invalid HTTP method: ${event.httpMethod}`, { requestId });
      return {
        statusCode: 405,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Validate request
    if (!event.body) {
      logger.error('No request body provided', { requestId });
      return {
        statusCode: 400,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({ error: 'No request body provided' }),
      };
    }

    // Validate payload size
    if (!validatePayloadSize(event.body)) {
      logger.error('Payload size exceeds maximum allowed size', {
        requestId,
        size: Buffer.byteLength(event.body, 'utf8'),
        maxSize: MAX_PAYLOAD_SIZE,
      });
      return {
        statusCode: 413,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({ error: 'Payload too large' }),
      };
    }

    // Validate content type
    const contentType = event.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      logger.error(`Invalid content type: ${contentType}`, { requestId });
      return {
        statusCode: 400,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({ error: 'Invalid content type' }),
      };
    }

    const sig = event.headers['stripe-signature'];
    if (!sig) {
      logger.error('No signature provided', { requestId });
      return {
        statusCode: 400,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({ error: 'No signature provided' }),
      };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET environment variable is required', {
        requestId,
      });
      return {
        statusCode: 500,
        headers: SECURITY_HEADERS,
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
      logger.error('Signature verification failed:', { requestId, error: err });
      return {
        statusCode: 400,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({
          error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }),
      };
    }

    // CRITICAL: Check for idempotency (database-backed)
    if (await isEventProcessed(stripeEvent.id)) {
      logger.info(`Event ${stripeEvent.id} already processed, skipping`, {
        requestId,
      });
      return {
        statusCode: 200,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({
          received: true,
          message: 'Event already processed',
          requestId,
        }),
      };
    }

    logger.info(`Processing event: ${stripeEvent.type}`, {
      requestId,
      eventId: stripeEvent.id,
      created: stripeEvent.created,
    });

    // Log audit trail for event processing start
    await logAuditTrail(
      requestId,
      stripeEvent.id,
      stripeEvent.type,
      'processing_started',
      {
        eventType: stripeEvent.type,
        eventId: stripeEvent.id,
        created: stripeEvent.created,
      }
    );

    // Process the event
    try {
      await processStripeEvent(stripeEvent, requestId);

      // CRITICAL: Mark event as processed only after successful processing (database-backed)
      await markEventProcessed(requestId, stripeEvent.id, stripeEvent.type);

      const processingTime = Date.now() - startTime;
      logger.info(`Event ${stripeEvent.id} processed successfully`, {
        requestId,
        processingTime: `${processingTime}ms`,
      });

      // Log audit trail for successful processing
      await logAuditTrail(
        requestId,
        stripeEvent.id,
        stripeEvent.type,
        'processing_completed',
        {
          processingTime: `${processingTime}ms`,
          success: true,
        }
      );

      return {
        statusCode: 200,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({
          received: true,
          eventId: stripeEvent.id,
          processingTime: `${processingTime}ms`,
          requestId,
        }),
      };
    } catch (processingError) {
      logger.error(`Failed to process event ${stripeEvent.id}:`, {
        requestId,
        error: processingError,
      });

      // Log audit trail for failed processing
      await logAuditTrail(
        requestId,
        stripeEvent.id,
        stripeEvent.type,
        'processing_failed',
        {
          error:
            processingError instanceof Error
              ? processingError.message
              : 'Unknown error',
          success: false,
        }
      );

      return {
        statusCode: 500,
        headers: SECURITY_HEADERS,
        body: JSON.stringify({
          error: `Event processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
          eventId: stripeEvent.id,
          requestId,
        }),
      };
    }
  } catch (error) {
    logger.error('Webhook handler error:', { requestId, error });
    return {
      statusCode: 500,
      headers: SECURITY_HEADERS,
      body: JSON.stringify({
        error: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId,
      }),
    };
  }
};

// Separate function for processing Stripe events
async function processStripeEvent(
  stripeEvent: Stripe.Event,
  requestId: string
): Promise<void> {
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      logger.info('Checkout completed', { requestId, sessionId: session.id });

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
        let userUpdateError: Error | null = null;

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
                await new Promise((resolve) =>
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
              await new Promise((resolve) =>
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

      // Handle Token Pack Purchase
      if (session.metadata?.type === 'token_pack_purchase' && userId) {
        const tokens = parseInt(session.metadata.tokens || '0', 10);
        const packId = session.metadata.packId;

        logger.info('Processing token pack purchase', {
          requestId,
          userId,
          tokens,
          packId,
          sessionId: session.id,
        });

        if (tokens > 0) {
          try {
            // Use the database function to safely update token balance
            const { data, error } = await supabase.rpc(
              'update_user_token_balance',
              {
                p_user_id: userId,
                p_tokens: tokens,
                p_transaction_type: 'purchase',
                p_transaction_id: session.id,
                p_description: `Purchased ${(tokens / 1000000).toFixed(1)}M token pack`,
                p_metadata: {
                  packId,
                  sessionId: session.id,
                  amountPaid: session.amount_total,
                  currency: session.currency,
                },
              }
            );

            if (error) {
              logger.error('Failed to update user token balance:', {
                requestId,
                userId,
                tokens,
                error,
              });
              throw error;
            }

            logger.info('Successfully added tokens to user balance', {
              requestId,
              userId,
              tokens,
              newBalance: data,
            });

            // Log audit trail
            await logAuditTrail(
              requestId,
              stripeEvent.id,
              'token_pack_purchase',
              'tokens_added',
              {
                userId,
                tokens,
                packId,
                sessionId: session.id,
                newBalance: data,
              }
            );
          } catch (error) {
            logger.error('Error processing token pack purchase:', {
              requestId,
              userId,
              tokens,
              error,
            });
            throw error;
          }
        } else {
          logger.warn('Invalid token amount in purchase', {
            requestId,
            userId,
            tokens,
          });
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
        let userUpdateError: Error | null = null;

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
                await new Promise((resolve) =>
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
              await new Promise((resolve) =>
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
