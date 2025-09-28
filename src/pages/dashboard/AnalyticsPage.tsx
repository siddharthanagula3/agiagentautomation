import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/unified-auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalAgents: number;
  activeAgents: number;
  totalRevenue: number;
  avgJobDuration: number;
  successRate: number;
  monthlyGrowth: number;
  topPerformingAgent: string;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
      setLoading(true);
    
    // Set default values immediately
    setAnalytics({
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalAgents: 0,
      activeAgents: 0,
      totalRevenue: 0,
      avgJobDuration: 0,
      successRate: 0,
      monthlyGrowth: 0,
      topPerformingAgent: 'N/A',
      recentActivity: []
    });
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No analytics data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytics will appear once you start using the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your AI automation performance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.monthlyGrowth > 0 ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{analytics.monthlyGrowth}% from last month
                </span>
              ) : (
                <span className="text-muted-foreground">No change from last month</span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Job completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.totalAgents} total agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Performance</CardTitle>
            <CardDescription>
              Overview of your automation jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed Jobs</span>
                <Badge variant="default">{analytics.completedJobs}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Failed Jobs</span>
                <Badge variant="destructive">{analytics.failedJobs}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Duration</span>
                <span className="text-sm text-muted-foreground">{analytics.avgJobDuration} min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>
              Your AI workforce statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Agents</span>
                <Badge variant="outline">{analytics.totalAgents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Agents</span>
                <Badge variant="default">{analytics.activeAgents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Top Performer</span>
                <span className="text-sm text-muted-foreground">{analytics.topPerformingAgent}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest events and job completions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No recent activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Activity will appear here as you use the platform.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500 dark:bg-green-400' :
                      activity.status === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-500 dark:bg-red-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Actions</CardTitle>
          <CardDescription>
            Generate reports and export data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <BarChart3 className="h-6 w-6 mb-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <TrendingUp className="h-6 w-6 mb-2" />
              View Trends
            </Button>
            <Button variant="outline" className="h-20 flex-col border-border hover:bg-accent hover:text-accent-foreground">
              <Activity className="h-6 w-6 mb-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;