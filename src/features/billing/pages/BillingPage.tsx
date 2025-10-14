import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@shared/stores/unified-auth-store';
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
} from '@features/billing/services/stripe-service';
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

const BillingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Free tier limits: 1M total, 250k per provider
      const PROVIDER_LIMIT = 250000; // 250k tokens per LLM
      const TOTAL_LIMIT = 1000000; // 1M total tokens

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
          // Fetch usage from Supabase token_usage table
          const { data: usageData, error: usageError } = await supabase
            .from('token_usage')
            .select(
              'provider, input_tokens, output_tokens, total_tokens, total_cost'
            )
            .eq('user_id', user.id);

          if (usageError) {
            console.error('Error fetching token usage:', usageError);
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
          console.error('Error querying token usage:', err);
        }
      }

      // Calculate total usage
      const totalTokens = llmUsage.reduce((sum, llm) => sum + llm.tokens, 0);
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
          .single();

        if (!userError && userData) {
          userPlan = userData.plan || 'free';
          subscriptionEndDate = userData.subscription_end_date;
          setStripeCustomerId(userData.stripe_customer_id);
          console.log('[Billing] ✅ User plan loaded successfully:');
          console.log('[Billing]    Plan:', userPlan);
          console.log('[Billing]    Status:', userData.plan_status);
          console.log('[Billing]    Billing Period:', userData.billing_period);
          console.log('[Billing]    Subscription End:', subscriptionEndDate);
          console.log(
            '[Billing]    Stripe Customer ID:',
            userData.stripe_customer_id ? 'Set ✓' : 'Not set ✗'
          );
          console.log(
            '[Billing]    Stripe Subscription ID:',
            userData.stripe_subscription_id ? 'Set ✓' : 'Not set ✗'
          );
        } else if (userError) {
          console.error('[Billing] ❌ Error fetching user plan:', userError);
          console.error(
            '[Billing]    This might mean the "plan" column doesn\'t exist in the users table.'
          );
          console.error('[Billing]    Please run: supabase db push');
        }
      } catch (err) {
        console.error('[Billing] ❌ Error fetching user plan:', err);
      }

      const isPro = userPlan === 'pro';

      // Update limits based on plan
      const proProviderLimit = 2500000; // 2.5M per provider (Pro)
      const proTotalLimit = 10000000; // 10M total (Pro)

      console.log('[Billing] 📊 Applying token limits:');
      console.log('[Billing]    User Plan:', userPlan);
      console.log('[Billing]    Is Pro?', isPro ? 'Yes ✓' : 'No ✗');
      console.log(
        '[Billing]    Token Limit per LLM:',
        isPro ? '2.5M (Pro)' : '250k (Free)'
      );
      console.log(
        '[Billing]    Total Token Limit:',
        isPro ? '10M (Pro)' : '1M (Free)'
      );

      if (isPro) {
        llmUsage = llmUsage.map((llm) => ({
          ...llm,
          limit: proProviderLimit,
        }));
      }

      const billingData: BillingInfo = {
        plan: userPlan,
        status: 'active',
        current_period_start: subscriptionEndDate
          ? new Date(
              new Date(subscriptionEndDate).getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          : new Date().toISOString(),
        current_period_end:
          subscriptionEndDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
          totalTokens,
          totalLimit: isPro ? proTotalLimit : TOTAL_LIMIT,
          totalCost,
          llmUsage,
        },
        invoices: [],
      };

      setBilling(billingData);
    } catch (err) {
      console.error('Error loading billing:', err);
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

    if (success === 'true' && sessionId && user) {
      console.log('[Billing] Payment successful, refreshing billing data...');
      toast.success('Payment successful! Your subscription has been upgraded.');

      // Wait a moment for webhook to process, then refresh
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
      console.error('Upgrade error:', error);
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
      console.error('Billing portal error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to open billing portal'
      );
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleRefreshBilling = async () => {
    await loadBilling();
    toast.success('Billing information refreshed');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log(`Downloading invoice ${invoiceId}`);
    // In real implementation, this would download the invoice
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your subscription and billing information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshBilling}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          {billing?.plan !== 'free' && stripeCustomerId && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isManagingBilling}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isManagingBilling ? 'Opening...' : 'Manage Billing'}
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {billing?.plan === 'free' && (
            <Button
              onClick={() => handleUpgrade('pro')}
              className="gradient-primary"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
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
                  <span className="text-sm text-muted-foreground">/month</span>
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
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
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
                <span className="text-muted-foreground">Free Tier Limit</span>
                <span className="font-medium">
                  {(billing?.usage.totalLimit || 1000000).toLocaleString()}{' '}
                  tokens
                </span>
              </div>
              {billing?.usage.totalTokens >=
                billing?.usage.totalLimit * 0.8 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Approaching limit -{' '}
                    {(
                      (1 -
                        billing?.usage.totalTokens /
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
                <span className="text-sm text-muted-foreground">Would be</span>
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
                        {(llm.limit - llm.tokens).toLocaleString()} remaining
                      </span>
                    </div>

                    {isAtLimit && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Limit reached! Upgrade to continue using{' '}
                          {llm.provider}
                        </span>
                      </div>
                    )}
                    {!isAtLimit && isNearLimit && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{(100 - percentage).toFixed(0)}% remaining</span>
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
                <span className="text-sm text-muted-foreground">Billing:</span>
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
                      Save 17%
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
                        $200
                        <span className="text-sm text-muted-foreground">
                          /year
                        </span>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Save $40 (17% off)
                        </div>
                      </>
                    ) : (
                      <>
                        $20
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
                Your invoice history will appear here once you start using paid
                features.
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
                          invoice.status === 'paid' ? 'default' : 'destructive'
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
  );
};

export default BillingPage;
