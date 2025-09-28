// src/AppRouter.tsx

import { useEffect } from 'react';
import { useAuthStore } from './stores/unified-auth-store';
import App from './App';

const AppRouter = () => {
  const { user, isLoading } = useAuthStore();

  // This effect will log the auth state whenever it changes, which is useful for debugging.
  useEffect(() => {
    console.log('Auth State Change:', { user, isLoading });
  }, [user, isLoading]);

  // While the auth state is being determined, show a full-screen loader.
  // This is the ONLY top-level loading check we should have.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Once loading is complete, render the main App component.
  // The App component will then handle rendering the correct routes based on the auth state.
  return <App />;
};

export default AppRouter;
