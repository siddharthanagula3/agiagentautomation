import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { Button } from '@shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Use compact mode for inline components that shouldn't show full-page error */
  compact?: boolean;
  /** Custom component name for error tracking */
  componentName?: string;
  /** Enable Sentry user feedback dialog */
  showReportDialog?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown';
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Capture error with Sentry
    const eventId = Sentry.captureException(error, {
      tags: {
        errorBoundary: 'true',
        componentName,
      },
      extra: {
        componentStack: errorInfo.componentStack,
        errorId,
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Add breadcrumb for error context
    Sentry.addBreadcrumb({
      category: 'error-boundary',
      message: `Error caught in ${componentName}`,
      level: 'error',
      data: {
        errorName: error.name,
        errorMessage: error.message,
        errorId,
      },
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId,
      eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(
        `ErrorBoundary caught an error in ${componentName}:`,
        error,
        errorInfo
      );
    }
  }

  handleRetry = () => {
    // Add breadcrumb for retry action
    Sentry.addBreadcrumb({
      category: 'ui.click',
      message: 'User clicked retry after error',
      level: 'info',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      eventId: null,
    });
  };

  handleReload = () => {
    Sentry.addBreadcrumb({
      category: 'ui.click',
      message: 'User clicked reload after error',
      level: 'info',
    });
    window.location.reload();
  };

  handleGoHome = () => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: 'User navigated home after error',
      level: 'info',
    });
    window.location.href = '/';
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        title: 'It looks like we had a problem.',
        subtitle:
          "Our team has been notified. If you'd like to help, tell us what happened below.",
        subtitle2: '',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Send Report',
        successMessage: 'Thank you for your feedback!',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Compact error UI for inline components
      if (this.props.compact) {
        return (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mb-2 h-6 w-6 text-destructive" />
            <p className="mb-2 text-sm text-destructive">
              {this.props.componentName
                ? `${this.props.componentName} failed to load`
                : 'Something went wrong'}
            </p>
            <Button
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        );
      }

      // Default full-page error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has
                been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Error ID:{' '}
                    <code className="font-mono">{this.state.errorId}</code>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please include this ID when contacting support.
                  </p>
                </div>
              )}

              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="rounded-lg bg-destructive/10 p-4">
                  <h4 className="mb-2 font-semibold text-destructive">
                    Error Details (Development)
                  </h4>
                  <pre className="overflow-auto text-xs text-destructive">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Component Stack
                      </summary>
                      <pre className="mt-1 overflow-auto text-xs text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                {this.state.eventId &&
                  this.props.showReportDialog !== false && (
                    <Button
                      onClick={this.handleReportFeedback}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Report Feedback
                    </Button>
                  )}
              </div>

              {/* Support information */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please{' '}
                  <a
                    href="/contact-sales"
                    className="text-primary hover:underline"
                  >
                    contact our support team
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export { ErrorBoundary };
