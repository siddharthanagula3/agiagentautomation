import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Globe,
  Users,
  Bot,
  Zap,
  BarChart3,
  Eye,
  RefreshCw,
  Settings,
  Filter,
  Search,
  Bell,
  Loader2,
  Info,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-hooks';
import { toast } from '../../hooks/use-toast';

interface SystemMetric {
  id: string;
  name: string;
  category: 'performance' | 'resource' | 'network' | 'application' | 'security';
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // percentage change
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
  history: MetricHistory[];
}

interface MetricHistory {
  timestamp: string;
  value: number;
}

interface ServiceHealth {
  id: string;
  name: string;
  type: 'api' | 'database' | 'worker' | 'cache' | 'queue';
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: number; // percentage
  responseTime: number; // ms
  errorRate: number; // percentage
  lastCheck: string;
  incidents: number;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  service: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  useEffect(() => {
  useEffect(() => {
const MonitoringPage: React.FC = () => {
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
  

    if (user) {
      loadMonitoringData();
    }
  }, [user]);

    if (autoRefresh && user) {
      const interval = setInterval(() => {
        loadMonitoringData(true); // silent refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, user]);

  const loadMonitoringData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      // Simulate loading delay
      
      
      // TODO: Replace with real Supabase data fetching
      // For now, show empty state
      setData([]);
      setServices(mockServices);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      if (!silent) setError('Failed to load monitoring data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generateMetricHistory = (currentValue: number, hours: number): MetricHistory[] => {
    const history: MetricHistory[] = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3600000).toISOString();
      const variation = (Math.random() - 0.5) * 20;
      const value = Math.max(0, currentValue + variation);
      history.push({ timestamp, value });
    }
    
    return history;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'critical':
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'error':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'resource':
        return <Cpu className="h-4 w-4 text-blue-500" />;
      case 'network':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'application':
        return <Bot className="h-4 w-4 text-purple-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive",
      });
    }
  };

  const systemOverview = {
    healthy: metrics.filter(m => m.status === 'healthy').length + services.filter(s => s.status === 'operational').length,
    warning: metrics.filter(m => m.status === 'warning').length + services.filter(s => s.status === 'degraded').length,
    critical: metrics.filter(m => m.status === 'critical').length + services.filter(s => s.status === 'down').length,
    totalAlerts: alerts.filter(a => !a.acknowledged).length,
    avgResponseTime: services.reduce((sum, s) => sum + s.responseTime, 0) / services.length,
    avgUptime: services.reduce((sum, s) => sum + s.uptime, 0) / services.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button variant="outline" onClick={() => loadMonitoringData()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system health, performance, and AI workforce activity in real-time.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" onClick={() => loadMonitoringData()}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy Systems</p>
                <p className="text-2xl font-bold text-green-600">{systemOverview.healthy}</p>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{systemOverview.warning}</p>
                <p className="text-sm text-muted-foreground">Needs attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{systemOverview.totalAlerts}</p>
                <p className="text-sm text-muted-foreground">Unacknowledged</p>
              </div>
              <Bell className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold text-blue-600">{systemOverview.avgUptime.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Average across all services</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Recent system alerts and notifications</CardDescription>
            </div>
            <Badge variant="destructive">
              {alerts.filter(a => !a.acknowledged).length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 border border-border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.acknowledged && (
                        <Badge variant="outline" className="text-xs">
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Service: {alert.service}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>Real-time status of system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {service.type === 'api' && <Globe className="h-4 w-4 text-blue-500" />}
                    {service.type === 'database' && <Database className="h-4 w-4 text-green-500" />}
                    {service.type === 'worker' && <Bot className="h-4 w-4 text-purple-500" />}
                    {service.type === 'cache' && <HardDrive className="h-4 w-4 text-orange-500" />}
                    {service.type === 'queue' && <Server className="h-4 w-4 text-gray-500" />}
                    <h4 className="font-medium text-foreground">{service.name}</h4>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-medium">{service.uptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-medium">{service.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{service.errorRate}%</span>
                  </div>
                  {service.incidents > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Incidents</span>
                      <span className="font-medium">{service.incidents}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Last check: {formatTimeAgo(service.lastCheck)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Key performance indicators and resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(metric.category)}
                    <h4 className="font-medium text-foreground">{metric.name}</h4>
                  </div>
                  {getStatusIcon(metric.status)}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {metric.trend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                    <span className="text-sm text-muted-foreground">
                      {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(metric.value / metric.threshold.critical) * 100} 
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                  <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Updated: {formatTimeAgo(metric.lastUpdated)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;
