import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'user' }) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout reached');
        setTimeoutReached(true);
      }
    }, 15000); // 15 seconds timeout to allow AuthContext to complete

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If timeout reached and still loading, redirect to login
  if (timeoutReached && loading) {
    console.error('ProtectedRoute: Auth loading timed out, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export { ProtectedRoute };