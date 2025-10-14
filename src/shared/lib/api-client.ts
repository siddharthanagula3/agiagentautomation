import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: unknown, context: string): string {
    console.error(`API Error in ${context}:`, error);

    let errorMessage = 'An unexpected error occurred';

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Show user-friendly error message
    toast.error(errorMessage);

    return errorMessage;
  }

  async get<T>(
    url: string,
    context: string = 'GET request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async post<T>(
    url: string,
    body: unknown,
    context: string = 'POST request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async put<T>(
    url: string,
    body: unknown,
    context: string = 'PUT request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  async delete<T>(
    url: string,
    context: string = 'DELETE request'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }

  // Supabase-specific methods
  async supabaseQuery<T>(
    table: string,
    query: unknown,
    context: string = 'Supabase query'
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage = this.handleError(error, context);
      return { data: null, error: errorMessage, success: false };
    }
  }
}

export const apiClient = new ApiClient();
