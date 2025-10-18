// src/AppRouter.tsx

import { useEffect } from 'react';
import { useAuthStore } from '@shared/stores/authentication-store';
import App from './App';

const AppRouter = () => {
  const { user, isLoading, initialize, initialized, error } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      if (import.meta.env.DEV) {
        console.log('AppRouter: Initializing auth...');
      }
      initialize();
    }
  }, [initialize, initialized]);

  // This effect will log the auth state whenever it changes, which is useful for debugging.
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('AppRouter: Auth State Change:', {
        user: user?.email || 'No user',
        isLoading,
        initialized,
        error,
      });
    }
  }, [user, isLoading, initialized, error]);

  // While the auth state is being determined, show a full-screen loader.
  if (isLoading || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {!initialized ? 'Initializing...' : 'Loading...'}
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  // Once loading is complete, render the main App component.
  // The App component will then handle rendering the correct routes based on the auth state.
  return <App />;
};

export default AppRouter;
