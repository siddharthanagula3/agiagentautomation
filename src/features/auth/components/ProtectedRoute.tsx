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
        console.error(
          'ProtectedRoute: Auth loading timed out, redirecting to login'
        );
        setTimeoutReached(true);
      }, 5000); // Reduce to 5 seconds

      return () => clearTimeout(timeout);
    } else {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  console.log('🛡️ ProtectedRoute render:', {
    hasUser: !!user,
    isLoading,
    timeoutReached,
    userEmail: user?.email,
  });

  // If we have a user, allow access (check role if needed)
  if (user) {
    console.log('✅ User authenticated, checking role');

    if (
      requiredRole === 'admin' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      console.log('❌ Insufficient permissions for admin route');
      return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      console.log('❌ Insufficient permissions for super_admin route');
      return <Navigate to="/dashboard" replace />;
    }

    console.log('✅ Access granted');
    return <>{children}</>;
  }

  // If we're still loading and haven't timed out, show loading spinner
  if (isLoading && !timeoutReached) {
    console.log('⏳ Still loading, showing spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Immediately redirect if timeout reached
  // Updated: Nov 16th 2025 - Fixed unreachable code (removed dead code block)
  if (timeoutReached || (!isLoading && !user)) {
    return <Navigate to="/auth/login" replace />;
  }

  // This point should never be reached due to early returns above
  return <Navigate to="/auth/login" replace />;
};

export { ProtectedRoute };
