import { Suspense, lazy, ComponentType } from 'react';
import { LazyFallback } from './lazy-fallback';

export const lazyWithRetry = <T extends ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazy(() =>
    importFunc().catch((error) => {
      console.error('Failed to load component:', error);
      // Retry once after a delay
      return new Promise((resolve) => {
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
    <Suspense fallback={<LazyFallback />}>
      <Component {...props} />
    </Suspense>
  );
};
