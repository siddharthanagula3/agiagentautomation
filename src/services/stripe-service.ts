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
  employeeName: string;
  employeeRole: string;
  price: number;
  userId: string;
  userEmail: string;
  provider?: string; // LLM provider (chatgpt, claude, gemini, perplexity)
  billingPeriod?: 'monthly' | 'yearly'; // Billing period (defaults to yearly)
}

/**
 * Create a Stripe Checkout session and redirect to payment
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<void> {
  try {
    console.log('[Stripe Service] Creating checkout session:', data);

    // Default to yearly billing for AI employees
    const checkoutData = {
      ...data,
      billingPeriod: data.billingPeriod || 'yearly',
    };

    // Call Netlify function to create checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
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
  sessionId?: string;
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string;
  provider?: string;
  subscriptionId?: string;
  customerId?: string;
}): Promise<void> {
  try {
    console.log('[Manual Purchase Service] Calling with data:', data);
    
    const response = await fetch('/.netlify/functions/manual-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Manual Purchase Service] Error response:', error);
      throw new Error(error.error || 'Failed to create purchased employee record');
    }

    const result = await response.json();
    console.log('[Manual Purchase Service] Success:', result);
  } catch (error) {
    console.error('[Manual Purchase Service] Error:', error);
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
    console.log(`[Stripe Service] Creating ${data.plan.toUpperCase()} plan subscription:`, data);

    // Call Netlify function to create subscription checkout session
    const response = await fetch('/.netlify/functions/create-pro-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create ${data.plan.toUpperCase()} subscription`);
    }

    const { url } = await response.json();
    console.log(`[Stripe Service] ${data.plan.toUpperCase()} subscription checkout URL:`, url);

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
    console.log('[Stripe Service] Enterprise inquiry:', data);

    // In a real implementation, this would send an email or create a lead in CRM
    // For now, we'll just open the contact page or show a success message
    console.log('[Enterprise Sales] Contact request submitted');
    
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

