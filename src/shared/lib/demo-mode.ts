/**
 * Demo Mode Configuration
 * When enabled, bypasses Supabase and uses a mock authenticated user.
 * This allows the app to run fully locally without a backend connection.
 *
 * Set VITE_DEMO_MODE=true in .env to enable.
 */

export const DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  (import.meta.env.MODE !== 'test' && process.env.NODE_ENV !== 'test');

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@agiagentautomation.com',
  name: 'Demo User',
  avatar: undefined as string | undefined,
  role: 'admin' as const,
  plan: 'enterprise' as const,
  user_metadata: {
    full_name: 'Demo User',
    role: 'admin',
    plan: 'enterprise',
    company: 'AGI Demo',
  },
};
