import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@core/monitoring/analytics-tracker';

/**
 * Hook for analytics tracking
 */
export const useAnalytics = () => {
  const location = useLocation();

  // Initialize analytics on mount
  useEffect(() => {
    analyticsService.initialize();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    analyticsService.trackPageView(
      location.pathname + location.search,
      document.title
    );
  }, [location]);

  // Track user engagement
  const trackEngagement = useCallback(
    (action: string, target: string, properties?: Record<string, unknown>) => {
      analyticsService.trackEngagement(action, target, properties);
    },
    []
  );

  // Track conversions
  const trackConversion = useCallback(
    (
      conversionType: string,
      value?: number,
      properties?: Record<string, unknown>
    ) => {
      analyticsService.trackConversion(conversionType, value, properties);
    },
    []
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (feature: string, action: string, properties?: Record<string, unknown>) => {
      analyticsService.trackFeatureUsage(feature, action, properties);
    },
    []
  );

  // Track user journey
  const trackUserJourney = useCallback(
    (step: string, properties?: Record<string, unknown>) => {
      analyticsService.trackUserJourney(step, properties);
    },
    []
  );

  // Track A/B tests
  const trackABTest = useCallback(
    (
      testName: string,
      variant: string,
      properties?: Record<string, unknown>
    ) => {
      analyticsService.trackABTest(testName, variant, properties);
    },
    []
  );

  // Track custom events
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      analyticsService.trackEvent(event, properties);
    },
    []
  );

  // Track errors
  const trackError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      analyticsService.trackError(error, context);
    },
    []
  );

  // Track performance
  const trackPerformance = useCallback(
    (metric: string, value: number, properties?: Record<string, unknown>) => {
      analyticsService.trackPerformance(metric, value, properties);
    },
    []
  );

  return {
    trackEngagement,
    trackConversion,
    trackFeatureUsage,
    trackUserJourney,
    trackABTest,
    trackEvent,
    trackError,
    trackPerformance,
  };
};

/**
 * Hook for tracking specific user interactions
 */
export const useInteractionTracking = () => {
  const { trackEngagement } = useAnalytics();

  // Track button clicks
  const trackButtonClick = useCallback(
    (buttonName: string, properties?: Record<string, unknown>) => {
      trackEngagement('click', `button_${buttonName}`, properties);
    },
    [trackEngagement]
  );

  // Track form submissions
  const trackFormSubmission = useCallback(
    (
      formName: string,
      success: boolean,
      properties?: Record<string, unknown>
    ) => {
      trackEngagement('submit', `form_${formName}`, {
        success,
        ...properties,
      });
    },
    [trackEngagement]
  );

  // Track link clicks
  const trackLinkClick = useCallback(
    (linkText: string, href: string, properties?: Record<string, unknown>) => {
      trackEngagement('click', 'link', {
        linkText,
        href,
        ...properties,
      });
    },
    [trackEngagement]
  );

  // Track search queries
  const trackSearch = useCallback(
    (
      query: string,
      resultsCount?: number,
      properties?: Record<string, unknown>
    ) => {
      trackEngagement('search', 'search_query', {
        query,
        resultsCount,
        ...properties,
      });
    },
    [trackEngagement]
  );

  // Track downloads
  const trackDownload = useCallback(
    (
      fileName: string,
      fileType: string,
      properties?: Record<string, unknown>
    ) => {
      trackEngagement('download', 'file', {
        fileName,
        fileType,
        ...properties,
      });
    },
    [trackEngagement]
  );

  return {
    trackButtonClick,
    trackFormSubmission,
    trackLinkClick,
    trackSearch,
    trackDownload,
  };
};

/**
 * Hook for tracking business metrics
 */
export const useBusinessMetrics = () => {
  const { trackConversion, trackFeatureUsage } = useAnalytics();

  // Track subscription events
  const trackSubscription = useCallback(
    (
      plan: string,
      action: 'started' | 'completed' | 'cancelled',
      properties?: Record<string, unknown>
    ) => {
      trackConversion('subscription', undefined, {
        plan,
        action,
        ...properties,
      });
    },
    [trackConversion]
  );

  // Track AI employee hiring
  const trackEmployeeHire = useCallback(
    (
      employeeId: string,
      employeeName: string,
      properties?: Record<string, unknown>
    ) => {
      trackConversion('employee_hire', undefined, {
        employeeId,
        employeeName,
        ...properties,
      });
    },
    [trackConversion]
  );

  // Track chat sessions
  const trackChatSession = useCallback(
    (
      sessionId: string,
      messageCount: number,
      duration: number,
      properties?: Record<string, unknown>
    ) => {
      trackFeatureUsage('chat', 'session_completed', {
        sessionId,
        messageCount,
        duration,
        ...properties,
      });
    },
    [trackFeatureUsage]
  );

  // Track marketplace views
  const trackMarketplaceView = useCallback(
    (
      employeeId?: string,
      category?: string,
      properties?: Record<string, unknown>
    ) => {
      trackFeatureUsage('marketplace', 'view', {
        employeeId,
        category,
        ...properties,
      });
    },
    [trackFeatureUsage]
  );

  return {
    trackSubscription,
    trackEmployeeHire,
    trackChatSession,
    trackMarketplaceView,
  };
};
