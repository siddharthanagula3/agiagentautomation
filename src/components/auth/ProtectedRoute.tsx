import React from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
    
  // IMMEDIATE PROTECTED ROUTE CHECK
  const immediateUser = supabase.auth.getUser();
  if (immediateUser && immediateUser.data && immediateUser.data.user) {
    console.log('🚀 IMMEDIATE PROTECTED: User found, bypassing loading');
    return <>{children}</>;
  }

  const { user, loading } = useAuth();

  // IMMEDIATELY allow access if user exists, regardless of loading state
  if (user) {
    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  }

  // Only redirect to login if no user and not loading
  if (!loading && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Show loading only if we're actually loading and no user
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallback - should not reach here
  return <Navigate to="/auth/login" replace />;
};

export { ProtectedRoute };