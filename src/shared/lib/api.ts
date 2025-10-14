/**
 * API integration layer for AGI Agent Automation
 * Centralized API client with authentication, error handling, and type safety
 */

import { APIResponse, APIError, APIException } from '@shared/stores/query-client';

// ========================================
// API Configuration
// ========================================

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  defaultHeaders: Record<string, string>;
}

const DEFAULT_CONFIG: APIConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

// ========================================
// API Client Class
// ========================================

export class APIClient {
  private config: APIConfig;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  constructor(config: Partial<APIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  private setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.refreshTokenKey, token);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  // Build request headers
  private buildHeaders(
    customHeaders: Record<string, string> = {}
  ): HeadersInit {
    const headers: Record<string, string> = {
      ...this.config.defaultHeaders,
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Retry logic with exponential backoff
  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    attempt = 1
  ): Promise<Response> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.config.retries) {
        throw error;
      }

      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  // Token refresh logic
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new APIException({
        message: 'No refresh token available',
        code: 'NO_REFRESH_TOKEN',
        status: 401,
      });
    }

    const response = await fetch(`${this.config.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new APIException({
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED',
        status: response.status,
      });
    }

    const data = await response.json();
    const newToken = data.data?.token || data.token;

    if (!newToken) {
      throw new APIException({
        message: 'Invalid refresh response',
        code: 'INVALID_REFRESH_RESPONSE',
        status: 500,
      });
    }

    this.setToken(newToken);
    return newToken;
  }

  // Main request method
  private async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseURL}${endpoint}`;

    const requestOptions: RequestInit = {
      ...options,
      headers: this.buildHeaders(options.headers as Record<string, string>),
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await this.retryRequest(() =>
        fetch(url, requestOptions)
      );

      clearTimeout(timeoutId);

      // Handle 401 responses with token refresh
      if (response.status === 401 && this.getRefreshToken()) {
        try {
          await this.refreshAccessToken();
          // Retry the original request with new token
          const retryOptions = {
            ...requestOptions,
            headers: this.buildHeaders(
              options.headers as Record<string, string>
            ),
          };
          const retryResponse = await fetch(url, retryOptions);
          return this.parseResponse<T>(retryResponse);
        } catch (refreshError) {
          // Refresh failed, clear tokens and throw original 401 error
          this.clearTokens();
          throw new APIException({
            message: 'Authentication failed',
            code: 'AUTH_FAILED',
            status: 401,
          });
        }
      }

      return this.parseResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIException) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new APIException({
          message: 'Request timeout',
          code: 'TIMEOUT',
          status: 408,
        });
      }

      if (error instanceof TypeError) {
        throw new APIException({
          message: 'Network error',
          code: 'NETWORK_ERROR',
          status: 0,
        });
      }

      throw new APIException({
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN_ERROR',
      });
    }
  }

  // Parse API response
  private async parseResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type');

    // Handle empty responses
    if (response.status === 204) {
      return {
        data: null as T,
        success: true,
      };
    }

    // Handle non-JSON responses
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new APIException({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        });
      }

      const text = await response.text();
      return {
        data: text as T,
        success: true,
      };
    }

    // Parse JSON response
    let data: APIResponse<T>;
    try {
      data = await response.json();
    } catch (error) {
      throw new APIException({
        message: 'Invalid JSON response',
        code: 'INVALID_JSON',
        status: response.status,
      });
    }

    // Handle error responses
    if (!response.ok) {
      throw new APIException({
        message:
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: data.errors || data,
      });
    }

    return data;
  }

  // HTTP method implementations
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<APIResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const paramString = searchParams.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }

    return this.makeRequest<T>(url, { method: 'GET' });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<APIResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
        // Don't set Content-Type header for FormData, let browser set it
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return this.makeRequest<T>(endpoint, options);
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file with progress tracking
  async upload<T = unknown>(
    endpoint: string,
    file: File,
    options: {
      fieldName?: string;
      additionalData?: Record<string, unknown>;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<APIResponse<T>> {
    const { fieldName = 'file', additionalData = {}, onProgress } = options;

    const formData = new FormData();
    formData.append(fieldName, file);

    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(
              xhr
                .getAllResponseHeaders()
                .split('\r\n')
                .filter(line => line.trim())
                .reduce(
                  (headers, line) => {
                    const [key, value] = line.split(': ');
                    if (key && value) headers[key.toLowerCase()] = value;
                    return headers;
                  },
                  {} as Record<string, string>
                )
            ),
          });

          const result = await this.parseResponse<T>(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(
          new APIException({
            message: 'Upload failed',
            code: 'UPLOAD_FAILED',
          })
        );
      });

      xhr.addEventListener('timeout', () => {
        reject(
          new APIException({
            message: 'Upload timeout',
            code: 'UPLOAD_TIMEOUT',
            status: 408,
          })
        );
      });

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${this.config.baseURL}${endpoint}`;

      xhr.open('POST', url);

      // Set auth header
      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.timeout = this.config.timeout;
      xhr.send(formData);
    });
  }

  // Authentication methods
  async login(credentials: { email: string; password: string }): Promise<
    APIResponse<{
      user: unknown;
      token: string;
      refreshToken: string;
    }>
  > {
    const response = await this.post<{
      user: unknown;
      token: string;
      refreshToken: string;
    }>('/auth/login', credentials);

    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    if (response.data?.refreshToken) {
      this.setRefreshToken(response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<APIResponse<void>> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearTokens();
    }

    return {
      data: null as void,
      success: true,
    };
  }

  // Configuration methods
  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }

  // Health check
  async healthCheck(): Promise<
    APIResponse<{ status: string; timestamp: string }>
  > {
    return this.get('/health');
  }

  // Stream support for real-time data
  createEventSource(endpoint: string): EventSource {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseURL}${endpoint}`;

    const token = this.getToken();
    const eventSource = new EventSource(
      token ? `${url}?token=${encodeURIComponent(token)}` : url
    );

    return eventSource;
  }

  // WebSocket support
  createWebSocket(endpoint: string, protocols?: string | string[]): WebSocket {
    const url = endpoint.startsWith('ws')
      ? endpoint
      : `${this.config.baseURL.replace('http', 'ws')}${endpoint}`;

    const token = this.getToken();
    const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;

    return new WebSocket(wsUrl, protocols);
  }
}

// ========================================
// Default API Client Instance
// ========================================

export const apiClient = new APIClient();

// ========================================
// Request/Response Interceptors
// ========================================

export interface RequestInterceptor {
  (config: RequestInit): RequestInit | Promise<RequestInit>;
}

export interface ResponseInterceptor {
  <T>(response: APIResponse<T>): APIResponse<T> | Promise<APIResponse<T>>;
}

export interface ErrorInterceptor {
  (error: APIException): APIException | Promise<APIException>;
}

class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  async processRequest(config: RequestInit): Promise<RequestInit> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  async processResponse<T>(response: APIResponse<T>): Promise<APIResponse<T>> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  async processError(error: APIException): Promise<APIException> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }
}

export const interceptors = new InterceptorManager();

// ========================================
// Utility Functions
// ========================================

// Create API client with custom config
export const createAPIClient = (config: Partial<APIConfig> = {}) => {
  return new APIClient(config);
};

// Build query string from object
export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
};

// Check if error is a specific type
export const isAPIError = (
  error: unknown,
  code?: string
): error is APIException => {
  return error instanceof APIException && (!code || error.code === code);
};

// Extract error message from API error
export const getErrorMessage = (error: unknown): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Mock API responses for development
export const createMockResponse = <T>(
  data: T,
  delay = 1000
): Promise<APIResponse<T>> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data,
        success: true,
        message: 'Mock response',
      });
    }, delay);
  });
};

export default apiClient;
