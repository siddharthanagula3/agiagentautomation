/**
 * Centralized Supabase Client
 * Prevents multiple GoTrueClient instances
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/types/supabase';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
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
