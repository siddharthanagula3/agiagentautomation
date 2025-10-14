/**
 * Chat Error Boundary Component
 * Catches and handles errors in chat components gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Button } from '@shared/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Chat Error</p>
                <p className="text-sm text-muted-foreground">
                  Something went wrong with the chat interface. This might be a
                  temporary issue.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer">Error Details</summary>
                    <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
