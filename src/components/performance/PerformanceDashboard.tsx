/**
 * Performance Dashboard Component
 * Displays real-time performance metrics and optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  Clock,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { performanceService } from '@/services/performance-service';
import { monitoringService } from '@/services/monitoring-service';

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

interface PerformanceDashboardProps {
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboa  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadMetrics();
    startMonitoring();
  }, [startMonitoring]););
    startMonitoring();
  }, []);

  const loadMetrics = () => {
    const performanceMetrics = performanceService.getPerformanceMetrics();
    setMetrics(performanceMetrics as any);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Monitor performance every 5 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  const getPerformanceScore = (metric: number, thresholds: { good: number; poor: number }) => {
    if (metric <= thresholds.good) return 'good';
    if (metric <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const generateSuggestions = () => {
    const newSuggestions: string[] = [];
    
    if (metrics) {
      if (metrics.lcp > 2500) {
        newSuggestions.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS');
      }
      if (metrics.fid > 100) {
        newSuggestions.push('Reduce First Input Delay - minimize JavaScript execution time');
      }
      if (metrics.cls > 0.1) {
        newSuggestions.push('Improve Cumulative Layout Shift - add size attributes to images and ads');
      }
      if (metrics.fcp > 1800) {
        newSuggestions.push('Optimize First Contentful Paint - inline critical CSS and optimize fonts');
      }
      if (metrics.ttfb > 600) {
        newSuggestions.push('Improve Time to First Byte - optimize server response time');
      }
    }
    
    setSuggestions(newSuggestions);
  };

  useEffect(() => {
    if (metrics) {
      generateSuggestions();
    }
  }, [metrics]);

  const clearCaches = () => {
    performanceService.clearCaches();
    monitoringService.trackEvent('performance_caches_cleared');
    loadMetrics();
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Dashboard
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Monitoring' : 'Stopped'}
              </Badge>
              <Button variant="outline" size="sm" onClick={clearCaches}>
                Clear Caches
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Web Vitals */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Core Web Vitals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">LCP</span>
                  {getScoreIcon(getPerformanceScore(metrics.lcp, { good: 2500, poor: 4000 }))}
                </div>
                <div className="text-2xl font-bold">{Math.round(metrics.lcp)}ms</div>
                <Progress 
                  value={Math.min((metrics.lcp / 4000) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">Largest Contentful Paint</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FID</span>
                  {getScoreIcon(getPerformanceScore(metrics.fid, { good: 100, poor: 300 }))}
                </div>
                <div className="text-2xl font-bold">{Math.round(metrics.fid)}ms</div>
                <Progress 
                  value={Math.min((metrics.fid / 300) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">First Input Delay</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CLS</span>
                  {getScoreIcon(getPerformanceScore(metrics.cls, { good: 0.1, poor: 0.25 }))}
                </div>
                <div className="text-2xl font-bold">{metrics.cls.toFixed(3)}</div>
                <Progress 
                  value={Math.min((metrics.cls / 0.25) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">Cumulative Layout Shift</p>
              </div>
            </div>
          </div>

          {/* Loading Performance */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Loading Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.fcp)}ms</div>
                <p className="text-xs text-muted-foreground">First Contentful Paint</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.firstPaint)}ms</div>
                <p className="text-xs text-muted-foreground">First Paint</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.domContentLoaded)}ms</div>
                <p className="text-xs text-muted-foreground">DOM Content Loaded</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(metrics.loadComplete)}ms</div>
                <p className="text-xs text-muted-foreground">Load Complete</p>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Optimization Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resource Usage */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Resource Usage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">Service Worker</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">Enabled</div>
                <p className="text-xs text-muted-foreground">Image Optimization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
