import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface StripeConfig {
  publishableKey: string;
  secretKey?: string;
  apiVersion?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  plan: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

export class StripeService {
  private static instance: StripeService;
  private config: StripeConfig;
  private stripe: Stripe | null = null;

  private constructor(config: StripeConfig) {
    this.config = config;
  }

  static getInstance(config: StripeConfig): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService(config);
    }
    return StripeService.instance;
  }

  // Initialize Stripe
  async initialize(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    this.stripe = await loadStripe(this.config.publishableKey);
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe');
    }
    return this.stripe;
  }

  // Create payment intent
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  }

  // Confirm payment
  async confirmPayment(
    clientSecret: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const stripe = await this.initialize();
    
    const { error } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        payment_method: paymentMethodId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Create customer
  async createCustomer(email: string, name?: string): Promise<Customer> {
    const response = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create customer');
    }

    return response.json();
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Subscription> {
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        priceId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return response.json();
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    const response = await fetch(`/api/stripe/customer/${customerId}/subscriptions`);
    
    if (!response.ok) {
      throw new Error('Failed to get subscriptions');
    }

    return response.json();
  }

  // Setup payment method
  async setupPaymentMethod(customerId: string): Promise<{ success: boolean; error?: string }> {
    const stripe = await this.initialize();
    
    const { error } = await stripe.confirmSetup({
      clientSecret: '', // This should come from your backend
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Get payment methods
  async getPaymentMethods(customerId: string): Promise<any[]> {
    const response = await fetch(`/api/stripe/customer/${customerId}/payment-methods`);
    
    if (!response.ok) {
      throw new Error('Failed to get payment methods');
    }

    return response.json();
  }

  // Create billing portal session
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const response = await fetch('/api/stripe/create-billing-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create billing portal session');
    }

    return response.json();
  }

  // Get Stripe instance
  getStripe(): Stripe | null {
    return this.stripe;
  }
}

// Export singleton instance
export const stripeService = StripeService.getInstance({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
});