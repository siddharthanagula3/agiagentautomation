import { useEffect, useRef, useCallback } from 'react';
import { monitoringService } from '@core/monitoring/monitoring-service';

interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
}

/**
 * Hook for monitoring component performance
 */
export const usePerformanceMonitoring = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    componentName,
    mountTime: 0,
    renderCount: 0,
    lastRenderTime: 0,
  });

  const startTimeRef = useRef<number>(0);

  // Track component mount
  useEffect(() => {
    metricsRef.current.mountTime = performance.now();
    startTimeRef.current = performance.now();

    // Track component mount
    monitoringService.trackEvent('component_mount', {
      component: componentName,
      timestamp: Date.now(),
    });

    return () => {
      // Track component unmount
      const currentMetrics = metricsRef.current;
      const mountDuration = performance.now() - currentMetrics.mountTime;
      monitoringService.trackEvent('component_unmount', {
        component: componentName,
        mountDuration,
        renderCount: currentMetrics.renderCount,
      });
    };
  }, [componentName]);

  // Track render performance
  useEffect(() => {
    metricsRef.current.renderCount += 1;
    metricsRef.current.lastRenderTime = performance.now();

    // Track slow renders (> 16ms for 60fps)
    const renderTime = performance.now() - startTimeRef.current;
    if (renderTime > 16) {
      monitoringService.trackEvent('slow_render', {
        component: componentName,
        renderTime,
        renderCount: metricsRef.current.renderCount,
      });
    }

    startTimeRef.current = performance.now();
  });

  // Track user interactions
  const trackInteraction = useCallback(
    (action: string, target?: string, properties?: Record<string, unknown>) => {
      monitoringService.trackUserInteraction(action, target || componentName, {
        component: componentName,
        ...properties,
      });
    },
    [componentName]
  );

  // Track API calls
  const trackApiCall = useCallback(
    (
      endpoint: string,
      method: string,
      statusCode: number,
      duration: number
    ) => {
      monitoringService.trackApiCall(endpoint, method, statusCode, duration);
    },
    []
  );

  // Track business metrics
  const trackBusinessMetric = useCallback(
    (metric: string, value: number, properties?: Record<string, unknown>) => {
      monitoringService.trackBusinessMetric(metric, value, {
        component: componentName,
        ...properties,
      });
    },
    [componentName]
  );

  return {
    trackInteraction,
    trackApiCall,
    trackBusinessMetric,
    metrics: metricsRef.current,
  };
};

/**
 * Hook for monitoring page performance
 */
export const usePagePerformanceMonitoring = () => {
  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: 0,
          firstContentfulPaint: 0,
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        monitoringService.trackPerformance(metrics);
      }
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
      return () => window.removeEventListener('load', trackPageLoad);
    }
  }, []);

  // Track route changes
  useEffect(() => {
    const trackRouteChange = () => {
      monitoringService.trackEvent('route_change', {
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        timestamp: Date.now(),
      });
    };

    // Track initial route
    trackRouteChange();

    // Track subsequent route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(trackRouteChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(trackRouteChange, 0);
    };

    window.addEventListener('popstate', trackRouteChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', trackRouteChange);
    };
  }, []);
};

/**
 * Hook for monitoring API performance
 */
export const useApiPerformanceMonitoring = () => {
  const trackApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      endpoint: string,
      method: string = 'GET'
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;

        monitoringService.trackApiCall(endpoint, method, 200, duration);

        return result;
      } catch (error: unknown) {
        const duration = performance.now() - startTime;
        const statusCode =
          (error as { status?: number; statusCode?: number })?.status ||
          (error as { status?: number; statusCode?: number })?.statusCode ||
          500;

        monitoringService.trackApiCall(endpoint, method, statusCode, duration);

        // Track API errors
        if (error instanceof Error) {
          monitoringService.captureError(error, {
            type: 'api_error',
            endpoint,
            method,
            statusCode,
            duration,
          });
        }

        throw error;
      }
    },
    []
  );

  return { trackApiCall };
};
