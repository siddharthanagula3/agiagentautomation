import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
}) => {
  const { user, isLoading } = useAuthStore();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Set up timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
      }, 5000); // Reduce to 5 seconds

      return () => clearTimeout(timeout);
    } else {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  // If we have a user, allow access (check role if needed)
  if (user) {
    if (
      requiredRole === 'admin' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  }

  // If we're still loading and haven't timed out, show loading spinner
  if (isLoading && !timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if timeout reached or loading finished without user
  // Updated: Jan 15th 2026 - Removed redundant final return (unreachable code)
  return <Navigate to="/auth/login" replace />;
};

export { ProtectedRoute };
