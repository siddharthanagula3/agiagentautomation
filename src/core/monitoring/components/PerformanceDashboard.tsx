/**
 * Performance Dashboard Component
 * Displays real-time performance metrics and optimization suggestions
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import {
  Activity,
  Zap,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { performanceService } from '@core/monitoring/performance-service';
import { monitoringService } from '@core/monitoring/monitoring-service';

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

const DEFAULT_METRICS: PerformanceMetrics = {
  lcp: 0,
  fid: 0,
  cls: 0,
  fcp: 0,
  ttfb: 0,
  domContentLoaded: 0,
  loadComplete: 0,
  firstPaint: 0,
  firstContentfulPaint: 0,
};

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(DEFAULT_METRICS);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const sanitizeMetrics = useCallback(
    (rawMetrics: Record<string, number> | null | undefined) => {
      const nextMetrics: PerformanceMetrics = { ...DEFAULT_METRICS };

      if (!rawMetrics) {
        return nextMetrics;
      }

      Object.entries(rawMetrics).forEach(([key, value]) => {
        if (key in nextMetrics && typeof value === 'number') {
          nextMetrics[key as keyof PerformanceMetrics] = value;
        }
      });

      // Derive additional metrics when possible
      if (typeof performance !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (navigation) {
          nextMetrics.ttfb = navigation.responseStart - navigation.requestStart;
          nextMetrics.lcp = Math.max(nextMetrics.lcp, navigation.domComplete);
        }
      }

      return nextMetrics;
    },
    []
  );

  const loadMetrics = useCallback(() => {
    const performanceMetrics = performanceService.getPerformanceMetrics();
    setMetrics(sanitizeMetrics(performanceMetrics));
    setIsLoading(false);
  }, [sanitizeMetrics]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    const intervalId = window.setInterval(() => {
      loadMetrics();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [loadMetrics]);

  const suggestionBuilders = useMemo(
    () => [
      {
        condition: (current: PerformanceMetrics) => current.lcp > 2500,
        message:
          'Optimize Largest Contentful Paint - consider image optimization and critical CSS.',
      },
      {
        condition: (current: PerformanceMetrics) => current.fid > 100,
        message:
          'Reduce First Input Delay - minimize JavaScript execution time.',
      },
      {
        condition: (current: PerformanceMetrics) => current.cls > 0.1,
        message:
          'Improve Cumulative Layout Shift - add explicit size attributes to images and ads.',
      },
      {
        condition: (current: PerformanceMetrics) => current.fcp > 1800,
        message:
          'Optimize First Contentful Paint - inline critical CSS and optimize fonts.',
      },
      {
        condition: (current: PerformanceMetrics) => current.ttfb > 600,
        message:
          'Improve Time to First Byte - optimize server response time and caching.',
      },
    ],
    []
  );

  useEffect(() => {
    loadMetrics();
    const stopMonitoring = startMonitoring();
    return stopMonitoring;
  }, [loadMetrics, startMonitoring]);

  useEffect(() => {
    const nextSuggestions = suggestionBuilders
      .filter((rule) => rule.condition(metrics))
      .map((rule) => rule.message);
    setSuggestions(nextSuggestions);
  }, [metrics, suggestionBuilders]);

  const getPerformanceScore = (
    metric: number,
    thresholds: { good: number; poor: number }
  ) => {
    if (metric <= thresholds.good) return 'good';
    if (metric <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const clearCaches = () => {
    performanceService.clearCaches();
    monitoringService.trackEvent('performance_caches_cleared');
    loadMetrics();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">
              Loading performance metrics...
            </p>
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
              <Activity className="h-5 w-5" />
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
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Zap className="h-5 w-5" />
              Core Web Vitals
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">LCP</span>
                  {getScoreIcon(
                    getPerformanceScore(metrics.lcp, {
                      good: 2500,
                      poor: 4000,
                    })
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.lcp)}ms
                </div>
                <Progress
                  value={Math.min((metrics.lcp / 4000) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Largest Contentful Paint
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FID</span>
                  {getScoreIcon(
                    getPerformanceScore(metrics.fid, {
                      good: 100,
                      poor: 300,
                    })
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.fid)}ms
                </div>
                <Progress
                  value={Math.min((metrics.fid / 300) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  First Input Delay
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CLS</span>
                  {getScoreIcon(
                    getPerformanceScore(metrics.cls, {
                      good: 0.1,
                      poor: 0.25,
                    })
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {metrics.cls.toFixed(3)}
                </div>
                <Progress
                  value={Math.min((metrics.cls / 0.25) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Cumulative Layout Shift
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5" />
              Loading Performance
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(metrics.fcp)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  First Contentful Paint
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(metrics.firstPaint)}ms
                </div>
                <p className="text-xs text-muted-foreground">First Paint</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(metrics.domContentLoaded)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  DOM Content Loaded
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(metrics.loadComplete)}ms
                </div>
                <p className="text-xs text-muted-foreground">Load Complete</p>
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Optimization Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <HardDrive className="h-5 w-5" />
              Resource Usage
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">Service Worker</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-2xl font-bold">Enabled</div>
                <p className="text-xs text-muted-foreground">
                  Image Optimization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
