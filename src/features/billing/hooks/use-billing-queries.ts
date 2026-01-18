/**
 * Billing React Query Hooks
 * Server state management for billing data using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

// Types
interface LLMUsage {
  provider: string;
  tokens: number;
  cost: number;
  limit: number;
}

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  price: number;
  currency: string;
  features: string[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usage: {
    totalTokens: number;
    totalLimit: number;
    totalCost: number;
    currentBalance: number;
    llmUsage: LLMUsage[];
  };
}

interface TokenBalance {
  currentBalance: number;
  totalGranted: number;
  totalUsed: number;
}

interface TokenUsageRecord {
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
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
    console.error('[BillingQuery] Token balance error:', error);
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
async function fetchUserPlan(userId: string): Promise<{
  plan: 'free' | 'pro' | 'enterprise';
  subscriptionEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}> {
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
    plan: (data.plan as 'free' | 'pro' | 'enterprise') || 'free',
    subscriptionEndDate: data.subscription_end_date,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
  };
}

/**
 * Main billing data query hook
 */
export function useBillingData() {
  const { user } = useAuthStore();

  return useQuery({
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
  });
}

/**
 * Token balance query hook
 */
export function useTokenBalance() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.billing.tokenBalance(user?.id ?? ''),
    queryFn: () => fetchTokenBalance(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Token usage by provider query hook
 */
export function useTokenUsageByProvider() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.billing.tokenUsage(user?.id ?? ''),
    queryFn: () => fetchTokenUsage(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Token analytics query hook with time range support
 */
export function useTokenAnalytics(
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.billing.analytics(user?.id ?? '', timeRange),
    queryFn: async () => {
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
        console.error('[TokenAnalytics] Failed to load data:', error);
        return { sessions: [], stats: null, dailyUsage: [] };
      }

      type SessionWithTokens = {
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
      };

      const processedData = ((sessions || []) as SessionWithTokens[])
        .filter(
          (s) => s.chat_session_tokens && s.chat_session_tokens.total_tokens > 0
        )
        .map((s) => ({
          sessionId: s.id,
          sessionTitle: s.title || 'Untitled',
          totalTokens: s.chat_session_tokens!.total_tokens || 0,
          inputTokens: s.chat_session_tokens!.total_input_tokens || 0,
          outputTokens: s.chat_session_tokens!.total_output_tokens || 0,
          totalCost: s.chat_session_tokens!.total_cost || 0,
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
      const dailyMap = new Map<
        string,
        { date: string; tokens: number; cost: number }
      >();
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

      return {
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
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Invalidate all billing queries - useful after purchases
 */
export function useInvalidateBillingQueries() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.all() });
    }
  };
}
