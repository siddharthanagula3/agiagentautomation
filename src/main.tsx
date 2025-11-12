import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import AppRouter from './AppRouter';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { validateAndLogEnvironment, logEnvironmentConfig } from '@shared/utils/env-validation';
import './index.css';

// Validate environment variables on startup
if (import.meta.env.DEV) {
  // In development, log errors but don't throw (allow development without all keys)
  validateAndLogEnvironment(false);
  logEnvironmentConfig();
  void import('@shared/utils/test-supabase');
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

if (import.meta.env.DEV) {
  console.log('Starting AGI Agent Automation app...');
  console.log('Environment:', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
    demoMode: import.meta.env.VITE_DEMO_MODE,
  });
}

try {
  const root = createRoot(rootElement);

  const renderTimeout = setTimeout(() => {
    console.warn('App initialization is taking longer than expected');
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

  if (import.meta.env.DEV) {
    console.log('App rendering initiated');
  }
} catch (error) {
  console.error('Failed to initialize application:', error);
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred';
  const errorName = error instanceof Error ? error.name : 'Unknown';
  const errorStack =
    error instanceof Error ? error.stack || 'No stack trace available' : '';

  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red; background: #111; min-height: 100vh;">
      <h1>Application Initialization Error</h1>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p><strong>Type:</strong> ${errorName}</p>
      <p><strong>Stack:</strong></p>
      <pre style="background: #222; padding: 10px; border-radius: 4px; overflow: auto;">${errorStack}</pre>
      <p>Please check the console for more details.</p>
      <button onclick="window.location.reload()" style="background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}
