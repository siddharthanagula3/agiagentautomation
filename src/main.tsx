import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import AppRouter from './AppRouter';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import {
  validateAndLogEnvironment,
  logEnvironmentConfig,
} from '@shared/utils/env-validation';
import './index.css';

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
