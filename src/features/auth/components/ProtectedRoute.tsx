import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useSessionTimeout } from '@shared/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { toast } from 'sonner';
import { logger } from '@shared/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
  /** Whether to enforce session timeout (default: true) */
  enforceSessionTimeout?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
  enforceSessionTimeout = true,
}) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Session timeout handling
  const handleSessionTimeout = useCallback(() => {
    logger.auth('[ProtectedRoute] Session timed out, redirecting to login');
    toast.info('Your session has expired. Please log in again.', {
      duration: 5000,
    });
    // Navigate to login with the current location as return path
    navigate('/auth/login', {
      state: { from: { pathname: location.pathname }, reason: 'session_timeout' },
      replace: true,
    });
  }, [navigate, location.pathname]);

  const handleSessionWarning = useCallback((secondsRemaining: number) => {
    logger.debug(`[ProtectedRoute] Session timeout warning: ${secondsRemaining}s remaining`);
  }, []);

  const handleSessionExtended = useCallback(() => {
    logger.debug('[ProtectedRoute] Session extended by user activity');
    toast.success('Session extended', { duration: 2000 });
  }, []);

  const {
    isWarningActive,
    secondsUntilTimeout,
    extendSession,
    forceLogout,
  } = useSessionTimeout({
    enabled: enforceSessionTimeout && !!user,
    onTimeout: handleSessionTimeout,
    onWarning: handleSessionWarning,
    onSessionExtended: handleSessionExtended,
  });

  // Set up timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
      }, 5000); // Reduce to 5 seconds

      return () => clearTimeout(timeout);
    } else {
      // Use queueMicrotask to batch the setState call and avoid cascading renders
      queueMicrotask(() => {
        setTimeoutReached(false);
      });
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

    return (
      <>
        {children}
        {/* Session Timeout Warning Dialog */}
        {enforceSessionTimeout && (
          <SessionTimeoutWarning
            isOpen={isWarningActive}
            secondsRemaining={secondsUntilTimeout}
            onExtendSession={extendSession}
            onLogout={forceLogout}
          />
        )}
      </>
    );
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
  // Pass the current location as state so login can redirect back after auth
  return <Navigate to="/auth/login" state={{ from: { pathname: location.pathname } }} replace />;
};

export { ProtectedRoute };
