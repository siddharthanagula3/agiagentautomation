import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Authentication Middleware for Netlify Functions
 * Verifies JWT token from Authorization header
 * Prevents unauthorized access to LLM proxy endpoints
 */

interface AuthenticatedEvent extends HandlerEvent {
  user: {
    id: string;
    email?: string;
  };
}

// Updated: Nov 16th 2025 - Fixed any type
type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: HandlerContext
) => Promise<HandlerResponse>;

// Updated: Nov 16th 2025 - Fixed Supabase client memory leak - create singleton client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

/**
 * Wraps a Netlify function handler with authentication
 * Extracts and verifies Supabase JWT token
 */
export function withAuth(handler: AuthenticatedHandler): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      // Extract token from Authorization header
      const authHeader = event.headers.authorization || event.headers.Authorization;

      if (!authHeader) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Missing authorization header',
            message: 'Please provide a valid Supabase auth token'
          }),
        };
      }

      // Remove 'Bearer ' prefix if present
      const token = authHeader.replace(/^Bearer\s+/i, '');

      if (!token) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Invalid authorization format',
            message: 'Expected: Authorization: Bearer <token>'
          }),
        };
      }

      // Updated: Nov 16th 2025 - Fixed Supabase client memory leak - use singleton client
      let supabase;
      try {
        supabase = getSupabaseClient();
      } catch (error) {
        console.error('[Auth Middleware] Supabase not configured');
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Server configuration error'
          }),
        };
      }

      // Verify the token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.warn('[Auth Middleware] Invalid token:', error?.message);
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Invalid or expired token',
            message: 'Please login again to obtain a fresh token'
          }),
        };
      }

      // Attach user to event for handler to use
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user: {
          id: user.id,
          email: user.email,
        },
      };

      // Call the original handler with authenticated event
      return await handler(authenticatedEvent, context);

    } catch (error) {
      console.error('[Auth Middleware] Unexpected error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
      };
    }
  };
}

/**
 * Optional: Check if user has specific role or permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Query user_profiles or permissions table
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, permissions')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  // Check if user has permission
  return data.permissions?.includes(permission) || data.role === 'admin';
}
