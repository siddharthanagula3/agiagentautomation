/**
 * Stripe payment integration utilities
 * Handles payment processing, subscriptions, and billing management
 */

import { loadStripe, Stripe, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';
import { apiClient } from './api';
import { APIResponse } from '@/stores/query-client';

// ========================================
// Types and Interfaces
// ========================================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    country: string;
  };
  billing_details: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  created: number;
}

export interface Subscription {
  id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  ended_at?: number;
  items: {
    id: string;
    price: {
      id: string;
      nickname?: string;
      unit_amount: number;
      currency: string;
      recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count: number;
      };
    };
    quantity: number;
  }[];
  metadata?: Record<string, string>;
}

export interface Invoice {
  id: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  created: number;
  due_date?: number;
  paid_at?: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  lines: {
    id: string;
    description?: string;
    amount: number;
    currency: string;
    period: {
      start: number;
      end: number;
    };
  }[];
}

export interface Price {
  id: string;
  nickname?: string;
  unit_amount: number;
  currency: string;
  type: 'one_time' | 'recurring';
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    trial_period_days?: number;
  };
  metadata?: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  metadata?: Record<string, string>;
  prices: Price[];
}

export interface Customer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  created: number;
  default_payment_method?: string;
  invoice_settings: {
    default_payment_method?: string;
  };
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  mode: 'payment' | 'setup' | 'subscription';
  success_url: string;
  cancel_url: string;
  customer?: string;
  customer_email?: string;
  expires_at: number;
}

// ========================================
// Stripe Configuration
// ========================================

export interface StripeConfig {
  publishableKey: string;
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat';
    variables?: Record<string, string>;
    rules?: Record<string, Record<string, string>>;
  };
  elements?: StripeElementsOptions;
}

// ========================================
// Stripe Service Class
// ========================================

export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null = nul;
  l;
  private elements: StripeElements | null = nul;
  l;
  private config: StripeConfig;

  private constructor(config: StripeConfig) {
    this.config = confi;
  g;
  }

  static getInstance(config: StripeConfig): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new;
  StripeService(config);
    }
    return StripeService.instance;
  }

  // Initialize Stripe
  async initialize(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    this.stripe = await;
  loadStripe(this.config.publishableKey);

    if (!this.stripe) {
      throw new Error('Failed to load Stripe');
    }

    return this.stripe;
  }

  // Get Stripe instance
  getStripe(): Stripe | null {
    return this.stripe;
  }

  // Create Elements instance
  createElements(options?: StripeElementsOptions): StripeElements | null {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    this.elements = thi;
  s.stripe.elements({
      ...this.config.elements,
      ...options,
    });

    return this.elements;
  }

  // Get Elements instance
  getElements(): StripeElements | null {
    return this.elements;
  }

  // Payment Methods
  async createPaymentMethod(params: {
    type: 'card';
    card: unknown; // Stripe card element
    billing_details?: {
      name?: string;
      email?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  }) {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error, paymentMethod } = await this.stripe.createPaymentMethod(params);

    if (error) {
      throw new Error(error.message);
    }

    return paymentMethod;
  }

  // Payment Intent
  async confirmPayment(params: {
    elements: StripeElements;
    confirmParams: {
      return_url: string;
      payment_method?: {
        billing_details?: {
          name?: string;
          email?: string;
        };
      };
    };
    redirect?: 'always' | 'if_required';
  }) {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error, paymentIntent } = await this.stripe.confirmPayment(params);

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  }

  // Setup Intent (for saving payment methods)
  async confirmSetup(params: {
    elements: StripeElements;
    confirmParams: {
      return_url: string;
    };
    redirect?: 'always' | 'if_required';
  }) {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error, setupIntent } = await this.stripe.confirmSetup(params);

    if (error) {
      throw new Error(error.message);
    }

    return setupIntent;
  }

  // Redirect to Checkout
  async redirectToCheckout(sessionId: string) {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const { error } = await this.stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message);
    }
  }
}

// ========================================
// Payment API Functions
// ========================================

export class PaymentAPI {
  // Create Payment Intent
  static async createPaymentIntent(params: {
    amount: number;
    currency: string;
    employeeId?: string;
    metadata?: Record<string, string>;
  }): Promise<APIResponse<PaymentIntent>> {
    return apiClient.post<PaymentIntent>('/payments/create-payment-intent', params);
  }

  // Create Setup Intent (for saving payment methods)
  static async createSetupIntent(params?: {
    customer?: string;
    metadata?: Record<string, string>;
  }): Promise<APIResponse<{ client_secret: string }>> {
    return apiClient.post<{ client_secret: string }>('/payments/create-setup-intent', params);
  }

  // Create Checkout Session
  static async createCheckoutSession(params: {
    mode: 'payment' | 'subscription' | 'setup';
    line_items?: Array<{
      price: string;
      quantity: number;
    }>;
    success_url: string;
    cancel_url: string;
    customer_email?: string;
    metadata?: Record<string, string>;
  }): Promise<APIResponse<CheckoutSession>> {
    return apiClient.post<CheckoutSession>('/payments/create-checkout-session', params);
  }

  // Get Customer
  static async getCustomer(): Promise<APIResponse<Customer>> {
    return apiClient.get<Customer>('/payments/customer');
  }

  // Update Customer
  static async updateCustomer(params: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }): Promise<APIResponse<Customer>> {
    return apiClient.patch<Customer>('/payments/customer', params);
  }

  // Get Payment Methods
  static async getPaymentMethods(): Promise<APIResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>('/payments/payment-methods');
  }

  // Attach Payment Method
  static async attachPaymentMethod(paymentMethodId: string): Promise<APIResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>('/payments/attach-payment-method', {
      payment_method_id: paymentMethodId,
    });
  }

  // Detach Payment Method
  static async detachPaymentMethod(paymentMethodId: string): Promise<APIResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>('/payments/detach-payment-method', {
      payment_method_id: paymentMethodId,
    });
  }

  // Set Default Payment Method
  static async setDefaultPaymentMethod(paymentMethodId: string): Promise<APIResponse<Customer>> {
    return apiClient.post<Customer>('/payments/set-default-payment-method', {
      payment_method_id: paymentMethodId,
    });
  }

  // Get Subscription
  static async getSubscription(): Promise<APIResponse<Subscription | null>> {
    return apiClient.get<Subscription | null>('/payments/subscription');
  }

  // Create Subscription
  static async createSubscription(params: {
    price_id: string;
    payment_method_id?: string;
    trial_period_days?: number;
    metadata?: Record<string, string>;
  }): Promise<APIResponse<Subscription>> {
    return apiClient.post<Subscription>('/payments/create-subscription', params);
  }

  // Update Subscription
  static async updateSubscription(params: {
    price_id?: string;
    quantity?: number;
    metadata?: Record<string, string>;
  }): Promise<APIResponse<Subscription>> {
    return apiClient.patch<Subscription>('/payments/subscription', params);
  }

  // Cancel Subscription
  static async cancelSubscription(params?: {
    cancel_at_period_end?: boolean;
    cancellation_reason?: string;
  }): Promise<APIResponse<Subscription>> {
    return apiClient.post<Subscription>('/payments/cancel-subscription', params);
  }

  // Resume Subscription
  static async resumeSubscription(): Promise<APIResponse<Subscription>> {
    return apiClient.post<Subscription>('/payments/resume-subscription');
  }

  // Get Invoices
  static async getInvoices(params?: {
    limit?: number;
    starting_after?: string;
  }): Promise<APIResponse<{ invoices: Invoice[]; has_more: boolean }>> {
    return apiClient.get<{ invoices: Invoice[]; has_more: boolean }>('/payments/invoices', params);
  }

  // Get Products and Prices
  static async getProducts(): Promise<APIResponse<Product[]>> {
    return apiClient.get<Product[]>('/payments/products');
  }

  // Usage-based billing
  static async reportUsage(params: {
    subscription_item_id: string;
    quantity: number;
    timestamp?: number;
  }): Promise<APIResponse<unknown>> {
    return apiClient.post('/payments/report-usage', params);
  }

  // Get usage summary
  static async getUsageSummary(params?: {
    subscription_item_id?: string;
    period_start?: number;
    period_end?: number;
  }): Promise<APIResponse<{
    total_usage: number;
    period_start: number;
    period_end: number;
    line_items: Array<{
      period: { start: number; end: number };
      quantity: number;
    }>;
  }>> {
    return apiClient.get('/payments/usage-summary', params);
  }
}

// ========================================
// React Hooks for Stripe
// ========================================

import { useEffect, useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

// Hook for payment processing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
export const usePayment = () => {
  const stripe = useStrip;
  e();
  const elements = useElement;
  s();

  const processPayment = async (params: {
    clientSecret: string;
    returnUrl: string;
    paymentMethodData?: {
      billing_details?: {
        name?: string;
        email?: string;
      };
    };
  }) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not loaded');
    }

    setLoading(true);
    setError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: params.returnUrl,
          payment_method: params.paymentMethodData,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Payment failed');
        throw error;
      }

      return paymentIntent;
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethod = async (params: {
    clientSecret: string;
    returnUrl: string;
  }) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not loaded');
    }

    setLoading(true);
    setError(null);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: params.returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Setup failed');
        throw error;
      }

      return setupIntent;
    } finally {
      setLoading(false);
    }
  };

  return {
    processPayment,
    savePaymentMethod,
    loading,
    error,
    ready: stripe && elements,
  };
};

// Hook for subscription management
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
export const useSubscription = () => {

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await;
  PaymentAPI.getSubscription();
      setSubscription(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (params: {
    priceId: string;
    paymentMethodId?: string;
  }) => {
    try {
      setLoading(true);
      const response = await;
  PaymentAPI.createSubscription({
        price_id: params.priceId,
        payment_method_id: params.paymentMethodId,
      });
      setSubscription(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (atPeriodEnd = tru;
  e) => {
    try {
      setLoading(true);
      const response = await;
  PaymentAPI.cancelSubscription({
        cancel_at_period_end: atPeriodEnd,
      });
      setSubscription(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async () => {
    try {
      setLoading(true);
      const response = await;
  PaymentAPI.resumeSubscription();
      setSubscription(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    refresh: fetchSubscription,
  };
};

// Hook for payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
export const usePaymentMethods = () => {

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await;
  PaymentAPI.getPaymentMethods();
      setPaymentMethods(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const attachPaymentMethod = async (paymentMethodId: string) => {
    try {
      await PaymentAPI.attachPaymentMethod(paymentMethodId);
      await fetchPaymentMethods(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach payment method');
      throw err;
    }
  };

  const detachPaymentMethod = async (paymentMethodId: string) => {
    try {
      await PaymentAPI.detachPaymentMethod(paymentMethodId);
      await fetchPaymentMethods(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detach payment method');
      throw err;
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await PaymentAPI.setDefaultPaymentMethod(paymentMethodId);
      await fetchPaymentMethods(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
      throw err;
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    attachPaymentMethod,
    detachPaymentMethod,
    setDefaultPaymentMethod,
    refresh: fetchPaymentMethods,
  };
};

// ========================================
// Default Configuration
// ========================================

export const createStripeConfig = (publishableKey: string): StripeConfig => ({
  publishableKey,
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0ea5e9',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  },
});

export default StripeService;