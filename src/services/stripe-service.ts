/**
 * Stripe Payment Integration Service
 * Handles all Stripe-related operations for AI employee subscriptions
 */

import { loadStripe } from '@stripe/stripe-js';

// Lazy loader with guard
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null =
  null;
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

// Employee purchase functions removed - hiring is now free

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openBillingPortal(customerId: string): Promise<void> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        '[Stripe Service] Opening billing portal for customer:',
        customerId
      );
    }

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
    if (import.meta.env.DEV) {
      console.log('[Stripe Service] Billing portal URL:', url);
    }

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

// Manual purchase function removed - hiring is now free

/**
 * Create subscription checkout session
 */
export async function createSubscriptionCheckout(
  priceId: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<void> {
  try {
    if (import.meta.env.DEV) {
      console.log('[Stripe Service] Creating subscription checkout:', {
        priceId,
        billingPeriod,
      });
    }

    // Call Netlify function to create subscription checkout session
    const response = await fetch(
      '/.netlify/functions/create-pro-subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          billingPeriod,
          // These would be passed from the calling component
          userId: 'current-user-id', // This should be passed as parameter
          userEmail: 'user@example.com', // This should be passed as parameter
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create subscription checkout');
    }

    const { url } = await response.json();
    if (import.meta.env.DEV) {
      console.log('[Stripe Service] Subscription checkout URL:', url);
    }

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received from server');
    }
  } catch (error) {
    console.error('[Stripe Service] Subscription checkout error:', error);
    throw error;
  }
}

/**
 * Create Pro Plan subscription and redirect to Stripe Checkout
 */
export async function upgradeToProPlan(data: {
  userId: string;
  userEmail: string;
  billingPeriod?: 'monthly' | 'yearly';
}): Promise<void> {
  return upgradeToPlan({ ...data, plan: 'pro' });
}

/**
 * Create Max Plan subscription and redirect to Stripe Checkout
 */
export async function upgradeToMaxPlan(data: {
  userId: string;
  userEmail: string;
  billingPeriod?: 'monthly' | 'yearly';
}): Promise<void> {
  return upgradeToPlan({ ...data, plan: 'max' });
}

/**
 * Generic function to upgrade to any plan
 */
async function upgradeToPlan(data: {
  userId: string;
  userEmail: string;
  plan: 'pro' | 'max';
  billingPeriod?: 'monthly' | 'yearly';
}): Promise<void> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[Stripe Service] Creating ${data.plan.toUpperCase()} plan subscription:`,
        data
      );
    }

    // Call Netlify function to create subscription checkout session
    const response = await fetch(
      '/.netlify/functions/create-pro-subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error ||
          `Failed to create ${data.plan.toUpperCase()} subscription`
      );
    }

    const { url } = await response.json();
    if (import.meta.env.DEV) {
      console.log(
        `[Stripe Service] ${data.plan.toUpperCase()} subscription checkout URL:`,
        url
      );
    }

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received from server');
    }
  } catch (error) {
    console.error(`[Stripe Service] ${data.plan} upgrade error:`, error);
    throw error;
  }
}

/**
 * Create Enterprise plan inquiry (Contact sales)
 */
export async function contactEnterpriseSales(data: {
  userId: string;
  userEmail: string;
  userName?: string;
  companyName?: string;
  message?: string;
}): Promise<void> {
  try {
    if (import.meta.env.DEV) {
      console.log('[Stripe Service] Enterprise inquiry:', data);
    }

    // In a real implementation, this would send an email or create a lead in CRM
    // For now, we'll just open the contact page or show a success message
    if (import.meta.env.DEV) {
      console.log('[Enterprise Sales] Contact request submitted');
    }

    // You can implement this to send to your CRM or email service
    // For now, redirect to contact page with pre-filled info
    const params = new URLSearchParams({
      email: data.userEmail,
      plan: 'enterprise',
      ...(data.userName && { name: data.userName }),
      ...(data.companyName && { company: data.companyName }),
    });

    window.location.href = `/contact-sales?${params.toString()}`;
  } catch (error) {
    console.error('[Stripe Service] Enterprise inquiry error:', error);
    throw error;
  }
}
