import { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component - moved to separate component to avoid React refresh warning
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Export loading spinner as default to avoid React refresh warning
export default LoadingSpinner;

// Lazy wrapper component
export const lazyWithRetry = <T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load component:', error);
      // Retry once after a delay
      return new Promise(resolve => {
        setTimeout(() => {
          importFunc()
            .then(resolve)
            .catch(() => {
              // If retry fails, show error component
              resolve({
                default: () => (
                  <div className="flex h-screen items-center justify-center bg-background">
                    <div className="text-center">
                      <h2 className="mb-2 text-lg font-semibold text-destructive">
                        Failed to Load Component
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Please refresh the page to try again.
                      </p>
                    </div>
                  </div>
                ),
              });
            });
        }, 1000);
      });
    })
  );
};

// Higher-order component for lazy loading with suspense
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
};
