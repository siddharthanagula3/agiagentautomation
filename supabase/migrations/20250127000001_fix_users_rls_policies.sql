-- Fix Row Level Security policies for users table
-- This migration creates proper RLS policies to allow users to manage their own profiles

-- First, ensure RLS is enabled on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Create RLS policies for authenticated users
-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Create an index on the id column for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Add a comment to document the RLS setup
COMMENT ON TABLE public.users IS 'User profiles with Row Level Security enabled. Users can only access their own data.';
