/**
 * Authentication and authorization utilities
 * Handles JWT tokens, permissions, and auth state management
 */

import { apiClient } from './api';
import { APIResponse } from '@/stores/query-client';
import { AuthUser } from '@/stores/unified-auth-store';

// ========================================
// Types and Interfaces
// ========================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  agreeToTerms: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  permissions: string[];
  plan: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface PermissionCheck {
  permission: string;
  resource?: string;
  action?: string;
}

// ========================================
// JWT Token Management
// ========================================

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'agi_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'agi_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'agi_token_expiry';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string, expiresAt: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt.toString());
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static getTokenExpiry(): number | null {
    if (typeof window === 'undefined') return null;
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }

  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() > expiry - (5 * 60 * 1000); // 5 minutes buffer
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  static getTokenPayload(): JWTPayload | null {
    const token = this.getAccessToken();
    return token ? this.decodeToken(token) : null;
  }

  static hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    return Date.now() < payload.exp * 1000;
  }
}

// ========================================
// Permission Management
// ========================================

export class PermissionManager {
  private static permissions = new Set<string>();
  private static role: string | null = null;

  static setPermissions(permissions: string[], role: string): void {
    this.permissions = new Set(permissions);
    this.role = role;
  }

  static hasPermission(permission: string): boolean {
    return this.permissions.has(permission) || this.isAdmin();
  }

  static hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p)) || this.isAdmin();
  }

  static hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p)) || this.isAdmin();
  }

  static canAccessResource(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission) || this.isAdmin();
  }

  static isAdmin(): boolean {
    return this.role === 'admin';
  }

  static isModerator(): boolean {
    return this.role === 'moderator' || this.isAdmin();
  }

  static getRole(): string | null {
    return this.role;
  }

  static getPermissions(): string[] {
    return Array.from(this.permissions);
  }

  static clear(): void {
    this.permissions.clear();
    this.role = null;
  }
}

// ========================================
// Auth Service
// ========================================

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<APIResponse<{
    user: User;
    tokens: AuthTokens;
  }>> {
    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>('/auth/login', credentials);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresIn } = response.data;
        const expiresAt = Date.now() + (expiresIn * 1000);

        // Store tokens
        TokenManager.setAccessToken(accessToken, expiresAt);
        TokenManager.setRefreshToken(refreshToken);

        // Set permissions
        const payload = TokenManager.decodeToken(accessToken);
        if (payload) {
          PermissionManager.setPermissions(payload.permissions, payload.role);
        }

        const tokens: AuthTokens = {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresAt,
        };

        return {
          ...response,
          data: { user, tokens },
        };
      }

      throw new Error('Invalid login response');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async register(data: RegisterData): Promise<APIResponse<{
    user: User;
    tokens: AuthTokens;
  }>> {
    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>('/auth/register', data);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresIn } = response.data;
        const expiresAt = Date.now() + (expiresIn * 1000);

        // Store tokens
        TokenManager.setAccessToken(accessToken, expiresAt);
        TokenManager.setRefreshToken(refreshToken);

        // Set permissions
        const payload = TokenManager.decodeToken(accessToken);
        if (payload) {
          PermissionManager.setPermissions(payload.permissions, payload.role);
        }

        const tokens: AuthTokens = {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresAt,
        };

        return {
          ...response,
          data: { user, tokens },
        };
      }

      throw new Error('Invalid registration response');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      TokenManager.clearTokens();
      PermissionManager.clear();
    }
  }

  static async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>('/auth/refresh', { refreshToken });

      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        const expiresAt = Date.now() + (expiresIn * 1000);

        // Store new tokens
        TokenManager.setAccessToken(accessToken, expiresAt);
        TokenManager.setRefreshToken(newRefreshToken);

        // Update permissions
        const payload = TokenManager.decodeToken(accessToken);
        if (payload) {
          PermissionManager.setPermissions(payload.permissions, payload.role);
        }

        return {
          accessToken,
          refreshToken: newRefreshToken,
          tokenType: 'Bearer',
          expiresAt,
        };
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      TokenManager.clearTokens();
      PermissionManager.clear();
      throw this.handleAuthError(error);
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch user data');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<User>('/auth/profile', updates);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async changePassword(data: UpdatePasswordData): Promise<void> {
    try {
      const response = await apiClient.post('/auth/change-password', data);

      if (!response.success) {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async requestPasswordReset(data: ResetPasswordData): Promise<void> {
    try {
      const response = await apiClient.post('/auth/forgot-password', data);

      if (!response.success) {
        throw new Error('Failed to request password reset');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });

      if (!response.success) {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });

      if (!response.success) {
        throw new Error('Failed to verify email');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static async resendVerificationEmail(): Promise<void> {
    try {
      const response = await apiClient.post('/auth/resend-verification');

      if (!response.success) {
        throw new Error('Failed to resend verification email');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  static isAuthenticated(): boolean {
    return TokenManager.hasValidToken();
  }

  static needsRefresh(): boolean {
    return TokenManager.isTokenExpired() && !!TokenManager.getRefreshToken();
  }

  static async ensureValidToken(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    if (this.needsRefresh()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    }

    return false;
  }

  private static handleAuthError(error: unknown): AuthError {
    if (error?.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
        details: error,
      };
    }

    if (error?.status === 403) {
      return {
        code: 'FORBIDDEN',
        message: 'Access denied',
        details: error,
      };
    }

    if (error?.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        details: error,
      };
    }

    return {
      code: 'AUTH_ERROR',
      message: error?.message || 'Authentication error occurred',
      details: error,
    };
  }
}

// ========================================
// Auth Guard Component
// ========================================

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/unified-auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  redirect?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  permissions = [],
  requireAll = false,
  redirect,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && TokenManager.hasValidToken()) {
        // Try to restore auth state from token
        try {
          const userData = await AuthService.getCurrentUser();
          const authStore = useAuthStore.getState();
          authStore.updateUser(userData);
        } catch (error) {
          console.error('Auth restoration failed:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated]);

  if (isLoading) {
    return fallback || null;
  }

  if (!isAuthenticated) {
    if (redirect && typeof window !== 'undefined') {
      window.location.href = redirect;
      return null;
    }
    return fallback || null;
  }

  // Check permissions if specified
  if (permissions.length > 0) {
    const hasPermissions = requireAll
      ? PermissionManager.hasAllPermissions(permissions)
      : PermissionManager.hasAnyPermission(permissions);

    if (!hasPermissions) {
      return fallback || null;
    }
  }

  return children;
};

// ========================================
// Permission Guard Hook
// ========================================

export const usePermissions = () => {
  return {
    hasPermission: PermissionManager.hasPermission,
    hasAnyPermission: PermissionManager.hasAnyPermission,
    hasAllPermissions: PermissionManager.hasAllPermissions,
    canAccessResource: PermissionManager.canAccessResource,
    isAdmin: PermissionManager.isAdmin,
    isModerator: PermissionManager.isModerator,
    getRole: PermissionManager.getRole,
    getPermissions: PermissionManager.getPermissions,
  };
};

// ========================================
// Auth Hook
// ========================================

export const useAuth = () => {
  const authStore = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    try {
      authStore.setError(null);
      const response = await AuthService.login(credentials);

      if (response.data) {
        const { user } = response.data;
        authStore.updateUser(user);
      }

      return response;
    } catch (error) {
      const authError = error as AuthError;
      authStore.setError(authError.message);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      authStore.setError(null);
      const response = await AuthService.register(data);

      if (response.data) {
        const { user } = response.data;
        authStore.updateUser(user);
      }

      return response;
    } catch (error) {
      const authError = error as AuthError;
      authStore.setError(authError.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      authStore.reset();
    } catch (error) {
      console.error('Logout error:', error);
      // Always reset state even if server call fails
      authStore.reset();
    }
  };

  return {
    ...authStore,
    login,
    register,
    logout,
    isAuthenticated: AuthService.isAuthenticated(),
    permissions: usePermissions(),
  };
};

// ========================================
// Auto Token Refresh
// ========================================

export class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  start(): void {
    this.stop();
    this.scheduleRefresh();
  }

  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleRefresh(): void {
    const expiry = TokenManager.getTokenExpiry();
    if (!expiry) return;

    // Refresh 5 minutes before expiry
    const refreshTime = expiry - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.performRefresh();
      }, refreshTime);
    }
  }

  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) return;

    this.isRefreshing = true;

    try {
      await AuthService.refreshToken();
      this.scheduleRefresh(); // Schedule next refresh
    } catch (error) {
      console.error('Auto token refresh failed:', error);
      // Redirect to login or show auth modal
      const authStore = useAuthStore.getState();
      authStore.setError('Session expired. Please log in again.');
      authStore.reset();
    } finally {
      this.isRefreshing = false;
    }
  }
}

export const tokenRefreshManager = new TokenRefreshManager();

export default AuthService;