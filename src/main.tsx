import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import App from "./App.tsx";
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

// Ensure DOM is ready before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure index.html has a div with id='root'");
}

// Wrap in try-catch to handle initialization errors
try {
  const root = createRoot(rootElement);
  
  // Add timeout to prevent infinite loading
  const renderTimeout = setTimeout(() => {
    console.warn('App initialization taking longer than expected');
  }, 5000);
  
  root.render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-right" richColors />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
  
  // Clear timeout once app is rendered
  clearTimeout(renderTimeout);
} catch (error) {
  console.error("Failed to initialize application:", error);
  // Display error in the DOM
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red;">
      <h1>Application Initialization Error</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
}
