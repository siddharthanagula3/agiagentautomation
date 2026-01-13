/**
 * Centralized Supabase Client
 * Prevents multiple GoTrueClient instances
 * Updated: Jan 10th 2026 - Removed hardcoded token fallback for security
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';

// Environment variables - no hardcoded fallbacks for security
// SECURITY: API keys should never be hardcoded in source code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is required. ' +
      'For local development, run: supabase start ' +
      'or set VITE_SUPABASE_URL=http://localhost:54321 in .env'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is required. ' +
      'For local development, run: supabase start ' +
      'and copy the anon key from the output, or check supabase/.env'
  );
}

// Updated: Nov 16th 2025 - Fixed window object check for SSR compatibility
// Create a single Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'agi-workforce-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'agi-workforce@1.0.0',
    },
  },
});

// Export for backward compatibility
export default supabase;
