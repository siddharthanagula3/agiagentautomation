// Updated: Jan 15th 2026 - Removed all console statements for security (data exposure)
// Updated: Jan 15th 2026 - Added error boundary
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { supabase } from '@shared/lib/supabase-client';
import {
  upgradeToProPlan,
  contactEnterpriseSales,
  openBillingPortal,
  isStripeConfigured,
} from '@features/billing/services/stripe-payments';
import { buyTokenPack } from '@features/billing/services/token-pack-purchase';
import { toast } from 'sonner';
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Zap,
  Crown,
  Building,
  Star,
  ArrowRight,
  Clock,
  FileText,
  Brain,
  Code,
  Search,
  Sparkles,
  Settings,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface LLMUsage {
  provider: string;
  tokens: number;
  cost: number;
  limit: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  price: number;
  currency: string;
  features: string[];
  usage: {
    totalTokens: number;
    totalLimit: number;
    totalCost: number;
    llmUsage: LLMUsage[];
  };
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    download_url: string;
  }[];
}

interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
  savings?: string;
}

const TOKEN_PACKS: TokenPack[] = [
  {
    id: 'pack_500k',
    name: 'Starter Pack',
    tokens: 500000,
    price: 10,
  },
  {
    id: 'pack_1.5m',
    name: 'Popular Pack',
    tokens: 1500000,
    price: 25,
    popular: true,
    savings: 'Save 17%',
  },
  {
    id: 'pack_5m',
    name: 'Power Pack',
    tokens: 5000000,
    price: 75,
    savings: 'Save 25%',
  },
  {
    id: 'pack_10m',
    name: 'Enterprise Pack',
    tokens: 10000000,
    price: 130,
    savings: 'Save 35%',
  },
];

const BillingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'yearly' // Default to yearly
  );
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [showBuyTokens, setShowBuyTokens] = useState(false);

  const loadBilling = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Free tier limits: 1M total, 250k per provider
      const PROVIDER_LIMIT = 250000; // 250k tokens per LLM
      const TOTAL_LIMIT = 1000000; // 1M total tokens

      // Initialize token balance and usage
      let currentBalance = 0;
      let totalUsed = 0;
      let totalGranted = TOTAL_LIMIT; // Default to free tier limit

      // Fetch token usage from Supabase
      let llmUsage: LLMUsage[] = [
        {
          provider: 'OpenAI',
          tokens: 0,
          cost: 0,
          limit: PROVIDER_LIMIT,
          icon: <Brain className="h-5 w-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
        },
        {
          provider: 'Anthropic',
          tokens: 0,
          cost: 0,
          limit: PROVIDER_LIMIT,
          icon: <Code className="h-5 w-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
          provider: 'Google',
          tokens: 0,
          cost: 0,
          limit: PROVIDER_LIMIT,
          icon: <Search className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        },
        {
          provider: 'Perplexity',
          tokens: 0,
          cost: 0,
          limit: PROVIDER_LIMIT,
          icon: <Sparkles className="h-5 w-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        },
      ];

      if (user) {
        try {
          // Fetch current token balance from user_token_balances table
          const { data: balanceData, error: balanceError } = await supabase
            .from('user_token_balances')
            .select('current_balance')
            .eq('user_id', user.id)
            .maybeSingle();

          if (balanceError) {
            // User might not have a balance record yet - that's okay, use free tier defaults
            currentBalance = TOTAL_LIMIT; // Free tier starts with full allocation
          } else if (balanceData) {
            currentBalance = Math.max(balanceData.current_balance || 0, 0);
          }

          // Fetch usage from Supabase token_usage table (for cost estimation)
          const { data: usageData, error: usageError } = await supabase
            .from('token_usage')
            .select(
              'provider, input_tokens, output_tokens, total_tokens, total_cost'
            )
            .eq('user_id', user.id);

          if (usageError) {
            // Error fetching token usage
          } else if (usageData && usageData.length > 0) {
            // Aggregate by provider
            const providerMap = new Map<
              string,
              { tokens: number; cost: number }
            >();

            usageData.forEach((row) => {
              const provider = row.provider.toLowerCase();
              const current = providerMap.get(provider) || {
                tokens: 0,
                cost: 0,
              };
              current.tokens += row.total_tokens || 0;
              current.cost += row.total_cost || 0;
              providerMap.set(provider, current);
            });

            // Update LLM usage with actual data
            llmUsage = llmUsage.map((llm) => {
              const providerKey = llm.provider.toLowerCase();
              const usage = providerMap.get(providerKey) || {
                tokens: 0,
                cost: 0,
              };
              return {
                ...llm,
                tokens: usage.tokens,
                cost: usage.cost,
              };
            });
          }
        } catch (err) {
          // Error querying token data
        }
      }

      // Calculate total usage (tokens spent)
      totalUsed = llmUsage.reduce((sum, llm) => sum + llm.tokens, 0);
      const totalCost = llmUsage.reduce((sum, llm) => sum + llm.cost, 0);

      // Fetch user's plan from database
      let userPlan: 'free' | 'pro' | 'enterprise' = 'free';
      let subscriptionEndDate: string | null = null;

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(
            'plan, subscription_end_date, plan_status, stripe_customer_id, stripe_subscription_id, billing_period'
          )
          .eq('id', user.id)
          .maybeSingle();

        if (!userError && userData) {
          userPlan = userData.plan || 'free';
          subscriptionEndDate = userData.subscription_end_date;
          setStripeCustomerId(userData.stripe_customer_id);
        } else if (userError) {
          // Error fetching user plan
        }
      } catch (err) {
        // Error fetching user plan
      }

      const isPro = userPlan === 'pro';

      // Update limits based on plan
      const proProviderLimit = 2500000; // 2.5M per provider (Pro)
      const proTotalLimit = 10000000; // 10M total (Pro)

      if (isPro) {
        llmUsage = llmUsage.map((llm) => ({
          ...llm,
          limit: proProviderLimit,
        }));
        totalGranted = proTotalLimit;
      }

      // Calculate stable billing period dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const billingData: BillingInfo = {
        plan: userPlan,
        status: 'active',
        current_period_start: subscriptionEndDate
          ? new Date(
              new Date(subscriptionEndDate).getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          : currentMonthStart.toISOString(),
        current_period_end: subscriptionEndDate || nextMonthStart.toISOString(),
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
        usage: {
          totalTokens: totalGranted - currentBalance, // Tokens used = granted - remaining
          totalLimit: totalGranted,
          totalCost,
          llmUsage,
        },
        invoices: [],
      };

      setBilling(billingData);
    } catch (err) {
      setError('Failed to load billing information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBilling();
    }
  }, [user, loadBilling]);

  // Check for successful payment and refresh billing data
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const action = searchParams.get('action');
    const tokensParam = searchParams.get('tokens');

    // Show buy tokens section if action=buy-tokens
    if (action === 'buy-tokens') {
      setShowBuyTokens(true);
      // Scroll to buy tokens section
      setTimeout(() => {
        const element = document.getElementById('buy-tokens-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    // Handle successful token purchase
    if (success === 'true' && tokensParam && user) {
      const tokens = parseInt(tokensParam, 10);
      toast.success(
        `Success! ${tokens.toLocaleString()} tokens added to your account.`,
        { duration: 5000 }
      );

      // Refresh billing data
      setTimeout(() => {
        loadBilling();
      }, 2000);
    }
    // Handle successful subscription upgrade
    else if (success === 'true' && sessionId && user) {
      toast.success('Payment successful! Your subscription has been upgraded.');

      // Refresh billing data
      setTimeout(() => {
        loadBilling();
      }, 2000);
    }
  }, [searchParams, user, loadBilling]);

  const handleUpgrade = async (
    plan: 'pro' | 'enterprise',
    billingPeriod: 'monthly' | 'yearly' = 'monthly'
  ) => {
    if (!user) {
      toast.error('Please log in to upgrade your plan');
      return;
    }

    try {
      if (plan === 'pro') {
        toast.loading('Redirecting to checkout...');
        await upgradeToProPlan({
          userId: user.id,
          userEmail: user.email || '',
          billingPeriod,
        });
      } else if (plan === 'enterprise') {
        await contactEnterpriseSales({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.user_metadata?.full_name || user.email,
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process upgrade'
      );
    }
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) {
      toast.error('No billing information found. Please contact support.');
      return;
    }

    if (!isStripeConfigured()) {
      toast.error('Billing system is not configured. Please contact support.');
      return;
    }

    try {
      setIsManagingBilling(true);
      toast.loading('Opening billing portal...');
      await openBillingPortal(stripeCustomerId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to open billing portal'
      );
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleRefreshBilling = async () => {
    try {
      await loadBilling();
      toast.success('Billing information refreshed');
    } catch (err) {
      toast.error('Failed to refresh billing information. Please try again.');
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // In a production environment, this would:
    // 1. Call the backend to get a signed download URL
    // 2. Trigger the download
    // For now, show a message that this feature is coming soon
    toast.info('Invoice download will be available soon');
  };

  const handleBuyTokenPack = async (pack: TokenPack) => {
    if (!user) {
      toast.error('Please log in to purchase tokens');
      return;
    }

    try {
      toast.loading(`Redirecting to checkout for ${pack.name}...`);

      await buyTokenPack({
        userId: user.id,
        userEmail: user.email || '',
        packId: pack.id,
        tokens: pack.tokens,
        price: pack.price,
      });

      // User will be redirected to Stripe checkout
      // On success, they'll return to /billing?success=true&tokens=X
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start checkout. Please try again.'
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Zap className="h-5 w-5" />;
      case 'pro':
        return <Crown className="h-5 w-5" />;
      case 'enterprise':
        return <Building className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Loading billing information...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={loadBilling}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Billing dashboard error</h2>
            <p className="mt-2 text-muted-foreground">
              Unable to load billing information. Please refresh the page.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-4 md:space-y-8 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Billing</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Manage your subscription and billing information.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshBilling}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {billing?.plan !== 'free' && stripeCustomerId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={isManagingBilling}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isManagingBilling ? 'Opening...' : 'Manage Billing'}
                </span>
                <span className="sm:hidden">Manage</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {billing?.plan === 'free' && (
              <Button
                onClick={() => handleUpgrade('pro')}
                size="sm"
                className="gradient-primary"
              >
                <Crown className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Upgrade to Pro</span>
                <span className="sm:hidden">Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {getPlanIcon(billing?.plan || 'free')}
                  <span>Current Plan</span>
                </CardTitle>
                <CardDescription>
                  Your current subscription details
                </CardDescription>
              </div>
              <Badge>{billing?.plan?.toUpperCase() || 'FREE'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Price</p>
                <p className="text-2xl font-bold">
                  {billing?.price === 0
                    ? 'Free'
                    : formatCurrency(
                        billing?.price || 0,
                        billing?.currency || 'USD'
                      )}
                  {billing?.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium capitalize">
                    {billing?.status || 'Active'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Next Billing Date
                </p>
                <p className="text-sm font-medium">
                  {billing?.current_period_end
                    ? formatDate(billing.current_period_end)
                    : '--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Period</p>
                <p className="text-sm font-medium">
                  {billing?.plan === 'free' ? 'N/A' : 'Monthly'}
                </p>
              </div>
            </div>

            {billing?.plan !== 'free' && (
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Subscription Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Update payment methods, view invoices, and manage your
                      subscription
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isManagingBilling || !stripeCustomerId}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {isManagingBilling ? 'Opening...' : 'Manage'}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Usage Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Total Token Usage</span>
              </CardTitle>
              <CardDescription>
                Combined usage across all LLM providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Used</span>
                  <span className="text-2xl font-bold">
                    {billing?.usage.totalTokens.toLocaleString() || 0}
                  </span>
                </div>
                <Progress
                  value={
                    billing?.usage.totalTokens && billing?.usage.totalLimit
                      ? Math.min(
                          Math.max(
                            (billing.usage.totalTokens /
                              billing.usage.totalLimit) *
                              100,
                            0
                          ),
                          100
                        )
                      : 0
                  }
                  className="h-3"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {billing?.plan === 'free'
                      ? 'Monthly Limit'
                      : 'Token Allocation'}
                  </span>
                  <span className="font-medium">
                    {(billing?.usage.totalLimit || 1000000).toLocaleString()}{' '}
                    tokens
                  </span>
                </div>
                {billing?.usage.totalTokens > 0 &&
                  billing?.usage.totalTokens >=
                    (billing?.usage.totalLimit || 1000000) * 0.8 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Approaching limit -{' '}
                        {(
                          ((billing?.usage.totalLimit -
                            billing?.usage.totalTokens) /
                            billing?.usage.totalLimit) *
                          100
                        ).toFixed(0)}
                        % remaining
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Total Cost</span>
              </CardTitle>
              <CardDescription>Estimated cost (currently free)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Would be
                  </span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(
                      billing?.usage.totalCost || 0,
                      billing?.currency || 'USD'
                    )}
                  </span>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Free Tier Active</span>
                  </div>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-500">
                    You're saving{' '}
                    {formatCurrency(billing?.usage.totalCost || 0, 'USD')} with
                    the free plan!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-LLM Token Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Token Usage by LLM Provider</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {billing?.plan === 'pro'
                    ? 'Each provider has a 2.5M token limit • 10M total'
                    : 'Each provider has a 250k token limit • 1M total'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {billing?.plan === 'pro' ? 'Pro Plan' : 'Free Tier'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {billing?.usage.llmUsage.map((llm, index) => {
                const percentage = (llm.tokens / llm.limit) * 100;
                const isNearLimit = percentage >= 80;
                const isAtLimit = percentage >= 100;

                return (
                  <div
                    key={llm.provider}
                    className={`rounded-lg border p-4 transition-all ${llm.bgColor} ${isAtLimit ? 'border-red-300 dark:border-red-800' : isNearLimit ? 'border-amber-300 dark:border-amber-800' : ''}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg bg-white p-2 dark:bg-gray-800 ${llm.color}`}
                        >
                          {llm.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">
                            {llm.provider}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {llm.tokens.toLocaleString()} /{' '}
                            {llm.limit.toLocaleString()} tokens
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${isAtLimit ? 'text-red-600 dark:text-red-500' : isNearLimit ? 'text-amber-600 dark:text-amber-500' : ''}`}
                        >
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(llm.cost, 'USD')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress
                        value={llm.tokens > 0 ? Math.min(percentage, 100) : 0}
                        className={`h-2 ${isAtLimit ? 'bg-red-100 dark:bg-red-950/30' : isNearLimit ? 'bg-amber-100 dark:bg-amber-950/30' : ''}`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>
                          {Math.max(llm.limit - llm.tokens, 0).toLocaleString()}{' '}
                          remaining
                        </span>
                      </div>

                      {llm.tokens > 0 && isAtLimit && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>
                            Limit reached! Upgrade to continue using{' '}
                            {llm.provider}
                          </span>
                        </div>
                      )}
                      {llm.tokens > 0 && !isAtLimit && isNearLimit && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>
                            {(100 - percentage).toFixed(0)}% remaining
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-dashed bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-medium">Need more tokens?</h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {billing?.plan === 'free' &&
                      'Upgrade to Pro for 10M tokens/month (2.5M per LLM) - Only $29/month'}
                    {billing?.plan === 'pro' &&
                      'You have the Pro plan with 10M tokens/month (2.5M per LLM)'}
                  </p>
                  {billing?.plan === 'free' && (
                    <Button
                      className="gradient-primary"
                      onClick={() => handleUpgrade('pro', 'monthly')}
                    >
                      Upgrade to Pro - $29/month
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              Features included in your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {billing?.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Buy More Tokens Section */}
        {(showBuyTokens ||
          (billing?.usage.totalTokens > 0 &&
            billing?.usage.totalTokens >=
              billing?.usage.totalLimit * 0.85)) && (
          <Card id="buy-tokens-section" className="border-2 border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    Buy More Tokens
                  </CardTitle>
                  <CardDescription>
                    Purchase additional tokens to keep your AI employees working
                    without interruption
                  </CardDescription>
                </div>
                {showBuyTokens && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBuyTokens(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Warning if near limit */}
              {billing?.usage.totalTokens > 0 &&
                billing?.usage.totalTokens >=
                  billing?.usage.totalLimit * 0.85 && (
                  <div
                    className={`mb-6 rounded-lg border p-4 ${
                      billing?.usage.totalTokens >=
                      billing?.usage.totalLimit * 0.95
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-yellow-500/50 bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`mt-0.5 h-5 w-5 ${
                          billing?.usage.totalTokens >=
                          billing?.usage.totalLimit * 0.95
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="mb-1 font-semibold">
                          {billing?.usage.totalTokens >=
                          billing?.usage.totalLimit * 0.95
                            ? '🚨 Critical: 95% Usage Reached'
                            : '⚠️ Warning: 85% Usage Reached'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          You've used{' '}
                          {(
                            (billing?.usage.totalTokens /
                              billing?.usage.totalLimit) *
                            100
                          ).toFixed(1)}
                          % of your {billing?.plan === 'pro' ? '10M' : '1M'}{' '}
                          token limit. Buy more tokens now to avoid service
                          interruption.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Token Packs Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {TOKEN_PACKS.map((pack) => (
                  <Card
                    key={pack.id}
                    className={cn(
                      'relative transition-all hover:shadow-lg',
                      pack.popular && 'border-2 border-primary'
                    )}
                  >
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                          <Star className="mr-1 h-3 w-3" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          ${pack.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          one-time
                        </span>
                      </div>
                      {pack.savings && (
                        <Badge variant="secondary" className="mt-2 w-fit">
                          {pack.savings}
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tokens</span>
                          <span className="font-bold">
                            {(pack.tokens / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Cost per 1K
                          </span>
                          <span className="font-medium">
                            ${((pack.price / pack.tokens) * 1000).toFixed(3)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleBuyTokenPack(pack)}
                        className={cn(
                          'w-full',
                          pack.popular &&
                            'bg-gradient-to-r from-primary to-accent'
                        )}
                        variant={pack.popular ? 'default' : 'outline'}
                      >
                        Buy {pack.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Token Pack Benefits */}
              <div className="mt-6 rounded-lg border border-dashed bg-muted/50 p-4">
                <h4 className="mb-3 font-medium">✨ Token Pack Benefits</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                    <div>
                      <span className="font-medium">Instant Activation</span>
                      <p className="text-muted-foreground">
                        Tokens available immediately after purchase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                    <div>
                      <span className="font-medium">No Expiration</span>
                      <p className="text-muted-foreground">
                        Use your tokens whenever you need them
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                    <div>
                      <span className="font-medium">Market-Rate Pricing</span>
                      <p className="text-muted-foreground">
                        Same as direct OpenAI/Anthropic usage
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                    <div>
                      <span className="font-medium">All Providers</span>
                      <p className="text-muted-foreground">
                        Works with OpenAI, Claude, Gemini, Perplexity
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative: Upgrade to Pro */}
              {billing?.plan === 'free' && (
                <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold">
                        💡 Better Value: Upgrade to Pro
                      </h4>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Get 10M tokens/month for $29/month ($24.99/month if
                        billed yearly) - Better value than buying token packs if
                        you use AI regularly
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpgrade('pro', 'monthly')}
                      >
                        View Pro Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upgrade Options */}
        {billing?.plan === 'free' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upgrade Your Plan</CardTitle>
                  <CardDescription>
                    Choose a plan that fits your needs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Billing:
                  </span>
                  <div className="flex items-center rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={`rounded-md px-3 py-1 text-sm transition-colors ${
                        billingPeriod === 'monthly'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('yearly')}
                      className={`rounded-md px-3 py-1 text-sm transition-colors ${
                        billingPeriod === 'yearly'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Yearly
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Save 14%
                      </Badge>
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Pro Plan */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <CardTitle>Pro Plan</CardTitle>
                    </div>
                    <div className="text-2xl font-bold">
                      {billingPeriod === 'yearly' ? (
                        <>
                          <div className="text-3xl font-bold text-white">
                            $24.99
                            <span className="text-lg text-muted-foreground">
                              /month
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Billed yearly as $299.88
                          </div>
                        </>
                      ) : (
                        <>
                          $29
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>10M tokens/month</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>2.5M tokens per LLM</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>All 4 AI providers</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Advanced analytics</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>API access</span>
                      </li>
                    </ul>
                    <Button
                      className="gradient-primary mt-4 w-full"
                      onClick={() => handleUpgrade('pro', billingPeriod)}
                    >
                      Upgrade to Pro
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Enterprise Plan */}
                <Card className="border-2 border-secondary">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle>Enterprise</CardTitle>
                    </div>
                    <div className="text-2xl font-bold">
                      Custom
                      <span className="text-sm text-muted-foreground">
                        {' '}
                        pricing
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Everything in Pro</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Unlimited tokens</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>White-label option</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Custom workflows</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>SLA guarantee</span>
                      </li>
                    </ul>
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() => handleUpgrade('enterprise', 'monthly')}
                    >
                      Contact Sales
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {billing?.invoices.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Invoices Yet</h3>
                <p className="text-muted-foreground">
                  Your invoice history will appear here once you start using
                  paid features.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {billing?.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Invoice #{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(
                            invoice.amount,
                            billing?.currency || 'USD'
                          )}
                        </p>
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default BillingPage;
