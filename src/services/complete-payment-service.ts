// Complete Payment Service for AI Employee Hiring
// Comprehensive payment processing for hiring AI employees

import { supabase } from '../integrations/supabase/client';
import type {
  EmployeeHire,
  PaymentStatus,
  APIResponse,
  EmployeeError
} from '@/types/complete-ai-employee';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'stripe' | 'crypto' | 'bank_transfer';
  name: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: string;
  clientSecret?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  error?: string;
}

export interface BillingInfo {
  customerId: string;
  email: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
  vatNumber?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, any>;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  metadata: Record<string, any>;
}

class CompletePaymentService {
  private stripe: any = null;
  private paypal: any = null;
  private isInitialized = false;

  constructor() {
    this.initializePaymentProviders();
  }

  // Initialize payment providers
  private async initializePaymentProviders() {
    try {
      // Initialize Stripe
      if (typeof window !== 'undefined' && window.Stripe) {
        this.stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      }

      // Initialize PayPal
      if (typeof window !== 'undefined' && window.paypal) {
        this.paypal = window.paypal;
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing payment providers:', error);
    }
  }

  // ========================================
  // PAYMENT METHODS
  // ========================================

  // Get payment methods for user
  async getPaymentMethods(userId: string): Promise<APIResponse<PaymentMethod[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethod[],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Add payment method
  async addPaymentMethod(
    userId: string,
    paymentMethod: Omit<PaymentMethod, 'id' | 'isDefault'>
  ): Promise<APIResponse<PaymentMethod>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: paymentMethod.type,
          name: paymentMethod.name,
          last4: paymentMethod.last4,
          brand: paymentMethod.brand,
          expiry_month: paymentMethod.expiryMonth,
          expiry_year: paymentMethod.expiryYear,
          is_default: false,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as PaymentMethod,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<APIResponse<boolean>> {
    try {
      // Remove default from all methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // PAYMENT PROCESSING
  // ========================================

  // Process payment for hiring employee
  async processEmployeeHirePayment(
    userId: string,
    employeeId: string,
    amount: number,
    currency: string = 'USD',
    paymentMethodId?: string
  ): Promise<APIResponse<PaymentResult>> {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          type: 'employee_hire',
          employee_id: employeeId,
          user_id: userId
        }
      });

      if (!paymentIntent.success) {
        return {
          success: false,
          error: paymentIntent.error || 'Failed to create payment intent',
          timestamp: new Date().toISOString()
        };
      }

      // Process payment
      const paymentResult = await this.confirmPayment(
        paymentIntent.data.id,
        paymentMethodId
      );

      if (paymentResult.success) {
        // Create hire record
        const hireResponse = await this.createHireRecord(
          userId,
          employeeId,
          amount,
          currency,
          paymentResult.data.transactionId
        );

        if (hireResponse.success) {
          return {
            success: true,
            data: {
              success: true,
              paymentId: paymentIntent.data.id,
              status: 'completed',
              amount,
              currency,
              transactionId: paymentResult.data.transactionId
            },
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            success: false,
            error: hireResponse.error || 'Failed to create hire record',
            timestamp: new Date().toISOString()
          };
        }
      } else {
        return {
          success: false,
          error: paymentResult.error || 'Payment failed',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Create payment intent
  private async createPaymentIntent(intentData: {
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<APIResponse<PaymentIntent>> {
    try {
      // In a real implementation, this would call Stripe API
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: intentData.amount,
        currency: intentData.currency,
        status: 'pending',
        paymentMethod: 'card',
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        metadata: intentData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: paymentIntent,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Confirm payment
  private async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<APIResponse<PaymentResult>> {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success (in real implementation, this would call Stripe API)
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        return {
          success: true,
          data: {
            success: true,
            paymentId: paymentIntentId,
            status: 'completed',
            amount: 100, // $1.00 in cents
            currency: 'usd',
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Payment was declined by the bank',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Create hire record
  private async createHireRecord(
    userId: string,
    employeeId: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<APIResponse<EmployeeHire>> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .insert({
          user_id: userId,
          employee_id: employeeId,
          payment_amount: amount,
          payment_currency: currency,
          payment_status: 'completed',
          payment_method: 'card',
          payment_reference: transactionId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as EmployeeHire,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // BILLING AND INVOICES
  // ========================================

  // Get billing info
  async getBillingInfo(userId: string): Promise<APIResponse<BillingInfo>> {
    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as BillingInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update billing info
  async updateBillingInfo(userId: string, billingInfo: Partial<BillingInfo>): Promise<APIResponse<BillingInfo>> {
    try {
      const { data, error } = await supabase
        .from('billing_info')
        .upsert({
          user_id: userId,
          ...billingInfo,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as BillingInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get invoices
  async getInvoices(userId: string, limit: number = 20): Promise<APIResponse<Invoice[]>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data as Invoice[],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get invoice by ID
  async getInvoice(invoiceId: string): Promise<APIResponse<Invoice>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Invoice,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  // Create subscription
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<APIResponse<Subscription>> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          customer_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          cancel_at_period_end: false,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Subscription,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<APIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // REFUNDS
  // ========================================

  // Process refund
  async processRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<APIResponse<PaymentResult>> {
    try {
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        data: {
          success: true,
          paymentId,
          status: 'refunded',
          amount: amount || 100,
          currency: 'usd',
          transactionId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  // Get payment analytics
  async getPaymentAnalytics(userId: string, period: string = '30d'): Promise<APIResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('payment_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  // Handle webhook
  async handleWebhook(payload: any, signature: string): Promise<APIResponse<boolean>> {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(payload, signature);
      
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid webhook signature',
          timestamp: new Date().toISOString()
        };
      }

      // Process webhook event
      await this.processWebhookEvent(payload);

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Verify webhook signature
  private async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // In a real implementation, this would verify the webhook signature
    return true;
  }

  // Process webhook event
  private async processWebhookEvent(payload: any): Promise<void> {
    // Process different webhook events
    switch (payload.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payload.data);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(payload.data);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSuccess(payload.data);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(payload.data);
        break;
      default:
        // Unhandled webhook event
    }
  }

  // Handle payment success
  private async handlePaymentSuccess(data: any): Promise<void> {
    // Update payment status in database
    await supabase
      .from('employee_hires')
      .update({ payment_status: 'completed' })
      .eq('payment_reference', data.id);
  }

  // Handle payment failure
  private async handlePaymentFailure(data: any): Promise<void> {
    // Update payment status in database
    await supabase
      .from('employee_hires')
      .update({ payment_status: 'failed' })
      .eq('payment_reference', data.id);
  }

  // Handle invoice payment success
  private async handleInvoicePaymentSuccess(data: any): Promise<void> {
    // Update invoice status
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', data.id);
  }

  // Handle subscription update
  private async handleSubscriptionUpdate(data: any): Promise<void> {
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({ status: data.status })
      .eq('id', data.id);
  }
}

export const completePaymentService = new CompletePaymentService();
