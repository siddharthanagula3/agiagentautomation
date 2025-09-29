import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import AppRouter from "./AppRouter";
import { DebugPanel } from "./components/DebugPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Create QueryClient with proper initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent refetch on window focus
    },
  },
});

const Main = () => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AppRouter />
            <Toaster position="top-right" richColors />
            <DebugPanel />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
};

// Ensure DOM is ready before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure index.html has a div with id='root'");
}

// Add some initial logging for debugging
console.log('🚀 Starting AGI Agent Automation app...');
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌',
  demoMode: import.meta.env.VITE_DEMO_MODE
});

// Wrap in try-catch to handle initialization errors
try {
  const root = createRoot(rootElement);
  
  // Add timeout to prevent infinite loading
  const renderTimeout = setTimeout(() => {
    console.warn('⚠️ App initialization taking longer than expected');
  }, 10000); // Increased to 10 seconds
  
  root.render(<Main />);
  
  // Clear timeout once app is rendered
  clearTimeout(renderTimeout);
  
  // Hide the initial loader immediately after render is called
  setTimeout(() => {
    const loader = document.getElementById('initial-loader');
    const errorContainer = document.querySelector('.error-container');
    
    if (loader) {
      loader.style.display = 'none';
    }
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
    
    // Remove loading class and add app-loaded class
    document.body.classList.remove('loading');
    document.body.classList.add('app-loaded');
  }, 500); // Increased delay to ensure React has started mounting
  
  console.log('✅ App rendering initiated');
} catch (error) {
  console.error("❌ Failed to initialize application:", error);
  // Display error in the DOM
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red; background: #111; min-height: 100vh;">
      <h1>🚨 Application Initialization Error</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      <p><strong>Type:</strong> ${error instanceof Error ? error.name : 'Unknown'}</p>
      <p><strong>Stack:</strong></p>
      <pre style="background: #222; padding: 10px; border-radius: 4px; overflow: auto;">
        ${error instanceof Error ? error.stack : 'No stack trace available'}
      </pre>
      <p>Please check the console for more details.</p>
      <button onclick="window.location.reload()" style="background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}
