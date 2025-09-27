import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

class StripeService {
  private stripe: Stripe | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.stripe = await stripePromise;
      return this.stripe !== null;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return false;
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<{ data: StripePaymentIntent | null; error: string | null }> {
    try {
      if (!this.stripe) {
        await this.initialize();
      }

      if (!this.stripe) {
        return { data: null, error: 'Stripe not initialized' };
      }

      // Create payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntent = await response.json();
      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to create payment intent' };
    }
  }

  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<{ data: any; error: string | null }> {
    try {
      if (!this.stripe) {
        await this.initialize();
      }

      if (!this.stripe) {
        return { data: null, error: 'Stripe not initialized' };
      }

      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to confirm payment' };
    }
  }

  async createSubscription(priceId: string, customerId: string): Promise<{ data: StripeSubscription | null; error: string | null }> {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscription = await response.json();
      return { data: subscription, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to create subscription' };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ error: string | null }> {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return { error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { error: 'Failed to cancel subscription' };
    }
  }

  async createCustomer(email: string, name: string): Promise<{ data: any; error: string | null }> {
    try {
      const response = await fetch('/api/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const customer = await response.json();
      return { data: customer, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to create customer' };
    }
  }

  async getSubscription(subscriptionId: string): Promise<{ data: StripeSubscription | null; error: string | null }> {
    try {
      const response = await fetch(`/api/subscription/${subscriptionId}`);

      if (!response.ok) {
        throw new Error('Failed to get subscription');
      }

      const subscription = await response.json();
      return { data: subscription, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to get subscription' };
    }
  }

  async setupPaymentMethod(customerId: string): Promise<{ data: any; error: string | null }> {
    try {
      if (!this.stripe) {
        await this.initialize();
      }

      if (!this.stripe) {
        return { data: null, error: 'Stripe not initialized' };
      }

      const { error, setupIntent } = await this.stripe.confirmCardSetup('', {
        payment_method: {
          card: {},
          billing_details: {
            name: '',
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: setupIntent, error: null };
    } catch (error) {
      console.error('Stripe service error:', error);
      return { data: null, error: 'Failed to setup payment method' };
    }
  }

  async getStripeInstance(): Promise<Stripe | null> {
    if (!this.stripe) {
      await this.initialize();
    }
    return this.stripe;
  }
}

export const stripeService = new StripeService();
