import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
                           supabaseKey && 
                           !supabaseUrl.includes('your_supabase_url_here') && 
                           !supabaseKey.includes('your_supabase_anon_key_here');

// Create Supabase client
export const supabase = hasValidCredentials 
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Export for easy importing
export default supabase;
