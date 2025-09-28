import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute render:', { hasUser: !!user, loading, userEmail: user?.email });

  // If we have a user, allow access (check role if needed)
  if (user) {
    console.log('✅ User authenticated, checking role');
    
    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
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

  // If we're still loading, show loading spinner
  if (loading) {
    console.log('⏳ Still loading, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If we're not loading and no user, redirect to login
  console.log('🚪 No user found, redirecting to login');
  return <Navigate to="/auth/login" replace />;
};

export { ProtectedRoute };