-- Disable automatic trigger and allow direct inserts
-- This migration removes the problematic trigger and allows the application to create user profiles directly

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function for reference but don't use it automatically
-- We'll handle user creation in the application code instead

-- Ensure RLS policies allow user self-insertion
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions for authenticated users to insert
GRANT INSERT ON public.users TO authenticated;

COMMENT ON TABLE public.users IS 'User profiles - created by application code during signup';
