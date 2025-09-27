import React, { useState, 
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual data fetching
      setData([]);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);useEffect } from 'react';
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

const SimpleDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const dashboardStats = [
    {
      title: 'AI Employees',
      value: '0',
      change: 'No employees yet',
      icon: <Users className="h-8 w-8 text-primary" />,
      color: 'primary'
    },
    {
      title: 'Active Jobs',
      value: '0',
      change: 'No jobs yet',
      icon: <Workflow className="h-8 w-8 text-success" />,
      color: 'success'
    },
    {
      title: 'Tokens Used',
      value: '0',
      change: 'No usage yet',
      icon: <Zap className="h-8 w-8 text-workforce" />,
      color: 'workforce'
    },
    {
      title: 'Total Cost',
      value: '$0.00',
      change: 'No costs yet',
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name || 'User'}! Here's your AI workforce overview.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </Button>
        </div>
      </div>

      {/* Stats */}
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
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your AI workforce automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {action.icon}
                      <div>
                        <h3 className="font-semibold text-foreground">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest AI workforce activities and updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground mb-4">Start by creating your first job or hiring an AI employee</p>
            <div className="flex space-x-2 justify-center">
              <Link to="/dashboard/workforce">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job
                </Button>
              </Link>
              <Link to="/dashboard/employees">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Hire Employee
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDashboard;
