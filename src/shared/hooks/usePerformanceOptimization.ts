/**
 * Performance Optimization Hooks
 * Provides React hooks for performance optimizations
 */

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { performanceService } from '@core/monitoring/performance-monitor';
import { monitoringService } from '@core/monitoring/system-monitor';

/**
 * Hook for optimizing component performance
 */
export const usePerformanceOptimization = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = performance.now();
    renderCount.current = 0;

    monitoringService.trackEvent('component_mount', {
      component: componentName,
      timestamp: mountTime.current,
    });

    return () => {
      const mountDuration = performance.now() - mountTime.current;
      monitoringService.trackEvent('component_unmount', {
        component: componentName,
        mountDuration,
        renderCount: renderCount.current,
      });
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current += 1;
  });

  const trackRender = useCallback(() => {
    monitoringService.trackEvent('component_render', {
      component: componentName,
      renderCount: renderCount.current,
    });
  }, [componentName]);

  // Return a function to get render count instead of accessing ref during render
  const getRenderCount = useCallback(() => renderCount.current, []);

  return { trackRender, getRenderCount };
};

/**
 * Hook for debouncing expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling expensive operations
 * Uses useRef to store callback for stable reference
 */
export const useThrottle = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(0);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date without causing re-renders
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useCallback(
    (...args: unknown[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callbackRef.current(...args);
        lastRun.current = Date.now();
      }
    },
    [delay]
  );

  return throttledFn as T;
};

/**
 * Hook for memoizing expensive calculations
 * Uses useRef to store factory for stable reference while respecting deps
 *
 * Note: This hook wraps useMemo with performance tracking. The deps are passed
 * dynamically which requires disabling the exhaustive-deps rule.
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const factoryRef = useRef(factory);
  const depsLength = deps.length;

  // Keep factory ref up to date via useEffect to avoid ref access during render
  useEffect(() => {
    factoryRef.current = factory;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const startTime = performance.now();
    const result = factoryRef.current();
    const endTime = performance.now();

    monitoringService.trackPerformance(
      'memoized_calculation',
      endTime - startTime,
      {
        deps: depsLength,
      }
    );

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * Hook for lazy loading components
 * Fixed: Added isMounted flag to prevent setState after unmount
 */
export const useLazyComponent = <T extends React.ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const startTime = performance.now();

    importFunc()
      .then((module) => {
        if (!isMountedRef.current) return; // Prevent setState after unmount
        const endTime = performance.now();
        setComponent(() => module.default);
        setLoading(false);

        monitoringService.trackPerformance(
          'lazy_component_load',
          endTime - startTime,
          {
            component: module.default.name || 'Unknown',
          }
        );
      })
      .catch((err) => {
        if (!isMountedRef.current) return; // Prevent setState after unmount
        setError(err);
        setLoading(false);
        monitoringService.captureError(err, {
          context: 'lazy_component_loading',
        });
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [importFunc]);

  if (loading) {
    return fallback ? fallback : null;
  }

  if (error) {
    throw error;
  }

  return Component;
};

/**
 * Hook for optimizing list rendering
 */
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    containerRef,
  };
};

/**
 * Hook for optimizing image loading
 * Fixed: Added isMounted flag to prevent setState after unmount
 */
export const useOptimizedImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    lazy?: boolean;
  } = {}
) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const isMountedRef = useRef(true);

  // Memoize options to prevent unnecessary re-renders
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    isMountedRef.current = true;
    const startTime = performance.now();

    const optimized = performanceService.optimizeImage(src, '', options);
    setOptimizedSrc(optimized);

    const img = new Image();
    img.onload = () => {
      if (!isMountedRef.current) return; // Prevent setState after unmount
      const endTime = performance.now();
      setLoaded(true);

      monitoringService.trackPerformance(
        'image_optimization',
        endTime - startTime,
        {
          originalSrc: src,
          optimizedSrc: optimized,
          width: options.width,
          height: options.height,
        }
      );
    };

    img.onerror = () => {
      if (!isMountedRef.current) return; // Prevent setState after unmount
      setError(true);
      monitoringService.captureError(
        new Error(`Failed to load optimized image: ${optimized}`),
        { originalSrc: src, optimizedSrc: optimized }
      );
    };

    img.src = optimized;

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, optionsKey]);

  return { optimizedSrc, loaded, error };
};

/**
 * Hook for preloading resources
 */
export const useResourcePreloader = () => {
  const preloadedResources = useRef(new Set<string>());

  const preloadResource = useCallback(
    (
      href: string,
      as: 'script' | 'style' | 'image' | 'font' | 'fetch',
      options: {
        crossorigin?: 'anonymous' | 'use-credentials';
        type?: string;
      } = {}
    ) => {
      if (preloadedResources.current.has(href)) {
        return;
      }

      performanceService.preloadResource({ href, as, ...options });
      preloadedResources.current.add(href);
    },
    []
  );

  const preloadImage = useCallback((src: string, sizes?: string) => {
    if (preloadedResources.current.has(src)) {
      return;
    }

    performanceService.preloadImage(src, sizes);
    preloadedResources.current.add(src);
  }, []);

  return { preloadResource, preloadImage };
};

/**
 * Hook for monitoring component performance
 */
export const useComponentPerformance = (componentName: string) => {
  const { trackRender } = usePerformanceOptimization(componentName);
  const renderStartTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    if (renderTime > 16) {
      // Log slow renders (> 16ms)
      monitoringService.trackPerformance('slow_render', renderTime, {
        component: componentName,
      });
    }

    trackRender();
  });

  return { trackRender };
};
