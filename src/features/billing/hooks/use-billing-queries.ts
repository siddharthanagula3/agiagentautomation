/**
 * Billing React Query Hooks
 * Server state management for billing data using React Query
 *
 * @module features/billing/hooks/use-billing-queries
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';
import { logger } from '@shared/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Billing plan types
 */
export type BillingPlan = 'free' | 'pro' | 'enterprise';

/**
 * Subscription status types
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid';

/**
 * Time range options for analytics
 */
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'all';

/**
 * LLM provider usage statistics
 */
export interface LLMUsage {
  provider: string;
  tokens: number;
  cost: number;
  limit: number;
}

/**
 * Complete billing information for a user
 */
export interface BillingInfo {
  plan: BillingPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  price: number;
  currency: string;
  features: string[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usage: BillingUsage;
}

/**
 * Token and cost usage breakdown
 */
export interface BillingUsage {
  totalTokens: number;
  totalLimit: number;
  totalCost: number;
  currentBalance: number;
  llmUsage: LLMUsage[];
}

/**
 * User's token balance
 */
export interface TokenBalance {
  currentBalance: number;
  totalGranted: number;
  totalUsed: number;
}

/**
 * Raw token usage record from database
 */
interface TokenUsageRecord {
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
}

/**
 * Processed session data for analytics
 */
export interface AnalyticsSession {
  sessionId: string;
  sessionTitle: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  provider: string;
  createdAt: Date;
}

/**
 * Daily usage data point for charts
 */
export interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
}

/**
 * Aggregated analytics statistics
 */
export interface AnalyticsStats {
  totalTokens: number;
  totalCost: number;
  avgTokensPerSession: number;
  sessionsCount: number;
  todayTokens: number;
  todayCost: number;
  weekTokens: number;
  weekCost: number;
  monthTokens: number;
  monthCost: number;
}

/**
 * Complete analytics data response
 */
export interface TokenAnalyticsData {
  sessions: AnalyticsSession[];
  stats: AnalyticsStats | null;
  dailyUsage: DailyUsage[];
}

/**
 * User plan information from database
 */
interface UserPlanData {
  plan: BillingPlan;
  subscriptionEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// Constants
const FREE_TIER_LIMIT = 1_000_000;
const FREE_PROVIDER_LIMIT = 250_000;
const PRO_TIER_LIMIT = 10_000_000;
const PRO_PROVIDER_LIMIT = 2_500_000;

/**
 * Fetch token balance for a user
 */
async function fetchTokenBalance(userId: string): Promise<TokenBalance> {
  const { data, error } = await supabase
    .from('user_token_balances')
    .select('current_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('[BillingQuery] Token balance error:', error);
    // Return free tier defaults on error
    return {
      currentBalance: FREE_TIER_LIMIT,
      totalGranted: FREE_TIER_LIMIT,
      totalUsed: 0,
    };
  }

  const currentBalance = data?.current_balance ?? FREE_TIER_LIMIT;
  return {
    currentBalance: Math.max(currentBalance, 0),
    totalGranted: FREE_TIER_LIMIT,
    totalUsed: FREE_TIER_LIMIT - currentBalance,
  };
}

/**
 * Fetch token usage by provider
 */
async function fetchTokenUsage(userId: string): Promise<LLMUsage[]> {
  const { data, error } = await supabase
    .from('token_usage')
    .select('provider, input_tokens, output_tokens, total_tokens, total_cost')
    .eq('user_id', userId);

  const defaultUsage: LLMUsage[] = [
    { provider: 'OpenAI', tokens: 0, cost: 0, limit: FREE_PROVIDER_LIMIT },
    { provider: 'Anthropic', tokens: 0, cost: 0, limit: FREE_PROVIDER_LIMIT },
    { provider: 'Google', tokens: 0, cost: 0, limit: FREE_PROVIDER_LIMIT },
    { provider: 'Perplexity', tokens: 0, cost: 0, limit: FREE_PROVIDER_LIMIT },
  ];

  if (error || !data || data.length === 0) {
    return defaultUsage;
  }

  // Aggregate by provider
  const providerMap = new Map<string, { tokens: number; cost: number }>();
  (data as TokenUsageRecord[]).forEach((row) => {
    const provider = row.provider.toLowerCase();
    const current = providerMap.get(provider) || { tokens: 0, cost: 0 };
    current.tokens += row.total_tokens || 0;
    current.cost += row.total_cost || 0;
    providerMap.set(provider, current);
  });

  return defaultUsage.map((llm) => {
    const providerKey = llm.provider.toLowerCase();
    const usage = providerMap.get(providerKey) || { tokens: 0, cost: 0 };
    return {
      ...llm,
      tokens: usage.tokens,
      cost: usage.cost,
    };
  });
}

/**
 * Fetch user plan from database
 */
async function fetchUserPlan(userId: string): Promise<UserPlanData> {
  const { data, error } = await supabase
    .from('users')
    .select(
      'plan, subscription_end_date, plan_status, stripe_customer_id, stripe_subscription_id'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return {
      plan: 'free',
      subscriptionEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  return {
    plan: (data.plan as BillingPlan) || 'free',
    subscriptionEndDate: data.subscription_end_date,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
  };
}

/**
 * Main billing data query hook
 * Fetches complete billing information including plan, usage, and token balance
 *
 * @returns UseQueryResult with BillingInfo data or null
 */
export function useBillingData(): UseQueryResult<BillingInfo | null, Error> {
  const { user } = useAuthStore();

  return useQuery<BillingInfo | null, Error>({
    queryKey: queryKeys.billing.plan(user?.id ?? ''),
    queryFn: async (): Promise<BillingInfo | null> => {
      if (!user?.id) return null;

      // Fetch all data in parallel
      const [tokenBalance, llmUsage, userPlan] = await Promise.all([
        fetchTokenBalance(user.id),
        fetchTokenUsage(user.id),
        fetchUserPlan(user.id),
      ]);

      const isPro = userPlan.plan === 'pro';
      const totalLimit = isPro ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;
      const providerLimit = isPro ? PRO_PROVIDER_LIMIT : FREE_PROVIDER_LIMIT;

      // Update limits based on plan
      const updatedLlmUsage = llmUsage.map((llm) => ({
        ...llm,
        limit: providerLimit,
      }));

      const totalCost = updatedLlmUsage.reduce((sum, llm) => sum + llm.cost, 0);
      const totalUsed = totalLimit - tokenBalance.currentBalance;

      // Calculate billing period dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return {
        plan: userPlan.plan,
        status: 'active',
        current_period_start: userPlan.subscriptionEndDate
          ? new Date(
              new Date(userPlan.subscriptionEndDate).getTime() -
                30 * 24 * 60 * 60 * 1000
            ).toISOString()
          : currentMonthStart.toISOString(),
        current_period_end:
          userPlan.subscriptionEndDate || nextMonthStart.toISOString(),
        price: isPro ? 29 : 0,
        currency: 'USD',
        features: isPro
          ? [
              '10M tokens/month (2.5M per LLM)',
              'All 4 AI providers included',
              'Advanced analytics',
              'Priority support',
              'API access',
            ]
          : [
              '1M tokens/month (250k per LLM)',
              'All 4 AI providers included',
              'Basic analytics',
              'Community support',
            ],
        stripeCustomerId: userPlan.stripeCustomerId,
        stripeSubscriptionId: userPlan.stripeSubscriptionId,
        usage: {
          totalTokens: Math.max(totalUsed, 0),
          totalLimit,
          totalCost,
          currentBalance: tokenBalance.currentBalance,
          llmUsage: updatedLlmUsage,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - billing data changes infrequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    meta: {
      errorMessage: 'Failed to load billing information',
    },
  });
}

/**
 * Token balance query hook
 * Fetches current token balance, total granted, and usage
 *
 * @returns UseQueryResult with TokenBalance data
 */
export function useTokenBalance(): UseQueryResult<TokenBalance, Error> {
  const { user } = useAuthStore();

  return useQuery<TokenBalance, Error>({
    queryKey: queryKeys.billing.tokenBalance(user?.id ?? ''),
    queryFn: (): Promise<TokenBalance> => fetchTokenBalance(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load token balance',
    },
  });
}

/**
 * Token usage by provider query hook
 * Fetches token usage breakdown by LLM provider
 *
 * @returns UseQueryResult with array of LLMUsage
 */
export function useTokenUsageByProvider(): UseQueryResult<LLMUsage[], Error> {
  const { user } = useAuthStore();

  return useQuery<LLMUsage[], Error>({
    queryKey: queryKeys.billing.tokenUsage(user?.id ?? ''),
    queryFn: (): Promise<LLMUsage[]> => fetchTokenUsage(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load token usage data',
    },
  });
}

/**
 * Token analytics query hook with time range support
 * Fetches detailed usage analytics with session breakdown and daily trends
 *
 * @param timeRange - Time range for analytics: '7d', '30d', '90d', or 'all'
 * @returns UseQueryResult with TokenAnalyticsData or null
 */
export function useTokenAnalytics(
  timeRange: AnalyticsTimeRange = '30d'
): UseQueryResult<TokenAnalyticsData | null, Error> {
  const { user } = useAuthStore();

  return useQuery<TokenAnalyticsData | null, Error>({
    queryKey: queryKeys.billing.analytics(user?.id ?? '', timeRange),
    queryFn: async (): Promise<TokenAnalyticsData | null> => {
      if (!user?.id) return null;

      const now = new Date();
      const startDate =
        timeRange === 'all'
          ? new Date('2020-01-01')
          : timeRange === '90d'
            ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            : timeRange === '30d'
              ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(
          `
          id,
          title,
          created_at,
          provider,
          chat_session_tokens (
            total_input_tokens,
            total_output_tokens,
            total_tokens,
            total_cost
          )
        `
        )
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[TokenAnalytics] Failed to load data:', error);
        return { sessions: [], stats: null, dailyUsage: [] };
      }

      interface SessionWithTokens {
        id: string;
        title: string | null;
        created_at: string;
        provider: string | null;
        chat_session_tokens: {
          total_input_tokens: number;
          total_output_tokens: number;
          total_tokens: number;
          total_cost: number;
        } | null;
      }

      const processedData: AnalyticsSession[] = (
        (sessions || []) as SessionWithTokens[]
      )
        .filter(
          (s): s is SessionWithTokens & { chat_session_tokens: NonNullable<SessionWithTokens['chat_session_tokens']> } =>
            s.chat_session_tokens !== null && s.chat_session_tokens.total_tokens > 0
        )
        .map((s): AnalyticsSession => ({
          sessionId: s.id,
          sessionTitle: s.title || 'Untitled',
          totalTokens: s.chat_session_tokens.total_tokens || 0,
          inputTokens: s.chat_session_tokens.total_input_tokens || 0,
          outputTokens: s.chat_session_tokens.total_output_tokens || 0,
          totalCost: s.chat_session_tokens.total_cost || 0,
          provider: s.provider || 'openai',
          createdAt: new Date(s.created_at),
        }));

      // Calculate stats
      const totalTokens = processedData.reduce(
        (sum, d) => sum + d.totalTokens,
        0
      );
      const totalCost = processedData.reduce((sum, d) => sum + d.totalCost, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayData = processedData.filter((d) => d.createdAt >= today);
      const weekData = processedData.filter((d) => d.createdAt >= weekAgo);
      const monthData = processedData.filter((d) => d.createdAt >= monthAgo);

      // Calculate daily usage for chart
      const dailyMap = new Map<string, DailyUsage>();
      processedData.forEach((d) => {
        const dateKey = d.createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || {
          date: dateKey,
          tokens: 0,
          cost: 0,
        };
        dailyMap.set(dateKey, {
          date: dateKey,
          tokens: existing.tokens + d.totalTokens,
          cost: existing.cost + d.totalCost,
        });
      });

      const analyticsResult: TokenAnalyticsData = {
        sessions: processedData,
        stats: {
          totalTokens,
          totalCost,
          avgTokensPerSession:
            processedData.length > 0 ? totalTokens / processedData.length : 0,
          sessionsCount: processedData.length,
          todayTokens: todayData.reduce((sum, d) => sum + d.totalTokens, 0),
          todayCost: todayData.reduce((sum, d) => sum + d.totalCost, 0),
          weekTokens: weekData.reduce((sum, d) => sum + d.totalTokens, 0),
          weekCost: weekData.reduce((sum, d) => sum + d.totalCost, 0),
          monthTokens: monthData.reduce((sum, d) => sum + d.totalTokens, 0),
          monthCost: monthData.reduce((sum, d) => sum + d.totalCost, 0),
        },
        dailyUsage: Array.from(dailyMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };

      return analyticsResult;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load token analytics',
    },
  });
}

/**
 * Invalidate all billing queries - useful after purchases
 * Returns a callback function to trigger invalidation
 *
 * @returns Callback function to invalidate all billing queries
 */
export function useInvalidateBillingQueries(): () => void {
  const queryClient: QueryClient = useQueryClient();
  const { user } = useAuthStore();

  return (): void => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.all() });
    }
  };
}

// ============================================================================
// SUBSCRIPTION HOOKS
// ============================================================================

/**
 * Subscription data structure
 */
export interface Subscription {
  id: string;
  userId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  priceId: string | null;
  quantity: number;
  metadata: Record<string, unknown>;
}

/**
 * Fetch subscription details
 *
 * @returns UseQueryResult with Subscription data or null
 */
export function useSubscription(): UseQueryResult<Subscription | null, Error> {
  const { user } = useAuthStore();

  return useQuery<Subscription | null, Error>({
    queryKey: queryKeys.billing.subscription(),
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          plan,
          plan_status,
          subscription_end_date,
          stripe_subscription_id,
          stripe_customer_id,
          trial_end_date
        `
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        logger.warn('[useSubscription] No subscription data found');
        return null;
      }

      const now = new Date();
      const periodEnd = data.subscription_end_date
        ? new Date(data.subscription_end_date)
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);

      return {
        id: data.id,
        userId: user.id,
        plan: (data.plan as BillingPlan) || 'free',
        status: (data.plan_status as SubscriptionStatus) || 'active',
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: null,
        trialEnd: data.trial_end_date,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripeCustomerId: data.stripe_customer_id,
        priceId: null,
        quantity: 1,
        metadata: {},
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    meta: {
      errorMessage: 'Failed to load subscription details',
    },
  });
}

// ============================================================================
// INVOICE HOOKS
// ============================================================================

/**
 * Invoice data structure
 */
export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  dueDate: string | null;
  paidAt: string | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  lineItems: InvoiceLineItem[];
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Fetch user invoices
 *
 * @returns UseQueryResult with array of Invoice
 */
export function useInvoices(): UseQueryResult<Invoice[], Error> {
  const { user } = useAuthStore();

  return useQuery<Invoice[], Error>({
    queryKey: queryKeys.billing.invoices(),
    queryFn: async (): Promise<Invoice[]> => {
      if (!user?.id) return [];

      // Try to fetch from invoices table
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useInvoices] Invoices table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((inv) => ({
        id: inv.id,
        number: inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`,
        status: inv.status || 'paid',
        amount: inv.amount || 0,
        currency: inv.currency || 'USD',
        description: inv.description || 'Subscription charge',
        createdAt: inv.created_at,
        dueDate: inv.due_date,
        paidAt: inv.paid_at,
        invoicePdf: inv.invoice_pdf,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        lineItems: inv.line_items || [],
      }));
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to load invoices',
    },
  });
}

// ============================================================================
// PAYMENT METHOD HOOKS
// ============================================================================

/**
 * Payment method data structure
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails: {
    name: string | null;
    email: string | null;
    address: {
      city: string | null;
      country: string | null;
      line1: string | null;
      line2: string | null;
      postalCode: string | null;
      state: string | null;
    };
  };
  createdAt: string;
}

/**
 * Fetch user payment methods
 *
 * @returns UseQueryResult with array of PaymentMethod
 */
export function usePaymentMethods(): UseQueryResult<PaymentMethod[], Error> {
  const { user } = useAuthStore();

  return useQuery<PaymentMethod[], Error>({
    queryKey: queryKeys.billing.paymentMethods(),
    queryFn: async (): Promise<PaymentMethod[]> => {
      if (!user?.id) return [];

      // Try to fetch from payment_methods table
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        // Table might not exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[usePaymentMethods] Payment methods table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((pm) => ({
        id: pm.id,
        type: pm.type || 'card',
        isDefault: pm.is_default || false,
        card: pm.card_brand
          ? {
              brand: pm.card_brand,
              last4: pm.card_last4 || '****',
              expMonth: pm.card_exp_month || 1,
              expYear: pm.card_exp_year || 2030,
            }
          : undefined,
        billingDetails: {
          name: pm.billing_name,
          email: pm.billing_email,
          address: {
            city: pm.billing_city,
            country: pm.billing_country,
            line1: pm.billing_line1,
            line2: pm.billing_line2,
            postalCode: pm.billing_postal_code,
            state: pm.billing_state,
          },
        },
        createdAt: pm.created_at,
      }));
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to load payment methods',
    },
  });
}

// ============================================================================
// TOKEN USAGE HISTORY HOOKS
// ============================================================================

/**
 * Token usage history record
 */
export interface TokenUsageHistoryRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: string;
  metadata?: {
    sessionTitle?: string;
    messageId?: string;
    employeeId?: string;
  };
}

/**
 * Token usage history options
 */
export interface TokenUsageHistoryOptions {
  limit?: number;
  offset?: number;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Fetch token usage history with pagination
 *
 * @param options - Query options for filtering and pagination
 * @returns UseQueryResult with array of TokenUsageHistoryRecord
 */
export function useTokenUsageHistory(
  options?: TokenUsageHistoryOptions
): UseQueryResult<TokenUsageHistoryRecord[], Error> {
  const { user } = useAuthStore();
  const { limit = 50, offset = 0, provider, startDate, endDate } = options || {};

  return useQuery<TokenUsageHistoryRecord[], Error>({
    queryKey: [
      ...queryKeys.billing.tokenUsage(user?.id ?? ''),
      'history',
      { limit, offset, provider, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() },
    ],
    queryFn: async (): Promise<TokenUsageHistoryRecord[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (provider) {
        query = query.eq('provider', provider);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          logger.warn('[useTokenUsageHistory] Token usage table does not exist');
          return [];
        }
        throw error;
      }

      return (data || []).map((record) => ({
        id: record.id,
        userId: record.user_id,
        sessionId: record.session_id,
        provider: record.provider,
        model: record.model || 'unknown',
        inputTokens: record.input_tokens || 0,
        outputTokens: record.output_tokens || 0,
        totalTokens: record.total_tokens || 0,
        cost: record.total_cost || 0,
        createdAt: record.created_at,
        metadata: record.metadata || {},
      }));
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: 'Failed to load token usage history',
    },
  });
}

// ============================================================================
// BILLING ANALYTICS HOOKS
// ============================================================================

/**
 * Enhanced billing analytics data
 */
export interface BillingAnalyticsData {
  overview: {
    totalSpent: number;
    totalTokensUsed: number;
    avgCostPerDay: number;
    avgTokensPerDay: number;
    projectedMonthlySpend: number;
    savingsFromPlan: number;
  };
  trends: {
    date: string;
    tokens: number;
    cost: number;
    sessions: number;
  }[];
  providerBreakdown: {
    provider: string;
    tokens: number;
    cost: number;
    percentage: number;
    sessions: number;
  }[];
  topSessions: {
    sessionId: string;
    title: string;
    tokens: number;
    cost: number;
    provider: string;
    date: string;
  }[];
  periodComparison: {
    currentPeriod: {
      tokens: number;
      cost: number;
      sessions: number;
    };
    previousPeriod: {
      tokens: number;
      cost: number;
      sessions: number;
    };
    percentChange: {
      tokens: number;
      cost: number;
      sessions: number;
    };
  };
}

/**
 * Fetch enhanced billing analytics
 *
 * @param timeRange - Time range for analytics
 * @returns UseQueryResult with BillingAnalyticsData
 */
export function useBillingAnalytics(
  timeRange: AnalyticsTimeRange = '30d'
): UseQueryResult<BillingAnalyticsData | null, Error> {
  const { user } = useAuthStore();

  return useQuery<BillingAnalyticsData | null, Error>({
    queryKey: [...queryKeys.billing.analytics(user?.id ?? '', timeRange), 'enhanced'],
    queryFn: async (): Promise<BillingAnalyticsData | null> => {
      if (!user?.id) return null;

      const now = new Date();
      const daysMap: Record<AnalyticsTimeRange, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        'all': 365,
      };
      const days = daysMap[timeRange];
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Fetch token usage data
      const { data: usageData, error: usageError } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', previousStartDate.toISOString())
        .order('created_at', { ascending: true });

      if (usageError) {
        if (usageError.code === '42P01' || usageError.message?.includes('does not exist')) {
          logger.warn('[useBillingAnalytics] Token usage table does not exist');
          return null;
        }
        throw usageError;
      }

      const records = usageData || [];
      const currentRecords = records.filter(
        (r) => new Date(r.created_at) >= startDate
      );
      const previousRecords = records.filter(
        (r) =>
          new Date(r.created_at) >= previousStartDate &&
          new Date(r.created_at) < startDate
      );

      // Calculate overview
      const totalSpent = currentRecords.reduce((sum, r) => sum + (r.total_cost || 0), 0);
      const totalTokensUsed = currentRecords.reduce((sum, r) => sum + (r.total_tokens || 0), 0);
      const avgCostPerDay = totalSpent / days;
      const avgTokensPerDay = totalTokensUsed / days;
      const projectedMonthlySpend = avgCostPerDay * 30;

      // Calculate trends
      const trendsMap = new Map<string, { tokens: number; cost: number; sessions: number }>();
      currentRecords.forEach((r) => {
        const date = r.created_at.split('T')[0];
        const existing = trendsMap.get(date) || { tokens: 0, cost: 0, sessions: 0 };
        trendsMap.set(date, {
          tokens: existing.tokens + (r.total_tokens || 0),
          cost: existing.cost + (r.total_cost || 0),
          sessions: existing.sessions + 1,
        });
      });
      const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      // Calculate provider breakdown
      const providerMap = new Map<string, { tokens: number; cost: number; sessions: number }>();
      currentRecords.forEach((r) => {
        const provider = r.provider || 'unknown';
        const existing = providerMap.get(provider) || { tokens: 0, cost: 0, sessions: 0 };
        providerMap.set(provider, {
          tokens: existing.tokens + (r.total_tokens || 0),
          cost: existing.cost + (r.total_cost || 0),
          sessions: existing.sessions + 1,
        });
      });
      const providerBreakdown = Array.from(providerMap.entries()).map(([provider, data]) => ({
        provider,
        ...data,
        percentage: totalTokensUsed > 0 ? (data.tokens / totalTokensUsed) * 100 : 0,
      }));

      // Period comparison
      const currentPeriod = {
        tokens: totalTokensUsed,
        cost: totalSpent,
        sessions: currentRecords.length,
      };
      const previousPeriod = {
        tokens: previousRecords.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
        cost: previousRecords.reduce((sum, r) => sum + (r.total_cost || 0), 0),
        sessions: previousRecords.length,
      };
      const percentChange = {
        tokens:
          previousPeriod.tokens > 0
            ? ((currentPeriod.tokens - previousPeriod.tokens) / previousPeriod.tokens) * 100
            : 0,
        cost:
          previousPeriod.cost > 0
            ? ((currentPeriod.cost - previousPeriod.cost) / previousPeriod.cost) * 100
            : 0,
        sessions:
          previousPeriod.sessions > 0
            ? ((currentPeriod.sessions - previousPeriod.sessions) / previousPeriod.sessions) * 100
            : 0,
      };

      return {
        overview: {
          totalSpent,
          totalTokensUsed,
          avgCostPerDay,
          avgTokensPerDay,
          projectedMonthlySpend,
          savingsFromPlan: 0, // Would need plan limits to calculate
        },
        trends,
        providerBreakdown,
        topSessions: [], // Would need session join to populate
        periodComparison: {
          currentPeriod,
          previousPeriod,
          percentChange,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to load billing analytics',
    },
  });
}

// ============================================================================
// SUBSCRIPTION MUTATION HOOKS
// ============================================================================

/**
 * Cancel subscription mutation
 *
 * @returns UseMutationResult for cancelling subscription
 */
export function useCancelSubscription(): UseMutationResult<
  void,
  Error,
  { atPeriodEnd?: boolean }
> {
  const queryClient: QueryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<void, Error, { atPeriodEnd?: boolean }>({
    mutationFn: async ({ atPeriodEnd = true }) => {
      if (!user?.id) {
        throw new Error('You must be logged in');
      }

      // Call Netlify function to cancel subscription
      const response = await fetch('/.netlify/functions/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ atPeriodEnd }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.subscription() });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.all() });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to cancel subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}

/**
 * Update payment method mutation
 *
 * @returns UseMutationResult for updating payment method
 */
export function useUpdatePaymentMethod(): UseMutationResult<
  void,
  Error,
  { paymentMethodId: string }
> {
  const queryClient: QueryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<void, Error, { paymentMethodId: string }>({
    mutationFn: async ({ paymentMethodId }) => {
      if (!user?.id) {
        throw new Error('You must be logged in');
      }

      const response = await fetch('/.netlify/functions/payments/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment method');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.paymentMethods() });
      toast.success('Payment method updated successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to update payment method:', error);
      toast.error(error.message || 'Failed to update payment method');
    },
  });
}
