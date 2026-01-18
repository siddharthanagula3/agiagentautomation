/**
 * Stripe Payment Integration Service
 * Handles all Stripe-related operations for AI employee subscriptions
 *
 * UPDATED: January 17, 2026 - Added authorization headers to all API calls
 */

import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@shared/lib/supabase-client';

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

/**
 * Get authorization token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Employee purchase functions removed - hiring is now free

/**
 * Open Stripe Customer Portal for subscription management
 */
// Updated: Jan 17th 2026 - Added authorization header
export async function openBillingPortal(customerId: string): Promise<void> {
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error('User not authenticated. Please log in to access billing.');
  }

  const response = await fetch(
    '/.netlify/functions/payments/get-billing-portal',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ customerId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to open billing portal');
  }

  const { url } = await response.json();

  // Redirect to Stripe Customer Portal
  window.location.href = url;
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
 * @deprecated Use upgradeToProPlan or upgradeToMaxPlan instead
 */
export async function createSubscriptionCheckout(
  plan: 'pro' | 'max',
  userId: string,
  userEmail: string,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<void> {
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error('User not authenticated. Please log in to upgrade.');
  }

  // Call Netlify function to create subscription checkout session
  const response = await fetch(
    '/.netlify/functions/payments/create-pro-subscription',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        plan,
        billingPeriod,
        userId,
        userEmail,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription checkout');
  }

  const { url } = await response.json();

  // Redirect to Stripe Checkout
  if (url) {
    window.location.href = url;
  } else {
    throw new Error('No checkout URL received from server');
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
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error('User not authenticated. Please log in to upgrade.');
  }

  // Call Netlify function to create subscription checkout session
  const response = await fetch(
    '/.netlify/functions/payments/create-pro-subscription',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || `Failed to create ${data.plan.toUpperCase()} subscription`
    );
  }

  const { url } = await response.json();

  // Redirect to Stripe Checkout
  if (url) {
    window.location.href = url;
  } else {
    throw new Error('No checkout URL received from server');
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
  // In a real implementation, this would send an email or create a lead in CRM
  // For now, we'll just open the contact page or show a success message

  // You can implement this to send to your CRM or email service
  // For now, redirect to contact page with pre-filled info
  const params = new URLSearchParams({
    email: data.userEmail,
    plan: 'enterprise',
    ...(data.userName && { name: data.userName }),
    ...(data.companyName && { company: data.companyName }),
  });

  window.location.href = `/contact-sales?${params.toString()}`;
}
