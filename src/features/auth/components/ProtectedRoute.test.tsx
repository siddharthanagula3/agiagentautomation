/**
 * Tests for ProtectedRoute component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock the stores and hooks
vi.mock('@shared/stores/authentication-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@shared/hooks/useSessionTimeout', () => ({
  useSessionTimeout: vi.fn(() => ({
    isTimedOut: false,
    isWarningActive: false,
    secondsUntilTimeout: 0,
    timeoutMinutes: 60,
    lastActivity: Date.now(),
    extendSession: vi.fn(),
    forceLogout: vi.fn(),
  })),
}));

vi.mock('@shared/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    auth: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@shared/stores/authentication-store';
import { useSessionTimeout } from '@shared/hooks/useSessionTimeout';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  const renderWithRouter = (
    authState: Partial<ReturnType<typeof useAuthStore>>,
    sessionState?: Partial<ReturnType<typeof useSessionTimeout>>
  ) => {
    // Set up mocks
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      initialized: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
      initialize: vi.fn(),
      updateUser: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      changePassword: vi.fn(),
      updateProfile: vi.fn(),
      ...authState,
    } as ReturnType<typeof useAuthStore>);

    if (sessionState) {
      vi.mocked(useSessionTimeout).mockReturnValue({
        isTimedOut: false,
        isWarningActive: false,
        secondsUntilTimeout: 0,
        timeoutMinutes: 60,
        lastActivity: Date.now(),
        extendSession: vi.fn(),
        forceLogout: vi.fn(),
        ...sessionState,
      });
    }

    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('authentication', () => {
    it('should render children when user is authenticated', () => {
      renderWithRouter({
        user: { id: 'test-user', email: 'test@example.com' } as ReturnType<typeof useAuthStore>['user'],
        isAuthenticated: true,
        isLoading: false,
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      renderWithRouter({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should show loading spinner when loading', () => {
      renderWithRouter({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      // Should show loading spinner, not login page
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('role-based access', () => {
    it('should allow admin access for admin role', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: 'admin-user', email: 'admin@example.com', role: 'admin' } as ReturnType<typeof useAuthStore>['user'],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        initialized: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        fetchUser: vi.fn(),
        initialize: vi.fn(),
        updateUser: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        changePassword: vi.fn(),
        updateProfile: vi.fn(),
      } as ReturnType<typeof useAuthStore>);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Admin Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should redirect non-admin users from admin routes', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: 'user', email: 'user@example.com', role: 'user' } as ReturnType<typeof useAuthStore>['user'],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        initialized: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        fetchUser: vi.fn(),
        initialize: vi.fn(),
        updateUser: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        changePassword: vi.fn(),
        updateProfile: vi.fn(),
      } as ReturnType<typeof useAuthStore>);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Admin Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('session timeout', () => {
    it('should render SessionTimeoutWarning when warning is active', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' } as ReturnType<typeof useAuthStore>['user'],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        initialized: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        fetchUser: vi.fn(),
        initialize: vi.fn(),
        updateUser: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        changePassword: vi.fn(),
        updateProfile: vi.fn(),
      } as ReturnType<typeof useAuthStore>);

      vi.mocked(useSessionTimeout).mockReturnValue({
        isTimedOut: false,
        isWarningActive: true,
        secondsUntilTimeout: 60,
        timeoutMinutes: 60,
        lastActivity: Date.now(),
        extendSession: vi.fn(),
        forceLogout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Content should still be visible
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      // Warning dialog should be shown
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });

    it('should not render SessionTimeoutWarning when timeout enforcement is disabled', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' } as ReturnType<typeof useAuthStore>['user'],
        isAuthenticated: true,
        isLoading: false,
        error: null,
        initialized: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        fetchUser: vi.fn(),
        initialize: vi.fn(),
        updateUser: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        changePassword: vi.fn(),
        updateProfile: vi.fn(),
      } as ReturnType<typeof useAuthStore>);

      vi.mocked(useSessionTimeout).mockReturnValue({
        isTimedOut: false,
        isWarningActive: true,
        secondsUntilTimeout: 60,
        timeoutMinutes: 60,
        lastActivity: Date.now(),
        extendSession: vi.fn(),
        forceLogout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute enforceSessionTimeout={false}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Content should still be visible
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      // Warning dialog should NOT be shown
      expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
    });
  });
});
