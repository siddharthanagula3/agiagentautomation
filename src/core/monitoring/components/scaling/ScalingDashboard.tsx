/**
 * Scaling Dashboard Component
 * Provides interface for monitoring and managing scaling operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { Switch } from '@shared/ui/switch';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@shared/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Database,
  Globe,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { scalingService } from '@core/monitoring/scaling-service';
import { monitoringService } from '@core/monitoring/monitoring-service';
import { toast } from 'sonner';

interface LoadMetrics {
  activeConnections: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface ScalingDashboardProps {
  className?: string;
}

const ScalingDashboard: React.FC<ScalingDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<LoadMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadScalingData();
    const interval = setInterval(loadScalingData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadScalingData = () => {
    try {
      const loadMetrics = scalingService.getLoadMetrics();
      const cacheStatistics = scalingService.getCacheStats();
      const scalingConfig = scalingService.getConfig();
      const scalingRecommendations = scalingService.getScalingRecommendations();

      setMetrics(loadMetrics);
      setCacheStats(cacheStatistics);
      setConfig(scalingConfig);
      setRecommendations(scalingRecommendations);
    } catch (error) {
      console.error('Error loading scaling data:', error);
    }
  };

  const handleOptimizeDatabase = async () => {
    setIsLoading(true);
    try {
      await scalingService.optimizeDatabaseQueries();
      toast.success('Database optimization completed');
      loadScalingData();
    } catch (error) {
      console.error('Error optimizing database:', error);
      toast.error('Failed to optimize database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    scalingService.clearCache();
    toast.success('Cache cleared successfully');
    loadScalingData();
  };

  const handleAutoScale = () => {
    scalingService.autoScale();
    toast.success('Auto-scaling triggered');
    loadScalingData();
  };

  const handleConfigUpdate = (key: string, value: any) => {
    scalingService.updateConfig({ [key]: value });
    toast.success('Configuration updated');
    loadScalingData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value <= thresholds.warning) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  if (!metrics || !cacheStats || !config) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Scaling Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading scaling metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Load Metrics Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Load Metrics
            </div>
            <Button variant="outline" size="sm" onClick={loadScalingData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Connections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Connections</span>
                {getStatusIcon(metrics.activeConnections, { good: 50, warning: 80 })}
              </div>
              <div className="text-2xl font-bold">{metrics.activeConnections}</div>
              <Progress 
                value={(metrics.activeConnections / config.maxConcurrentRequests) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Max: {config.maxConcurrentRequests}
              </p>
            </div>

            {/* Requests Per Second */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requests/Second</span>
                {getStatusIcon(metrics.requestsPerSecond, { good: 50, warning: 100 })}
              </div>
              <div className="text-2xl font-bold">{metrics.requestsPerSecond.toFixed(1)}</div>
              <Progress 
                value={Math.min((metrics.requestsPerSecond / 100) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Current load</p>
            </div>

            {/* Average Response Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                {getStatusIcon(metrics.averageResponseTime, { good: 200, warning: 500 })}
              </div>
              <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
              <Progress 
                value={Math.min((metrics.averageResponseTime / 1000) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Response time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Error Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                {getStatusIcon(metrics.errorRate * 100, { good: 1, warning: 5 })}
              </div>
              <div className="text-2xl font-bold">{formatPercentage(metrics.errorRate)}</div>
              <Progress 
                value={metrics.errorRate * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Error percentage</p>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{formatBytes(metrics.memoryUsage)}</div>
              <Progress 
                value={Math.min((metrics.memoryUsage / (1024 * 1024 * 100)) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">JavaScript heap</p>
            </div>

            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                {getStatusIcon(metrics.cpuUsage, { good: 50, warning: 80 })}
              </div>
              <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
              <Progress 
                value={metrics.cpuUsage} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">CPU utilization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats.size}</div>
              <p className="text-sm text-muted-foreground">Cache Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPercentage(cacheStats.hitRate)}</div>
              <p className="text-sm text-muted-foreground">Hit Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats.totalHits}</div>
              <p className="text-sm text-muted-foreground">Total Hits</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats.totalMisses}</div>
              <p className="text-sm text-muted-foreground">Total Misses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scaling Recommendations */}
      {recommendations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Scaling Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <Alert key={index} variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scaling Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scaling Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleOptimizeDatabase}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Optimize Database
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Clear Cache
            </Button>
            <Button
              onClick={handleAutoScale}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Auto Scale
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Scaling Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="load-balancing">Load Balancing</Label>
              <Switch
                id="load-balancing"
                checked={config.enableLoadBalancing}
                onCheckedChange={(checked) => handleConfigUpdate('enableLoadBalancing', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="caching">Caching</Label>
              <Switch
                id="caching"
                checked={config.enableCaching}
                onCheckedChange={(checked) => handleConfigUpdate('enableCaching', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cdn">CDN</Label>
              <Switch
                id="cdn"
                checked={config.enableCDN}
                onCheckedChange={(checked) => handleConfigUpdate('enableCDN', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="database-optimization">Database Optimization</Label>
              <Switch
                id="database-optimization"
                checked={config.enableDatabaseOptimization}
                onCheckedChange={(checked) => handleConfigUpdate('enableDatabaseOptimization', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="resource-pooling">Resource Pooling</Label>
              <Switch
                id="resource-pooling"
                checked={config.enableResourcePooling}
                onCheckedChange={(checked) => handleConfigUpdate('enableResourcePooling', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-concurrent-requests">Max Concurrent Requests</Label>
              <Select
                value={config.maxConcurrentRequests.toString()}
                onValueChange={(value) => handleConfigUpdate('maxConcurrentRequests', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cache-strategy">Cache Strategy</Label>
              <Select
                value={config.cacheStrategy}
                onValueChange={(value) => handleConfigUpdate('cacheStrategy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdn-provider">CDN Provider</Label>
              <Select
                value={config.cdnProvider}
                onValueChange={(value) => handleConfigUpdate('cdnProvider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloudflare">Cloudflare</SelectItem>
                  <SelectItem value="aws">AWS CloudFront</SelectItem>
                  <SelectItem value="gcp">Google Cloud CDN</SelectItem>
                  <SelectItem value="azure">Azure CDN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScalingDashboard;
