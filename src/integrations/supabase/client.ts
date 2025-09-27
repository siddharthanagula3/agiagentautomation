import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables (Vite uses import.meta.env instead of process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a function to initialize the client to avoid initialization issues
const createSupabaseClient = () => {
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are not set!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl);
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey);
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }

  const client = createClient<Database>(supabaseUrl, supabaseKey, {
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

  // Test the connection
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  });

  return client;
};

// Create Supabase client with lazy initialization
export const supabase = createSupabaseClient();

// Export for easy importing
export default supabase;
