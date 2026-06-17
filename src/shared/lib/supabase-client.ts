/**
 * Centralized Supabase Client
 * Prevents multiple GoTrueClient instances
 * Updated: Jun 2026 - Added Demo Mode fallback for offline/paused backend
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';
import { DEMO_MODE } from './demo-mode';

// Environment variables - no hardcoded fallbacks for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In demo mode, skip validation and use a placeholder client that won't make real calls
if (!DEMO_MODE) {
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
}

// Create a single Supabase client instance (uses real URL in demo mode but calls are intercepted)
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient<Database>(url, key, {
  auth: {
    autoRefreshToken: !DEMO_MODE,
    persistSession: !DEMO_MODE,
    detectSessionInUrl: !DEMO_MODE,
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
