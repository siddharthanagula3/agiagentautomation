import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import * as Sentry from '@sentry/react';
import AppRouter from './AppRouter';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import {
  validateAndLogEnvironment,
  logEnvironmentConfig,
} from '@shared/utils/env-validation';
import './index.css';

// Initialize Sentry error monitoring
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment:
      import.meta.env.VITE_APP_ENV || (isProd ? 'production' : 'development'),
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: isProd,
        blockAllMedia: isProd,
      }),
    ],

    // Sampling rates: 100% errors, 10% transactions in prod
    sampleRate: 1.0, // 100% of errors
    tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev
    replaysSessionSampleRate: isProd ? 0.1 : 0, // 10% session replay in prod
    replaysOnErrorSampleRate: 1.0, // 100% replay on error

    // Enable debug mode in development
    debug: isDev,

    // Don't send events in development unless explicitly enabled
    enabled: isProd || import.meta.env.VITE_SENTRY_ENABLED === 'true',

    // Automatically capture unhandled promise rejections
    autoSessionTracking: true,

    // Before sending error, add context
    beforeSend(event, hint) {
      // Don't send events if user has opted out (future privacy feature)
      const optedOut = localStorage.getItem('sentry_opted_out') === 'true';
      if (optedOut) {
        return null;
      }

      // Add additional context
      if (event.exception) {
        event.tags = {
          ...event.tags,
          handled: hint.originalException instanceof Error ? 'yes' : 'no',
        };
      }

      return event;
    },

    // Configure breadcrumb logging
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors that are expected
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User aborted requests
      'AbortError',
      'The operation was aborted',
    ],

    // Deny URLs from extensions and third-party scripts
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
    ],
  });

  // Set initial user context if available
  const userId = localStorage.getItem('user_id');
  if (userId) {
    Sentry.setUser({ id: userId });
  }
}

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (SENTRY_DSN) {
    Sentry.captureException(event.reason, {
      tags: {
        type: 'unhandled_promise_rejection',
      },
      extra: {
        promise: String(event.promise),
      },
    });
  }

  // Log in development
  if (isDev) {
    console.error('Unhandled Promise Rejection:', event.reason);
  }
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  if (SENTRY_DSN && event.error) {
    Sentry.captureException(event.error, {
      tags: {
        type: 'uncaught_error',
      },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  }
});

// Validate environment variables on startup
if (import.meta.env.DEV) {
  // In development, log errors but don't throw (allow development without all keys)
  validateAndLogEnvironment(false);
  logEnvironmentConfig();
} else {
  // In production, throw error if critical variables are missing
  validateAndLogEnvironment(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const Main = () => (
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <QueryClientProvider client={queryClient}>
            <AppRouter />
            <Toaster position="top-right" richColors />
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    "Failed to find the root element. Ensure index.html has a div with id='root'."
  );
}

// Updated: Jan 15th 2026 - Removed console statements for production

try {
  const root = createRoot(rootElement);

  const renderTimeout = setTimeout(() => {
    // App initialization timeout check
  }, 10000);

  root.render(<Main />);

  clearTimeout(renderTimeout);

  setTimeout(() => {
    const loader = document.getElementById('initial-loader');
    const errorContainer = document.querySelector('.error-container');

    if (loader) {
      loader.style.display = 'none';
    }
    if (errorContainer instanceof HTMLElement) {
      errorContainer.style.display = 'none';
    }

    document.body.classList.remove('loading');
    document.body.classList.add('app-loaded');
  }, 500);

  // App rendering initiated
} catch (error) {
  // Application initialization error
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred';
  const errorName = error instanceof Error ? error.name : 'Unknown';
  const errorStack =
    error instanceof Error ? error.stack || 'No stack trace available' : '';

  // Create error display using DOM API to prevent XSS
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText =
    'padding: 20px; font-family: monospace; color: red; background: #111; min-height: 100vh;';

  const title = document.createElement('h1');
  title.textContent = 'Application Initialization Error';
  errorContainer.appendChild(title);

  const errorPara = document.createElement('p');
  errorPara.innerHTML = '<strong>Error:</strong> ';
  errorPara.appendChild(document.createTextNode(errorMessage));
  errorContainer.appendChild(errorPara);

  const typePara = document.createElement('p');
  typePara.innerHTML = '<strong>Type:</strong> ';
  typePara.appendChild(document.createTextNode(errorName));
  errorContainer.appendChild(typePara);

  const stackLabel = document.createElement('p');
  stackLabel.innerHTML = '<strong>Stack:</strong>';
  errorContainer.appendChild(stackLabel);

  const stackPre = document.createElement('pre');
  stackPre.style.cssText =
    'background: #222; padding: 10px; border-radius: 4px; overflow: auto;';
  stackPre.textContent = errorStack;
  errorContainer.appendChild(stackPre);

  const helpPara = document.createElement('p');
  helpPara.textContent = 'Please check the console for more details.';
  errorContainer.appendChild(helpPara);

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload Page';
  reloadButton.style.cssText =
    'background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;';
  reloadButton.addEventListener('click', () => window.location.reload());
  errorContainer.appendChild(reloadButton);

  rootElement.appendChild(errorContainer);
}
