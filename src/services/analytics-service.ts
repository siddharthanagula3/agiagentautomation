import { monitoringService } from './monitoring-service';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

class AnalyticsService {
  private isInitialized = false;
  private sessionStartTime: number;
  private pageViews: PageView[] = [];
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionStartTime = Date.now();
  }

  /**
   * Initialize analytics service
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Track session start
    this.trackEvent('session_start', {
      timestamp: this.sessionStartTime,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          sessionDuration: Date.now() - this.sessionStartTime,
        });
      } else {
        this.trackEvent('page_visible', {
          sessionDuration: Date.now() - this.sessionStartTime,
        });
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        sessionDuration: Date.now() - this.sessionStartTime,
        pageViews: this.pageViews.length,
        events: this.events.length,
      });
    });

    this.isInitialized = true;
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title: string, referrer?: string): void {
    const pageView: PageView = {
      path,
      title,
      referrer: referrer || document.referrer,
      timestamp: Date.now(),
    };

    this.pageViews.push(pageView);

    // Track with monitoring service
    monitoringService.trackEvent('page_view', {
      path: pageView.path,
      title: pageView.title,
      referrer: pageView.referrer,
      timestamp: pageView.timestamp,
    });

    // Track business metric
    monitoringService.trackBusinessMetric('page_views', 1, {
      path: pageView.path,
      title: pageView.title,
    });
  }

  /**
   * Track custom event
   */
  trackEvent(event: string, properties?: Record<string, unknown>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Track with monitoring service
    monitoringService.trackEvent(`analytics_${event}`, properties);
  }

  /**
   * Track user engagement
   */
  trackEngagement(
    action: string,
    target: string,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('user_engagement', {
      action,
      target,
      ...properties,
    });

    // Track business metric
    monitoringService.trackBusinessMetric('user_engagements', 1, {
      action,
      target,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(
    conversionType: string,
    value?: number,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('conversion', {
      conversionType,
      value,
      ...properties,
    });

    // Track business metric
    monitoringService.trackBusinessMetric('conversions', 1, {
      conversionType,
      value,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: string,
    action: string,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('feature_usage', {
      feature,
      action,
      ...properties,
    });

    // Track business metric
    monitoringService.trackBusinessMetric('feature_usage', 1, {
      feature,
      action,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });

    // Also capture with monitoring service
    monitoringService.captureError(error, context);
  }

  /**
   * Track performance
   */
  trackPerformance(
    metric: string,
    value: number,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });

    // Track business metric
    monitoringService.trackBusinessMetric('performance_metrics', value, {
      metric,
      ...properties,
    });
  }

  /**
   * Get session data
   */
  getSessionData() {
    return {
      sessionStartTime: this.sessionStartTime,
      sessionDuration: Date.now() - this.sessionStartTime,
      pageViews: this.pageViews,
      events: this.events,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Track user journey
   */
  trackUserJourney(step: string, properties?: Record<string, unknown>): void {
    this.trackEvent('user_journey', {
      step,
      stepNumber:
        this.events.filter(e => e.event === 'user_journey').length + 1,
      ...properties,
    });
  }

  /**
   * Track A/B test
   */
  trackABTest(
    testName: string,
    variant: string,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('ab_test', {
      testName,
      variant,
      ...properties,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
