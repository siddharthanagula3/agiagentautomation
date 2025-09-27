import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  DollarSign, 
  Clock,
  Target,
  Activity,
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { analyticsService } from '../../services/analyticsService';

interface Performer {
  id: string;
  name: string;
  completedJobs: number;
  rating: number;
  value: number;
}

interface UsageCategory {
  name: string;
  value: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  value: number;
  change: number;
}

interface AnalyticsData {
  totalEmployees: number;
  activeJobs: number;
  completionRate: number;
  totalRevenue: number;
  averageJobTime: number;
  employeePerformance: Array<{
    id: string;
    name: string;
    completedJobs: number;
    rating: number;
  }>;
  jobMetrics: {
    totalJobs: number;
    pendingJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
  topPerformers?: Performer[];
  usageByCategory?: UsageCategory[];
  monthlyTrends?: MonthlyTrend[];
}

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('month');
  useEffect(() => {
  const loadAnalytics = useCallback(async () => {
const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange, loadAnalytics]);

    if (!user) return;

    try {
      setLoading(true);
      const { data } = await analyticsService.getUserAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track performance, costs, and efficiency of your AI workforce.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last year</option>
          </select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.totalJobs || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics?.completedJobs || 0} completed
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.successRate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-muted-foreground">
                  {analytics?.activeJobs || 0} active
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <Target className="h-8 w-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics?.totalCost || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  Avg: {formatCurrency((analytics?.totalCost || 0) / Math.max(analytics?.totalJobs || 1, 1))}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <DollarSign className="h-8 w-8 text-agent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(analytics?.tokensUsed || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  Avg: {formatNumber((analytics?.tokensUsed || 0) / Math.max(analytics?.totalJobs || 1, 1))} per job
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <Zap className="h-8 w-8 text-workforce" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators for your AI workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">Efficiency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-sm font-medium">95%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-workforce rounded-full"></div>
                  <span className="text-sm font-medium">Speed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div className="bg-workforce h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="text-sm font-medium">88%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-agent rounded-full"></div>
                  <span className="text-sm font-medium">Reliability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div className="bg-agent h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <span className="text-sm font-medium">96%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
            <CardDescription>Your most efficient AI employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topPerformers?.slice(0, 5).map((performer: Performer, index: number) => (
                <div key={performer.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{performer.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{performer.tasks} tasks</p>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${performer.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Performance Analytics
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    No performance data available yet. Start using AI agents to see analytics.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Category</CardTitle>
          <CardDescription>Breakdown of AI agent usage across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.usageByCategory?.map((category: UsageCategory, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                  <div>
                    <p className="font-medium text-foreground">{category.category}</p>
                    <p className="text-sm text-muted-foreground">{category.count} jobs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatCurrency(category.cost)}</p>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(category.cost / (analytics?.totalCost || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Revenue Analytics
                </h3>
                <p className="text-muted-foreground mb-6">
                  No usage data available yet. Start creating jobs to see cost breakdowns.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Track your AI workforce performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.monthlyTrends?.map((trend: MonthlyTrend, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{trend.month}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{trend.jobs} Jobs</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(trend.cost)} spent</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{formatNumber(trend.tokens)}</p>
                    <p className="text-xs text-muted-foreground">Tokens</p>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min((trend.jobs / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Trend Analysis
                </h3>
                <p className="text-muted-foreground mb-6">
                  No trend data available yet. Continue using the platform to see performance trends.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall system performance and reliability metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-medium text-foreground">Uptime</p>
              <p className="text-2xl font-bold text-green-600">99.9%</p>
              <div className="w-24 bg-muted rounded-full h-2 mx-auto mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="font-medium text-foreground">Response Time</p>
              <p className="text-2xl font-bold text-yellow-600">68ms</p>
              <div className="w-24 bg-muted rounded-full h-2 mx-auto mt-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-foreground">Throughput</p>
              <p className="text-2xl font-bold text-primary">2.3K/min</p>
              <div className="w-24 bg-muted rounded-full h-2 mx-auto mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;