import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables (Vite uses import.meta.env instead of process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if we have valid Supabase credentials
const hasValidCredentials = () => {
  return supabaseUrl && 
         supabaseKey && 
         !supabaseUrl.includes('your_supabase_url_here') && 
         !supabaseKey.includes('your_supabase_anon_key_here');
};

// Create a function to initialize the client to avoid initialization issues
const createSupabaseClient = () => {
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');
  
  if (!hasValidCredentials()) {
    console.warn('Supabase environment variables are not properly configured!');
    console.warn('Running in DEMO MODE - no backend functionality');
    console.warn('To enable full functionality, please set up your Supabase credentials');
    
    // Return a mock client that won't crash the app
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Demo mode - no backend' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Demo mode - no backend' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Demo mode - no backend' } })
          }),
          single: async () => ({ data: null, error: { message: 'Demo mode - no backend' } })
        }),
        insert: async () => ({ data: null, error: { message: 'Demo mode - no backend' } }),
        update: async () => ({ data: null, error: { message: 'Demo mode - no backend' } }),
        delete: async () => ({ data: null, error: { message: 'Demo mode - no backend' } })
      }),
      channel: () => ({
        on: () => ({ subscribe: () => {} })
      }),
      removeAllChannels: async () => {}
    } as any;
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
