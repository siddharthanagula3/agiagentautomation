import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/unified-auth-store';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log(
        'AuthLayout: User already authenticated, redirecting to dashboard'
      );
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render auth pages if user is authenticated
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Outlet />
    </div>
  );
};

export { AuthLayout };
