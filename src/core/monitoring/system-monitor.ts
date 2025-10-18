import * as Sentry from '@sentry/react';

// Performance monitoring interface
interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

// Error tracking interface
interface ErrorContext {
  userId?: string;
  userEmail?: string;
  sessionId: string;
  url: string;
  timestamp: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

class MonitoringService {
  private isInitialized = false;
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize monitoring service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Sentry for error tracking
      Sentry.init({
        dsn:
          typeof import.meta !== 'undefined'
            ? (import.meta as { env?: { VITE_SENTRY_DSN?: string } }).env
                ?.VITE_SENTRY_DSN
            : undefined,
        environment:
          typeof import.meta !== 'undefined'
            ? (import.meta as { env?: { MODE?: string } }).env?.MODE ||
              'development'
            : 'development',
        integrations: [
          // BrowserTracing is now included in @sentry/react by default
        ],
        // Performance Monitoring
        tracesSampleRate:
          typeof import.meta !== 'undefined'
            ? (import.meta as { env?: { MODE?: string } }).env?.MODE ===
              'production'
              ? 0.1
              : 1.0
            : 1.0,
        // Session Replay
        replaysSessionSampleRate:
          typeof import.meta !== 'undefined'
            ? (import.meta as { env?: { MODE?: string } }).env?.MODE ===
              'production'
              ? 0.1
              : 0.5
            : 0.5,
        replaysOnErrorSampleRate: 1.0,
        // Release tracking
        release:
          typeof import.meta !== 'undefined'
            ? (import.meta as { env?: { VITE_APP_VERSION?: string } }).env
                ?.VITE_APP_VERSION || '1.0.0'
            : '1.0.0',
        // User context
        beforeSend(event) {
          // Filter out non-critical errors in production
          if (
            typeof import.meta !== 'undefined' &&
            (import.meta as { env?: { MODE?: string } }).env?.MODE ===
              'production'
          ) {
            // Don't send network errors for external resources
            if (event.exception) {
              const error = event.exception.values?.[0];
              if (
                error?.type === 'NetworkError' &&
                error.value?.includes('net::ERR_')
              ) {
                return null;
              }
            }
          }
          return event;
        },
      });

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Set up error boundary
      this.setupErrorBoundary();

      this.isInitialized = true;
      console.log('✅ Monitoring service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring service:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(user: { id: string; email: string; name?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    Sentry.setUser(null);
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      message: eventName,
      category: 'custom',
      data: properties,
      level: 'info',
    });

    // Also send as custom event
    Sentry.captureMessage(eventName, {
      level: 'info',
      tags: {
        event_type: 'custom',
      },
      extra: properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    Sentry.addBreadcrumb({
      message: 'Performance metrics',
      category: 'performance',
      data: metrics,
      level: 'info',
    });

    // Send performance data to Sentry
    Sentry.captureMessage('Performance metrics', {
      level: 'info',
      tags: {
        event_type: 'performance',
      },
      extra: metrics,
    });
  }

  /**
   * Track API calls
   */
  trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    Sentry.addBreadcrumb({
      message: `API ${method} ${endpoint}`,
      category: 'http',
      data: {
        method,
        url: endpoint,
        status_code: statusCode,
        duration,
      },
      level: statusCode >= 400 ? 'error' : 'info',
    });
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(
    action: string,
    target: string,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('user_interaction', {
      action,
      target,
      ...properties,
    });
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    properties?: Record<string, unknown>
  ): void {
    this.trackEvent('business_metric', {
      metric,
      value,
      ...properties,
    });
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.trackPerformance({
                largestContentfulPaint: entry.startTime,
              });
            }
          }
        });
        this.performanceObserver.observe({
          entryTypes: ['largest-contentful-paint'],
        });

        // First Input Delay
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const firstInput = entry as PerformanceEventTiming;
              this.trackPerformance({
                firstInputDelay:
                  ((
                    firstInput as PerformanceEventTiming & {
                      processingStart?: number;
                    }
                  ).processingStart as number) - firstInput.startTime,
              });
            }
          }
        });
        this.performanceObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        this.performanceObserver = new PerformanceObserver((list) => {
          let cumulativeScore = 0;
          for (const entry of list.getEntries()) {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as PerformanceEntry & { hadRecentInput?: boolean })
                .hadRecentInput
            ) {
              cumulativeScore += (
                entry as PerformanceEntry & { value?: number }
              ).value as number;
            }
          }
          if (cumulativeScore > 0) {
            this.trackPerformance({
              cumulativeLayoutShift: cumulativeScore,
            });
          }
        });
        this.performanceObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance({
            pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
            timeToInteractive:
              navigation.domInteractive - navigation.fetchStart,
          });
        }
      }, 0);
    });
  }

  /**
   * Set up error boundary
   */
  private setupErrorBoundary(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_promise_rejection',
      });
    });
  }

  /**
   * Capture error with context
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    const errorContext: ErrorContext = {
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    Sentry.withScope((scope) => {
      scope.setContext('error_context', errorContext);
      if (context) {
        scope.setContext('additional_context', context);
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    await Sentry.flush(2000);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export Sentry components for React integration
export { Sentry };
