// src/AppRouter.tsx

import { useEffect } from 'react';
import { useAuthStore } from './stores/unified-auth-store';
import App from './App';

const AppRouter = () => {
  const { user, isLoading, initialize, initialized, error } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      console.log('AppRouter: Initializing auth...');
      initialize();
    }
  }, [initialize, initialized]);

  // This effect will log the auth state whenever it changes, which is useful for debugging.
  useEffect(() => {
    console.log('AppRouter: Auth State Change:', { 
      user: user?.email || 'No user', 
      isLoading, 
      initialized,
      error 
    });
  }, [user, isLoading, initialized, error]);

  // While the auth state is being determined, show a full-screen loader.
  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {!initialized ? 'Initializing...' : 'Loading...'}
          </p>
          {error && (
            <p className="text-sm text-destructive mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Once loading is complete, render the main App component.
  // The App component will then handle rendering the correct routes based on the auth state.
  return <App />;
};

export default AppRouter;
