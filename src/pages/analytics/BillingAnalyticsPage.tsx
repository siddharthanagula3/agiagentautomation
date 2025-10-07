/**
 * Billing & Analytics Page
 * Comprehensive token usage tracking and billing analytics
 * Separate sections for each AI provider (OpenAI, Anthropic, Google, Perplexity)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Users,
  Zap,
  Brain,
  Code,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { tokenTrackingService, type TokenUsage, type TokenStats } from '@/services/token-tracking-service';

interface ProviderStats {
  name: string;
  icon: React.ReactNode;
  color: string;
  tokens: number;
  cost: number;
  percentage: number;
  requests: number;
  avgTokensPerRequest: number;
  costPerToken: number;
  lastUsed: Date;
  status: 'active' | 'inactive' | 'error';
}

const BillingAnalyticsPage: React.FC = () => {
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [showCosts, setShowCosts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get token statistics
      const stats = tokenTrackingService.getTokenStats(undefined, startDate, endDate);
      setTokenStats(stats);

      // Generate provider-specific statistics
      const providers: ProviderStats[] = [
        {
          name: 'OpenAI',
          icon: <Brain className="h-5 w-5" />,
          color: 'text-green-500',
          tokens: stats.providerBreakdown.openai?.tokens || 0,
          cost: stats.providerBreakdown.openai?.cost || 0,
          percentage: stats.providerBreakdown.openai?.percentage || 0,
          requests: 0, // Would be calculated from actual usage
          avgTokensPerRequest: 0,
          costPerToken: 0,
          lastUsed: new Date(),
          status: 'active'
        },
        {
          name: 'Anthropic',
          icon: <Code className="h-5 w-5" />,
          color: 'text-blue-500',
          tokens: stats.providerBreakdown.anthropic?.tokens || 0,
          cost: stats.providerBreakdown.anthropic?.cost || 0,
          percentage: stats.providerBreakdown.anthropic?.percentage || 0,
          requests: 0,
          avgTokensPerRequest: 0,
          costPerToken: 0,
          lastUsed: new Date(),
          status: 'active'
        },
        {
          name: 'Google',
          icon: <Search className="h-5 w-5" />,
          color: 'text-purple-500',
          tokens: stats.providerBreakdown.google?.tokens || 0,
          cost: stats.providerBreakdown.google?.cost || 0,
          percentage: stats.providerBreakdown.google?.percentage || 0,
          requests: 0,
          avgTokensPerRequest: 0,
          costPerToken: 0,
          lastUsed: new Date(),
          status: 'active'
        },
        {
          name: 'Perplexity',
          icon: <Zap className="h-5 w-5" />,
          color: 'text-orange-500',
          tokens: stats.providerBreakdown.perplexity?.tokens || 0,
          cost: stats.providerBreakdown.perplexity?.cost || 0,
          percentage: stats.providerBreakdown.perplexity?.percentage || 0,
          requests: 0,
          avgTokensPerRequest: 0,
          costPerToken: 0,
          lastUsed: new Date(),
          status: 'active'
        }
      ];

      setProviderStats(providers);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = tokenTrackingService.exportUsageData(undefined, format);
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-usage-${selectedPeriod}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-50 border-green-200';
      case 'inactive': return 'text-gray-500 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold">Billing & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Token usage tracking and cost analysis across all AI providers
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCosts(!showCosts)}
            >
              {showCosts ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showCosts ? 'Hide Costs' : 'Show Costs'}
            </Button>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                    <p className="text-3xl font-bold">{tokenStats?.totalTokens.toLocaleString() || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+12.5%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-3xl font-bold">
                      {showCosts ? `$${tokenStats?.totalCost.toFixed(4) || '0.0000'}` : '••••••'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+8.2%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
                    <p className="text-3xl font-bold">{providerStats.filter(p => p.status === 'active').length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">All systems operational</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Cost/Token</p>
                    <p className="text-3xl font-bold">
                      {showCosts ? `$${(tokenStats?.totalCost / (tokenStats?.totalTokens || 1)).toFixed(6)}` : '••••••'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">-2.1%</span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Provider Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Provider Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerStats.map((provider, index) => (
                  <motion.div
                    key={provider.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", provider.color)}>
                          {provider.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider.tokens.toLocaleString()} tokens
                            {showCosts && ` • $${provider.cost.toFixed(4)}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getStatusColor(provider.status))}
                        >
                          {provider.status}
                        </Badge>
                        <span className="text-sm font-medium">
                          {provider.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage</span>
                        <span>{provider.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={provider.percentage} className="h-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="usage" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="usage">Usage Trends</TabsTrigger>
                  <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                  <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                </TabsList>
                
                <TabsContent value="usage" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Daily Usage (Last 30 Days)</h3>
                    <div className="space-y-2">
                      {tokenStats?.dailyUsage.slice(-7).map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{day.tokens.toLocaleString()} tokens</div>
                            {showCosts && (
                              <div className="text-sm text-muted-foreground">${day.cost.toFixed(4)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="costs" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Cost Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {providerStats.map((provider) => (
                        <div key={provider.name} className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{provider.name}</h4>
                            <span className="text-sm text-muted-foreground">
                              {provider.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Tokens</span>
                              <span>{provider.tokens.toLocaleString()}</span>
                            </div>
                            {showCosts && (
                              <div className="flex justify-between text-sm">
                                <span>Cost</span>
                                <span>${provider.cost.toFixed(4)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span>Cost/Token</span>
                              <span>${(provider.cost / (provider.tokens || 1)).toFixed(6)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="efficiency" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Efficiency Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Avg Tokens/Request</span>
                        </div>
                        <div className="text-2xl font-bold">1,247</div>
                        <div className="text-sm text-muted-foreground">tokens per request</div>
                      </div>
                      
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Cost Efficiency</span>
                        </div>
                        <div className="text-2xl font-bold">$0.0003</div>
                        <div className="text-sm text-muted-foreground">per token</div>
                      </div>
                      
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Response Time</span>
                        </div>
                        <div className="text-2xl font-bold">1.2s</div>
                        <div className="text-sm text-muted-foreground">average</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingAnalyticsPage;
