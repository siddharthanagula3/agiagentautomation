/**
 * Stripe Payment Integration Service
 * Handles all Stripe-related operations for AI employee subscriptions
 */

import { loadStripe } from '@stripe/stripe-js';

// Lazy loader with guard
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;
function getStripe() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    try {
      stripePromise = loadStripe(publishableKey);
    } catch (e) {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
}

export interface CheckoutSessionData {
  employeeId: string;
  employeeRole: string;
  price: number;
  userId: string;
  userEmail: string;
  provider?: string; // LLM provider (chatgpt, claude, gemini, perplexity)
}

/**
 * Create a Stripe Checkout session and redirect to payment
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<void> {
  try {
    console.log('[Stripe Service] Creating checkout session:', data);

    // Call Netlify function to create checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    console.log('[Stripe Service] Checkout session created:', sessionId);

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      // Fallback: use Stripe.js redirect
      const stripe = await getStripe();
      if (!stripe) {
        console.warn('[Stripe Service] Stripe.js not available or publishable key missing. Redirect URL expected.');
        throw new Error('Payment temporarily unavailable: Stripe.js not loaded.');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('[Stripe Service] Checkout error:', error);
    throw error;
  }
}

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openBillingPortal(customerId: string): Promise<void> {
  try {
    console.log('[Stripe Service] Opening billing portal for customer:', customerId);

    const response = await fetch('/.netlify/functions/get-billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to open billing portal');
    }

    const { url } = await response.json();
    console.log('[Stripe Service] Billing portal URL:', url);

    // Redirect to Stripe Customer Portal
    window.location.href = url;
  } catch (error) {
    console.error('[Stripe Service] Billing portal error:', error);
    throw error;
  }
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey && publishableKey.startsWith('pk_');
}

/**
 * Get Stripe configuration status for debugging
 */
export function getStripeConfig() {
  return {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
      ? `${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` 
      : 'Not configured',
    isConfigured: isStripeConfigured(),
  };
}

/**
 * Manually create purchased employee record (fallback for failed webhooks)
 */
export async function manualPurchaseEmployee(data: {
  userId: string;
  employeeId: string;
  employeeRole: string;
  provider?: string;
  subscriptionId?: string;
  customerId?: string;
}): Promise<void> {
  try {
    const response = await fetch('/.netlify/functions/manual-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create purchased employee record');
    }

    const result = await response.json();
    console.log('[Manual Purchase] Success:', result);
  } catch (error) {
    console.error('[Manual Purchase] Error:', error);
    throw error;
  }
}

