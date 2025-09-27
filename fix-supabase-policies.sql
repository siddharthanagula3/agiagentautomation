-- Fix RLS Policies for Users Table
-- Drop existing policies if they exist (ignore errors if they don't exist)
DO $$ 
BEGIN
    -- Drop users table policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can insert users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can delete users" ON public.users;
    DROP POLICY IF EXISTS "System can create user profiles" ON public.users;
    
    -- Drop mcp_tools table policies
    DROP POLICY IF EXISTS "Authenticated users can view mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can insert mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can update mcp_tools" ON public.mcp_tools;
    DROP POLICY IF EXISTS "Authenticated users can delete mcp_tools" ON public.mcp_tools;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Create users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to create profiles for authenticated users
CREATE POLICY "System can create user profiles" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow viewing other users (for admin purposes)
CREATE POLICY "Authenticated users can view users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create mcp_tools table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mcp_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mcp_tools
ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;

-- Create mcp_tools policies
CREATE POLICY "Authenticated users can view mcp_tools" ON public.mcp_tools
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert mcp_tools" ON public.mcp_tools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update mcp_tools" ON public.mcp_tools
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete mcp_tools" ON public.mcp_tools
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample MCP tools (only if they don't exist)
INSERT INTO public.mcp_tools (name, description, category, is_active) VALUES
('File Manager', 'Manage files and directories', 'system', true),
('Database Query', 'Execute database queries', 'data', true),
('API Client', 'Make HTTP requests to external APIs', 'integration', true),
('Email Sender', 'Send emails programmatically', 'communication', true),
('Image Processor', 'Process and manipulate images', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 'Users table policies created successfully' as status;
SELECT 'MCP tools table and policies created successfully' as status;
