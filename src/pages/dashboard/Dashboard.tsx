import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Bot, 
  Users, 
  Workflow, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Zap,
  Target,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';
import { agentsService } from '../../services/agentsService';
import { jobsService } from '../../services/jobsService';
import { analyticsService, AnalyticsData } from '../../services/analyticsService';
import { billingService } from '../../services/billingService';
import type { Database } from '../../integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type AIAgent = Database['public']['Tables']['ai_agents']['Row'];


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    aiEmployees: 0,
    activeJobs: 0,
    tokensUsed: 0,
    totalCost: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [aiEmployees, setAiEmployees] = useState<AIAgent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Set default values for new users immediately
      setStats({
        aiEmployees: 0,
        activeJobs: 0,
        tokensUsed: 0,
        totalCost: 0
      });
      setRecentJobs([]);
      setAiEmployees([]);
      setAnalytics(null);

      // Try to load real data from Supabase with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service timeout')), 5000)
      );

      try {
        const [
          agentStatsResult,
          jobStatsResult,
          recentJobsResult,
          topAgentsResult,
          analyticsResult,
          billingStatsResult
        ] = await Promise.race([
          Promise.allSettled([
            agentsService.getAgentStats(),
            jobsService.getJobStats(user.id),
            jobsService.getRecentJobs(user.id, 3),
            agentsService.getTopRatedAgents(3),
            analyticsService.getUserAnalytics(user.id),
            billingService.getBillingStats(user.id)
          ]),
          timeoutPromise
        ]) as PromiseSettledResult<any>[];

        // Extract data from results - handle empty data gracefully for new users
        const agentStats = agentStatsResult.status === 'fulfilled' ? agentStatsResult.value.data : { total: 0, available: 0, working: 0, maintenance: 0, offline: 0 };
        const jobStats = jobStatsResult.status === 'fulfilled' ? jobStatsResult.value.data : { totalJobs: 0, activeJobs: 0, completedJobs: 0, failedJobs: 0 };
        const recentJobs = recentJobsResult.status === 'fulfilled' ? recentJobsResult.value.data || [] : [];
        const topAgents = topAgentsResult.status === 'fulfilled' ? topAgentsResult.value.data || [] : [];
        const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value.data : { tokensUsed: 0, apiCalls: 0, processingTime: 0 };
        const billingStats = billingStatsResult.status === 'fulfilled' ? billingStatsResult.value.data : { totalSpent: 0, currentMonthSpent: 0, lastPayment: null };

        // Update state with real data (will show 0s for new users)
        setStats({
          aiEmployees: agentStats?.total || 0,
          activeJobs: jobStats?.activeJobs || 0,
          tokensUsed: analyticsData?.tokensUsed || 0,
          totalCost: billingStats?.totalSpent || 0
        });

        setRecentJobs(recentJobs);
        setAiEmployees(topAgents);
        setAnalytics(analyticsData);

        // Log any service errors for debugging (but don't show to user)
        [agentStatsResult, jobStatsResult, recentJobsResult, topAgentsResult, analyticsResult, billingStatsResult]
          .forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`Service ${index} failed:`, result.reason);
            }
          });

      } catch (serviceError) {
        console.warn('Services failed, using default values:', serviceError);
        // Keep the default values we set above
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't set error state, just use default values
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, loadDashboardData]);

  // Initialize real-time updates when user is available
  useEffect(() => {
    if (user?.id) {
      // Initialize real-time subscriptions
      const initializeRealtime = async () => {
        try {
          // You can add real-time initialization here if needed
          // Real-time updates initialized
        } catch (error) {
          console.error('Failed to initialize real-time updates:', error);
        }
      };

      initializeRealtime();
    }
  }, [user?.id]);

  const dashboardStats = [
    {
      title: 'AI Employees',
      value: stats.aiEmployees.toString(),
      change: '+3 this month',
      icon: <Users className="h-8 w-8 text-primary" />,
      color: 'primary'
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs.toString(),
      change: '+2 today',
      icon: <Workflow className="h-8 w-8 text-success" />,
      color: 'success'
    },
    {
      title: 'Tokens Used',
      value: stats.tokensUsed.toLocaleString(),
      change: '+12% from last month',
      icon: <Zap className="h-8 w-8 text-workforce" />,
      color: 'workforce'
    },
    {
      title: 'Total Cost',
      value: `$${stats.totalCost.toFixed(2)}`,
      change: '+8% from last month',
      icon: <DollarSign className="h-8 w-8 text-agent" />,
      color: 'agent'
    }
  ];

  const quickActions = [
    {
      title: 'Hire AI Employee',
      description: 'Browse and hire specialized AI agents',
      icon: <Bot className="h-6 w-6 text-primary" />,
      href: '/dashboard/employees',
      color: 'primary'
    },
    {
      title: 'Submit Job',
      description: 'Create a new workforce task',
      icon: <Workflow className="h-6 w-6 text-success" />,
      href: '/dashboard/workforce',
      color: 'success'
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: <BarChart3 className="h-6 w-6 text-agent" />,
      href: '/dashboard/analytics',
      color: 'agent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'running':
        return 'bg-primary/10 text-primary';
      case 'queued':
        return 'bg-workforce/10 text-workforce';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'running':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-workforce" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Debug information
  // Dashboard render completed

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty state for new users */}
      {recentJobs.length === 0 && aiEmployees.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to AGI Agent Automation</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first AI employee or job.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/dashboard/ai-employees">
                <Plus className="mr-2 h-4 w-4" />
                Create AI Employee
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/jobs">
                <Workflow className="mr-2 h-4 w-4" />
                Create Job
              </Link>
            </Button>
          </div>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name}! Here's what's happening with your AI workforce.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.change}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to={action.href}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest workforce activities</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/jobs">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length > 0 ? recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-foreground">{job.title}</h4>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{job.ai_agents?.name || 'Unassigned'}</span>
                      <span>•</span>
                      <span>{job.actual_duration ? formatDuration(job.actual_duration) : 'In progress'}</span>
                      <span>•</span>
                      <span>${job.cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    {job.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent jobs found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Employees */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your AI Employees</CardTitle>
                <CardDescription>Currently hired AI agents</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/employees">Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiEmployees.length > 0 ? aiEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-sm font-medium">{employee.rating}</span>
                      <span className="text-sm text-muted-foreground">★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{employee.tasks_completed} tasks</p>
                    <Badge 
                      variant={employee.status === 'working' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No AI employees hired yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to scale your operations?
              </h3>
              <p className="text-muted-foreground mb-4">
                Hire more AI employees or submit complex jobs to our workforce.
              </p>
              <div className="flex space-x-4">
                <Button asChild>
                  <Link to="/dashboard/employees">
                    <Plus className="mr-2 h-4 w-4" />
                    Hire AI Employee
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard/workforce">
                    <Target className="mr-2 h-4 w-4" />
                    Submit Job
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-agent rounded-full flex items-center justify-center">
                <Bot className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;