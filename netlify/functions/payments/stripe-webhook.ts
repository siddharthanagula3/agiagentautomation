import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimitWithTier } from '../utils/rate-limiter';

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

// SECURITY FIX: Jan 10th 2026 - Removed in-memory rate limiting
// In-memory rate limiting doesn't work in serverless (stateless, resets on cold start)
// Now using Redis-backed rate limiting via checkRateLimitWithTier('webhook')

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

    // Rate limiting check using Redis-backed rate limiter
    // SECURITY: Uses 'webhook' tier (100 req/min per IP) for high-volume webhook traffic
    const rateLimitResult = await checkRateLimitWithTier(event, 'webhook');
    if (!rateLimitResult.success) {
      logger.warn(`Rate limit exceeded for IP: ${clientIP}`, { requestId });
      return {
        statusCode: 429,
        headers: {
          ...SECURITY_HEADERS,
          'Retry-After': rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            : '60',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            : 60,
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

        // Grant tokens based on plan (Pro: 10M, Max: 40M)
        const tokenGrant = plan === 'pro' ? 10000000 : plan === 'max' ? 40000000 : 0;

        if (tokenGrant > 0) {
          try {
            logger.info(`Granting ${tokenGrant} tokens for ${plan} plan`, {
              userId,
              plan,
              tokenGrant,
            });

            const { data: newBalance, error: tokenError } = await supabase.rpc(
              'update_user_token_balance',
              {
                p_user_id: userId,
                p_tokens: tokenGrant,
                p_transaction_type: 'subscription_grant',
                p_transaction_id: session.id,
                p_description: `${plan.toUpperCase()} plan token grant - ${(tokenGrant / 1000000).toFixed(0)}M tokens`,
                p_metadata: {
                  plan,
                  subscriptionId,
                  customerId,
                  billingPeriod: billingPeriod || 'monthly',
                  sessionId: session.id,
                },
              }
            );

            if (tokenError) {
              logger.error('Failed to grant subscription tokens:', {
                userId,
                plan,
                tokenGrant,
                error: tokenError,
              });
              // Don't throw - plan upgrade succeeded, token grant is supplementary
            } else {
              logger.info('Successfully granted subscription tokens', {
                userId,
                plan,
                tokenGrant,
                newBalance,
              });

              // Log audit trail
              await logAuditTrail(
                requestId,
                stripeEvent.id,
                'subscription_token_grant',
                'tokens_granted',
                {
                  userId,
                  plan,
                  tokenGrant,
                  newBalance,
                  subscriptionId,
                }
              );
            }
          } catch (error) {
            logger.error('Error granting subscription tokens:', {
              userId,
              plan,
              tokenGrant,
              error,
            });
            // Don't throw - plan upgrade succeeded, token grant is supplementary
          }
        }

        break;
      }

      // Handle Token Pack Purchase
      if (session.metadata?.type === 'token_pack_purchase' && userId) {
        const packId = session.metadata.packId;

        // SECURITY FIX: Server-side price validation to prevent token manipulation
        // Define trusted pack configurations (must match buy-token-pack.ts)
        const PACK_PRICES: Record<string, { tokens: number; price: number }> = {
          'pack_500k': { tokens: 500000, price: 10 },
          'pack_1.5m': { tokens: 1500000, price: 25 },
          'pack_5m': { tokens: 5000000, price: 75 },
          'pack_10m': { tokens: 10000000, price: 130 },
        };

        // Validate pack ID exists
        const expectedPack = PACK_PRICES[packId];
        if (!expectedPack) {
          logger.error('Invalid pack ID in purchase', {
            requestId,
            userId,
            packId,
            sessionId: session.id,
          });
          throw new Error(`Invalid pack ID: ${packId}`);
        }

        // Validate amount paid matches expected price
        const paidAmount = (session.amount_total || 0) / 100; // Convert cents to dollars
        if (paidAmount < expectedPack.price) {
          logger.error('Token pack price mismatch - potential fraud attempt', {
            requestId,
            userId,
            packId,
            expectedPrice: expectedPack.price,
            paidAmount,
            sessionId: session.id,
          });
          throw new Error(
            `Payment amount ($${paidAmount}) does not match pack price ($${expectedPack.price})`
          );
        }

        // CRITICAL: Use expected tokens from trusted lookup, NOT metadata
        const tokens = expectedPack.tokens;

        logger.info('Processing token pack purchase', {
          requestId,
          userId,
          tokens,
          packId,
          paidAmount,
          sessionId: session.id,
        });

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
                validatedPrice: expectedPack.price,
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
              paidAmount,
              validatedPrice: expectedPack.price,
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
          // Get user details to check plan and grant monthly tokens
          // Use .maybeSingle() to avoid 406 errors when user doesn't exist
          const { data: user, error: userFetchError } = await supabase
            .from('users')
            .select('id, plan')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle();

          if (userFetchError || !user) {
            logger.error('Failed to fetch user for subscription:', {
              subscriptionId,
              error: userFetchError,
            });
            throw userFetchError || new Error('User not found');
          }

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

          // Grant monthly tokens for Pro/Max plans (recurring payment)
          // Skip the first invoice (handled in checkout.session.completed)
          const isFirstInvoice = invoice.billing_reason === 'subscription_create';

          if (!isFirstInvoice && (user.plan === 'pro' || user.plan === 'max')) {
            // Determine tokens based on plan type: Pro = 10M, Max = 40M
            const monthlyTokens = user.plan === 'max' ? 40000000 : 10000000;

            logger.info('Granting monthly token allocation', {
              userId: user.id,
              plan: user.plan,
              monthlyTokens,
              invoiceId: invoice.id,
            });

            try {
              const { data: newBalance, error: tokenError } = await supabase.rpc(
                'update_user_token_balance',
                {
                  p_user_id: user.id,
                  p_tokens: monthlyTokens,
                  p_transaction_type: 'subscription_grant',
                  p_transaction_id: invoice.id,
                  p_description: `Monthly ${user.plan.toUpperCase()} plan token allocation - ${(monthlyTokens / 1000000).toFixed(0)}M tokens`,
                  p_metadata: {
                    plan: user.plan,
                    subscriptionId,
                    invoiceId: invoice.id,
                    billingReason: invoice.billing_reason,
                    periodStart: invoice.period_start,
                    periodEnd: invoice.period_end,
                  },
                }
              );

              if (tokenError) {
                logger.error('Failed to grant monthly tokens:', {
                  userId: user.id,
                  plan: user.plan,
                  error: tokenError,
                });
                // Don't throw - payment processing succeeded
              } else {
                logger.info('Successfully granted monthly tokens', {
                  userId: user.id,
                  plan: user.plan,
                  monthlyTokens,
                  newBalance,
                });

                // Log audit trail
                await logAuditTrail(
                  requestId,
                  stripeEvent.id,
                  'monthly_token_grant',
                  'tokens_granted',
                  {
                    userId: user.id,
                    plan: user.plan,
                    monthlyTokens,
                    newBalance,
                    invoiceId: invoice.id,
                  }
                );
              }
            } catch (error) {
              logger.error('Error granting monthly tokens:', {
                userId: user.id,
                plan: user.plan,
                error,
              });
              // Don't throw - payment processing succeeded
            }
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
      const FREE_TIER_TOKEN_LIMIT = 1000000; // 1M tokens

      try {
        // First, fetch the user to get their ID for token capping
        const { data: user, error: userFetchError } = await supabase
          .from('users')
          .select('id, plan')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (userFetchError) {
          logger.error('Failed to fetch user for subscription cancellation:', {
            subscriptionId: subscription.id,
            error: userFetchError,
          });
          throw userFetchError;
        }

        if (!user) {
          logger.warn('No user found for cancelled subscription', {
            subscriptionId: subscription.id,
          });
          // Still process as successful - subscription might have been manually deleted
          break;
        }

        const previousPlan = user.plan;

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
                userId: user.id,
                previousPlan,
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

        // SECURITY: Cap token balance at free tier limit to prevent abuse
        // Users should not retain excess tokens after cancellation
        logger.info('Capping token balance for cancelled subscription', {
          requestId,
          userId: user.id,
          subscriptionId: subscription.id,
          previousPlan,
          capAmount: FREE_TIER_TOKEN_LIMIT,
        });

        try {
          // Call the cap_user_token_balance RPC function with retry logic
          let capRetryCount = 0;
          let capError: Error | null = null;

          while (capRetryCount < maxRetries) {
            try {
              const { data: capResult, error: rpcError } = await supabase.rpc(
                'cap_user_token_balance',
                {
                  p_user_id: user.id,
                  p_cap_amount: FREE_TIER_TOKEN_LIMIT,
                  p_reason: `Subscription cancelled (was ${previousPlan} plan) - balance capped to free tier limit`,
                }
              );

              if (rpcError) {
                capError = rpcError;
                capRetryCount++;
                if (capRetryCount < maxRetries) {
                  logger.warn(
                    `Token cap attempt ${capRetryCount} failed, retrying...`,
                    { requestId, error: rpcError }
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * capRetryCount)
                  );
                }
              } else {
                // Log the capping result
                const result = capResult?.[0] || capResult;
                if (result?.was_capped) {
                  logger.info('Successfully capped user token balance', {
                    requestId,
                    userId: user.id,
                    previousBalance: result.previous_balance,
                    newBalance: result.new_balance,
                    tokensRemoved: result.tokens_removed,
                    subscriptionId: subscription.id,
                  });

                  // Log audit trail for token capping
                  await logAuditTrail(
                    requestId,
                    stripeEvent.id,
                    'subscription_token_cap',
                    'tokens_capped',
                    {
                      userId: user.id,
                      previousPlan,
                      previousBalance: result.previous_balance,
                      newBalance: result.new_balance,
                      tokensRemoved: result.tokens_removed,
                      capAmount: FREE_TIER_TOKEN_LIMIT,
                      subscriptionId: subscription.id,
                    }
                  );
                } else {
                  logger.info('User token balance was already within free tier limit', {
                    requestId,
                    userId: user.id,
                    currentBalance: result?.previous_balance || 'unknown',
                    subscriptionId: subscription.id,
                  });

                  // Still log for audit even if no capping was needed
                  await logAuditTrail(
                    requestId,
                    stripeEvent.id,
                    'subscription_token_cap',
                    'no_cap_needed',
                    {
                      userId: user.id,
                      previousPlan,
                      currentBalance: result?.previous_balance,
                      capAmount: FREE_TIER_TOKEN_LIMIT,
                      subscriptionId: subscription.id,
                    }
                  );
                }
                break;
              }
            } catch (error) {
              capError = error instanceof Error ? error : new Error(String(error));
              capRetryCount++;
              if (capRetryCount < maxRetries) {
                logger.warn(
                  `Token cap attempt ${capRetryCount} failed with exception, retrying...`,
                  { requestId, error }
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * capRetryCount)
                );
              }
            }
          }

          if (capError && capRetryCount >= maxRetries) {
            // Log the failure but don't throw - plan downgrade succeeded
            // Token capping failure should be investigated but not block the webhook
            logger.error(
              `Failed to cap token balance after ${maxRetries} attempts - MANUAL REVIEW REQUIRED`,
              {
                requestId,
                userId: user.id,
                subscriptionId: subscription.id,
                error: capError,
              }
            );

            // Log audit trail for failed capping
            await logAuditTrail(
              requestId,
              stripeEvent.id,
              'subscription_token_cap',
              'cap_failed',
              {
                userId: user.id,
                previousPlan,
                subscriptionId: subscription.id,
                error: capError instanceof Error ? capError.message : String(capError),
                requiresManualReview: true,
              }
            );
          }
        } catch (error) {
          // Non-critical error - log but don't block webhook
          logger.error('Exception during token capping:', {
            requestId,
            userId: user.id,
            subscriptionId: subscription.id,
            error,
          });
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

    case 'charge.refunded': {
      const charge = stripeEvent.data.object as Stripe.Charge;
      logger.info('Charge refunded', {
        requestId,
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded,
        refunded: charge.refunded,
      });

      // Find the original token purchase from token_transactions
      try {
        const { data: transactions, error: fetchError } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('transaction_id', charge.id)
          .eq('transaction_type', 'purchase')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          logger.error('Failed to fetch original token transaction:', {
            requestId,
            chargeId: charge.id,
            error: fetchError,
          });
          throw fetchError;
        }

        if (!transactions || transactions.length === 0) {
          // Check if this is a subscription payment instead of token purchase
          const { data: subscriptionTxns, error: subFetchError } = await supabase
            .from('token_transactions')
            .select('*')
            .eq('transaction_id', charge.id)
            .eq('transaction_type', 'subscription_grant')
            .order('created_at', { ascending: false })
            .limit(1);

          if (subFetchError) {
            logger.error('Failed to fetch subscription transaction:', {
              requestId,
              chargeId: charge.id,
              error: subFetchError,
            });
            throw subFetchError;
          }

          if (subscriptionTxns && subscriptionTxns.length > 0) {
            // Subscription refund - deduct the granted tokens
            const transaction = subscriptionTxns[0];
            const tokensToDeduct = -transaction.tokens; // Negative to deduct

            logger.info('Processing subscription refund', {
              requestId,
              userId: transaction.user_id,
              tokensToDeduct: Math.abs(tokensToDeduct),
              originalTransaction: transaction.id,
            });

            // Deduct tokens atomically with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            let refundError: Error | null = null;

            while (retryCount < maxRetries) {
              try {
                const { data: newBalance, error: deductError } =
                  await supabase.rpc('update_user_token_balance', {
                    p_user_id: transaction.user_id,
                    p_tokens: tokensToDeduct,
                    p_transaction_type: 'refund',
                    p_transaction_id: charge.id,
                    p_description: `Refund for subscription payment - ${Math.abs(tokensToDeduct).toLocaleString()} tokens deducted`,
                    p_metadata: {
                      chargeId: charge.id,
                      amountRefunded: charge.amount_refunded,
                      originalTransactionId: transaction.id,
                      refundReason: charge.refunds?.data?.[0]?.reason || 'unknown',
                      refundedAt: new Date().toISOString(),
                    },
                  });

                if (deductError) {
                  refundError = deductError;
                  retryCount++;
                  if (retryCount < maxRetries) {
                    logger.warn(
                      `Token deduction attempt ${retryCount} failed, retrying...`,
                      { requestId, error: deductError }
                    );
                    await new Promise((resolve) =>
                      setTimeout(resolve, 1000 * retryCount)
                    );
                  }
                } else {
                  logger.info('Successfully processed subscription refund', {
                    requestId,
                    userId: transaction.user_id,
                    tokensDeducted: Math.abs(tokensToDeduct),
                    newBalance,
                  });

                  // Log audit trail
                  await logAuditTrail(
                    requestId,
                    stripeEvent.id,
                    'subscription_refund',
                    'tokens_deducted',
                    {
                      userId: transaction.user_id,
                      tokensDeducted: Math.abs(tokensToDeduct),
                      newBalance,
                      chargeId: charge.id,
                      amountRefunded: charge.amount_refunded,
                    }
                  );
                  break;
                }
              } catch (error) {
                refundError = error;
                retryCount++;
                if (retryCount < maxRetries) {
                  logger.warn(
                    `Token deduction attempt ${retryCount} failed with exception, retrying...`,
                    { requestId, error }
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * retryCount)
                  );
                }
              }
            }

            if (refundError && retryCount >= maxRetries) {
              logger.error(
                `Failed to process subscription refund after ${maxRetries} attempts:`,
                { requestId, error: refundError }
              );
              throw new Error(
                `Failed to process subscription refund: ${refundError.message || 'Unknown error'}`
              );
            }
          } else {
            logger.warn('No matching transaction found for refunded charge', {
              requestId,
              chargeId: charge.id,
            });
            // Log audit trail for unmatched refund
            await logAuditTrail(
              requestId,
              stripeEvent.id,
              'charge_refunded',
              'no_matching_transaction',
              {
                chargeId: charge.id,
                amountRefunded: charge.amount_refunded,
                message: 'No matching token transaction found',
              }
            );
          }
        } else {
          // Token pack purchase refund
          const transaction = transactions[0];
          const tokensToDeduct = -transaction.tokens; // Negative to deduct

          logger.info('Processing token pack refund', {
            requestId,
            userId: transaction.user_id,
            tokensToDeduct: Math.abs(tokensToDeduct),
            originalTransaction: transaction.id,
          });

          // Deduct tokens atomically with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          let refundError: Error | null = null;

          while (retryCount < maxRetries) {
            try {
              const { data: newBalance, error: deductError } = await supabase.rpc(
                'update_user_token_balance',
                {
                  p_user_id: transaction.user_id,
                  p_tokens: tokensToDeduct,
                  p_transaction_type: 'refund',
                  p_transaction_id: charge.id,
                  p_description: `Refund for token pack purchase - ${Math.abs(tokensToDeduct).toLocaleString()} tokens deducted`,
                  p_metadata: {
                    chargeId: charge.id,
                    amountRefunded: charge.amount_refunded,
                    originalTransactionId: transaction.id,
                    refundReason: charge.refunds?.data?.[0]?.reason || 'unknown',
                    refundedAt: new Date().toISOString(),
                  },
                }
              );

              if (deductError) {
                refundError = deductError;
                retryCount++;
                if (retryCount < maxRetries) {
                  logger.warn(
                    `Token deduction attempt ${retryCount} failed, retrying...`,
                    { requestId, error: deductError }
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * retryCount)
                  );
                }
              } else {
                logger.info('Successfully processed token pack refund', {
                  requestId,
                  userId: transaction.user_id,
                  tokensDeducted: Math.abs(tokensToDeduct),
                  newBalance,
                });

                // Log audit trail
                await logAuditTrail(
                  requestId,
                  stripeEvent.id,
                  'token_pack_refund',
                  'tokens_deducted',
                  {
                    userId: transaction.user_id,
                    tokensDeducted: Math.abs(tokensToDeduct),
                    newBalance,
                    chargeId: charge.id,
                    amountRefunded: charge.amount_refunded,
                  }
                );
                break;
              }
            } catch (error) {
              refundError = error;
              retryCount++;
              if (retryCount < maxRetries) {
                logger.warn(
                  `Token deduction attempt ${retryCount} failed with exception, retrying...`,
                  { requestId, error }
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * retryCount)
                );
              }
            }
          }

          if (refundError && retryCount >= maxRetries) {
            logger.error(
              `Failed to process token pack refund after ${maxRetries} attempts:`,
              { requestId, error: refundError }
            );
            throw new Error(
              `Failed to process token pack refund: ${refundError.message || 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        logger.error('Error processing charge refund event:', {
          requestId,
          chargeId: charge.id,
          error,
        });
        throw error;
      }

      break;
    }

    case 'charge.dispute.created': {
      const dispute = stripeEvent.data.object as Stripe.Dispute;
      logger.info('Dispute created', {
        requestId,
        disputeId: dispute.id,
        chargeId: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
        status: dispute.status,
      });

      try {
        // Find the original transaction
        const { data: transactions, error: fetchError } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('transaction_id', dispute.charge as string)
          .in('transaction_type', ['purchase', 'subscription_grant'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          logger.error('Failed to fetch transaction for dispute:', {
            requestId,
            disputeId: dispute.id,
            error: fetchError,
          });
          throw fetchError;
        }

        if (transactions && transactions.length > 0) {
          const transaction = transactions[0];

          // Update user account to flag dispute
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({
              // Note: Add a 'dispute_status' column to users table if you want to track this
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.user_id);

          if (userUpdateError) {
            logger.warn('Failed to update user account for dispute:', {
              requestId,
              userId: transaction.user_id,
              error: userUpdateError,
            });
            // Non-critical - continue processing
          }

          // Log dispute to audit trail
          await logAuditTrail(
            requestId,
            stripeEvent.id,
            'charge_dispute_created',
            'dispute_flagged',
            {
              userId: transaction.user_id,
              disputeId: dispute.id,
              chargeId: dispute.charge,
              amount: dispute.amount,
              reason: dispute.reason,
              status: dispute.status,
              tokensInvolved: transaction.tokens,
              transactionType: transaction.transaction_type,
              evidence_due_by: dispute.evidence_details?.due_by,
            }
          );

          logger.info('Successfully logged dispute for user account', {
            requestId,
            userId: transaction.user_id,
            disputeId: dispute.id,
            tokensInvolved: transaction.tokens,
          });

          // Note: You may want to deduct tokens immediately or wait for dispute resolution
          // For now, we just log the dispute. Consider implementing automatic token deduction
          // or account suspension based on your business requirements.
          logger.warn('DISPUTE CREATED - Manual review recommended', {
            requestId,
            userId: transaction.user_id,
            disputeId: dispute.id,
            amount: dispute.amount,
            reason: dispute.reason,
            tokensInvolved: transaction.tokens,
          });
        } else {
          logger.warn('No matching transaction found for disputed charge', {
            requestId,
            disputeId: dispute.id,
            chargeId: dispute.charge,
          });

          // Log audit trail for unmatched dispute
          await logAuditTrail(
            requestId,
            stripeEvent.id,
            'charge_dispute_created',
            'no_matching_transaction',
            {
              disputeId: dispute.id,
              chargeId: dispute.charge,
              amount: dispute.amount,
              reason: dispute.reason,
              message: 'No matching token transaction found',
            }
          );
        }
      } catch (error) {
        logger.error('Error processing dispute created event:', {
          requestId,
          disputeId: dispute.id,
          error,
        });
        throw error;
      }

      break;
    }

    case 'charge.dispute.closed': {
      const dispute = stripeEvent.data.object as Stripe.Dispute;
      logger.info('Dispute closed', {
        requestId,
        disputeId: dispute.id,
        chargeId: dispute.charge,
        status: dispute.status,
      });

      try {
        // Find the original transaction
        const { data: transactions, error: fetchError } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('transaction_id', dispute.charge as string)
          .in('transaction_type', ['purchase', 'subscription_grant'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          logger.error('Failed to fetch transaction for dispute closure:', {
            requestId,
            disputeId: dispute.id,
            error: fetchError,
          });
          throw fetchError;
        }

        if (transactions && transactions.length > 0) {
          const transaction = transactions[0];

          // If dispute was lost, deduct tokens
          if (dispute.status === 'lost') {
            const tokensToDeduct = -transaction.tokens; // Negative to deduct

            logger.info('Processing lost dispute - deducting tokens', {
              requestId,
              userId: transaction.user_id,
              tokensToDeduct: Math.abs(tokensToDeduct),
              disputeId: dispute.id,
            });

            // Deduct tokens atomically with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            let disputeError: Error | null = null;

            while (retryCount < maxRetries) {
              try {
                const { data: newBalance, error: deductError } =
                  await supabase.rpc('update_user_token_balance', {
                    p_user_id: transaction.user_id,
                    p_tokens: tokensToDeduct,
                    p_transaction_type: 'chargeback',
                    p_transaction_id: dispute.id,
                    p_description: `Chargeback - dispute lost - ${Math.abs(tokensToDeduct).toLocaleString()} tokens deducted`,
                    p_metadata: {
                      disputeId: dispute.id,
                      chargeId: dispute.charge,
                      disputeReason: dispute.reason,
                      disputeStatus: dispute.status,
                      originalTransactionId: transaction.id,
                      chargebackAt: new Date().toISOString(),
                    },
                  });

                if (deductError) {
                  disputeError = deductError;
                  retryCount++;
                  if (retryCount < maxRetries) {
                    logger.warn(
                      `Token deduction for lost dispute attempt ${retryCount} failed, retrying...`,
                      { requestId, error: deductError }
                    );
                    await new Promise((resolve) =>
                      setTimeout(resolve, 1000 * retryCount)
                    );
                  }
                } else {
                  logger.info('Successfully processed lost dispute token deduction', {
                    requestId,
                    userId: transaction.user_id,
                    tokensDeducted: Math.abs(tokensToDeduct),
                    newBalance,
                  });

                  // Log audit trail
                  await logAuditTrail(
                    requestId,
                    stripeEvent.id,
                    'dispute_lost',
                    'tokens_deducted',
                    {
                      userId: transaction.user_id,
                      tokensDeducted: Math.abs(tokensToDeduct),
                      newBalance,
                      disputeId: dispute.id,
                      chargeId: dispute.charge,
                    }
                  );
                  break;
                }
              } catch (error) {
                disputeError = error;
                retryCount++;
                if (retryCount < maxRetries) {
                  logger.warn(
                    `Token deduction for lost dispute attempt ${retryCount} failed with exception, retrying...`,
                    { requestId, error }
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * retryCount)
                  );
                }
              }
            }

            if (disputeError && retryCount >= maxRetries) {
              logger.error(
                `Failed to process lost dispute after ${maxRetries} attempts:`,
                { requestId, error: disputeError }
              );
              throw new Error(
                `Failed to process lost dispute: ${disputeError.message || 'Unknown error'}`
              );
            }
          } else if (dispute.status === 'won') {
            // Dispute won - no action needed, log for audit
            logger.info('Dispute won - no token deduction needed', {
              requestId,
              userId: transaction.user_id,
              disputeId: dispute.id,
            });

            await logAuditTrail(
              requestId,
              stripeEvent.id,
              'dispute_won',
              'no_action_needed',
              {
                userId: transaction.user_id,
                disputeId: dispute.id,
                chargeId: dispute.charge,
                tokensPreserved: transaction.tokens,
              }
            );
          }
        } else {
          logger.warn('No matching transaction found for closed dispute', {
            requestId,
            disputeId: dispute.id,
            chargeId: dispute.charge,
          });

          // Log audit trail for unmatched dispute
          await logAuditTrail(
            requestId,
            stripeEvent.id,
            'charge_dispute_closed',
            'no_matching_transaction',
            {
              disputeId: dispute.id,
              chargeId: dispute.charge,
              status: dispute.status,
              message: 'No matching token transaction found',
            }
          );
        }
      } catch (error) {
        logger.error('Error processing dispute closed event:', {
          requestId,
          disputeId: dispute.id,
          error,
        });
        throw error;
      }

      break;
    }

    case 'payment_intent.canceled': {
      const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
      logger.info('Payment intent canceled', {
        requestId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        cancellationReason: paymentIntent.cancellation_reason,
      });

      // Log audit trail for canceled payment intent
      await logAuditTrail(
        requestId,
        stripeEvent.id,
        'payment_intent_canceled',
        'payment_canceled',
        {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          cancellationReason: paymentIntent.cancellation_reason,
          canceledAt: new Date().toISOString(),
          metadata: paymentIntent.metadata,
        }
      );

      // Note: No token deduction needed - payment was canceled before completion
      // If tokens were provisionally granted, they should be reverted here
      // For now, we just log the cancellation
      logger.info('Payment canceled before completion - no token impact', {
        requestId,
        paymentIntentId: paymentIntent.id,
      });

      break;
    }

    default:
      logger.info('Unhandled event type', { eventType: stripeEvent.type });
  }
}
