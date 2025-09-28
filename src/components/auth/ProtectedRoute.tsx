import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const { user, loading } = useAuth();

  // ULTIMATE FIX: If user exists, allow access immediately
  if (user) {
    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  }

  // ULTIMATE FIX: Only redirect if we're sure there's no user and not loading
  if (!loading && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // ULTIMATE FIX: Show loading only if we're actually loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ULTIMATE FIX: If we reach here, show children (this should not happen)
  return <>{children}</>;
};

export { ProtectedRoute };