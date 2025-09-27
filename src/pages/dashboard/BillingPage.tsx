import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Calendar,
  CreditCard,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Zap,
  Users,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { billingService, BillingStats, SubscriptionPlan } from '../../services/billingService';
import type { Database } from '../../integrations/supabase/types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Billing = Database['public']['Tables']['billing']['Row'];

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [billingHistory, setBillingHistory] = useState<Billing[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (user) {
      loadBillingData();
      const timeout = setTimeout(() => setLoading(false), 8000);
      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [user, loadBillingData]);

  const loadBillingData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load billing stats
      const { data: stats } = await billingService.getBillingStats(user.id);
      
      // Load billing history
      const { data: history } = await billingService.getBillingHistory(user.id);
      
      // Load subscription
      const { data: sub } = await billingService.getSubscription(user.id);
      
      // Load available plans
      const { data: plans } = await billingService.getAvailablePlans();

      setBillingStats(stats);
      setBillingHistory(history || []);
      setSubscription(sub);
      setAvailablePlans(plans || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading billing information...</span>
        </div>
      </div>
    );
  }

  // Render gracefully even if no stats/subscription/history exist yet
  const stats = billingStats || { totalSpent: 0, thisMonth: 0, pending: 0, nextBilling: 0, usage: { tokensUsed: 0, tokensLimit: 10000, jobsCompleted: 0, employeesActive: 0, estimatedCost: 0 } };
  const history = billingHistory || [];

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground mb-4">
            This page will show your data once you start using the system.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Usage</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, view usage, and download invoices.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadBillingData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Billing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.thisMonth)}</p>
                <p className="text-sm text-muted-foreground">Current period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.nextBilling)}</p>
                <p className="text-sm text-muted-foreground">Due soon</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Current month usage and limits</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.usage.tokensUsed === 0 && stats.usage.jobsCompleted === 0 && stats.usage.employeesActive === 0 && stats.usage.estimatedCost === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Usage Data</h3>
                <p className="text-muted-foreground">Start creating jobs and hiring AI employees to see usage metrics.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Tokens Used</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.usage.tokensUsed.toLocaleString()} / {stats.usage.tokensLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min((stats.usage.tokensUsed / Math.max(stats.usage.tokensLimit, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((stats.usage.tokensUsed / Math.max(stats.usage.tokensLimit, 1)) * 100)}% of monthly limit
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Jobs Completed</p>
                    <p className="text-xl font-semibold text-foreground">{stats.usage.jobsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Employees</p>
                    <p className="text-xl font-semibold text-foreground">{stats.usage.employeesActive}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(stats.usage.estimatedCost)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{subscription.plan_name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(subscription.amount)}/month</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {subscription.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Auto-renewal enabled</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlimited AI employees</li>
                    <li>• Unlimited jobs</li>
                    <li>• Advanced analytics</li>
                    <li>• Priority support</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Next billing: {formatDate(subscription.current_period_end || '')}</span>
                </div>

                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive/80">
                  Cancel Subscription
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Active Subscription
                </h3>
                <p className="text-muted-foreground mb-6">
                  Choose a plan to start using the AI workforce platform.
                </p>
                <Button>Choose Plan</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.description || 'Subscription Payment'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(item.amount)}</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-muted-foreground capitalize">{item.status}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Usage Analytics
                </h3>
                <p className="text-muted-foreground mb-6">
                  No billing history available yet. Start using the platform to see transaction records.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods: remove mock card until real payment integration exists */}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or change your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan, index) => (
              <Card key={index} className={`${plan.name === 'Professional' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">{formatCurrency(plan.amount)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.name === 'Professional' ? 'default' : 'outline'}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;