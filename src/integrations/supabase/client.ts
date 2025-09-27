import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables (Vite uses import.meta.env instead of process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a function to initialize the client to avoid initialization issues
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are not set. Using empty values.');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: isBrowser ? localStorage : undefined,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// Create Supabase client with lazy initialization
export const supabase = createSupabaseClient();

// Export for easy importing
export default supabase;
