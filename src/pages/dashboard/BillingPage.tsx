import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
  FileText
} from 'lucide-react';

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  price: number;
  currency: string;
  features: string[];
  usage: {
    tokens: number;
    tokens_limit: number;
    cost: number;
    cost_limit: number;
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
  const [isLoading, setisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (user) {
      loadBilling();
    }
  }, [user]);

  const loadBilling = useCallback(async () => {
    try {
      setisLoading(true);
      setError(null);
      
      // Simulate API call - in real implementation, this would fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For new users, return free plan data
      const billingData: BillingInfo = {
        plan: 'free',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price: 0,
        currency: 'USD',
        features: [
          'Basic AI employees',
          'Limited job creation',
          'Basic analytics',
          'Email support'
        ],
        usage: {
          tokens: 0,
          tokens_limit: 1000,
          cost: 0,
          cost_limit: 0
        },
        invoices: []
      };
      
      setBilling(billingData);
      
    } catch (err) {
      console.error('Error isLoading billing:', err);
      setError('Failed to load billing information. Please try again.');
    } finally {
      setisLoading(false);
    }
  }, []);

  const handleUpgrade = (plan: 'pro' | 'enterprise') => {
    console.log(`Upgrading to ${plan} plan`);
    // In real implementation, this would redirect to payment processing
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log(`DownisLoading invoice ${invoiceId}`);
    // In real implementation, this would download the invoice
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return <Zap className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Building className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">isLoading billing information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadBilling}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information.
          </p>
        </div>
        <Button onClick={() => setShowUpgrade(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
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
            <Badge className={getPlanColor(billing?.plan || 'free')}>
              {billing?.plan?.toUpperCase() || 'FREE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Plan Price</p>
              <p className="text-2xl font-bold">
                {billing?.price === 0 ? 'Free' : formatCurrency(billing?.price || 0, billing?.currency || 'USD')}
                {billing?.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium capitalize">{billing?.status || 'Active'}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="text-sm font-medium">
                {billing?.current_period_end ? formatDate(billing.current_period_end) : '--'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Token Usage</span>
            </CardTitle>
            <CardDescription>
              Your current token consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className="font-semibold">{billing?.usage.tokens || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((billing?.usage.tokens || 0) / (billing?.usage.tokens_limit || 1000) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>0</span>
                <span>{billing?.usage.tokens_limit || 1000} limit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cost Usage</span>
            </CardTitle>
            <CardDescription>
              Your current cost consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Spent</span>
                <span className="font-semibold">
                  {formatCurrency(billing?.usage.cost || 0, billing?.currency || 'USD')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((billing?.usage.cost || 0) / (billing?.usage.cost_limit || 100) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>$0</span>
                <span>${billing?.usage.cost_limit || 100} limit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            Features included in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {billing?.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Your Plan</CardTitle>
          <CardDescription>
            Choose a plan that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-blue-600" />
                  <CardTitle>Pro Plan</CardTitle>
                </div>
                <div className="text-2xl font-bold">$29<span className="text-sm text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Unlimited AI employees</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>API access</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" onClick={() => handleUpgrade('pro')}>
                  Upgrade to Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-purple-600" />
                  <CardTitle>Enterprise</CardTitle>
                </div>
                <div className="text-2xl font-bold">Custom<span className="text-sm text-muted-foreground"> pricing</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>SLA guarantee</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline" onClick={() => handleUpgrade('enterprise')}>
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Your recent invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billing?.invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Invoices Yet</h3>
              <p className="text-muted-foreground">
                Your invoice history will appear here once you start using paid features.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {billing?.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Invoice #{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.amount, billing?.currency || 'USD')}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(invoice.id)}>
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
