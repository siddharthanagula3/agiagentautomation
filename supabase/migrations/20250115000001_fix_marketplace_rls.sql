-- Fix Marketplace RLS Policies
-- This migration ensures proper RLS policies for marketplace functionality

-- First, ensure the ai_employees table exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.ai_employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    role text NOT NULL,
    category text NOT NULL,
    department text,
    level text DEFAULT 'mid',
    status text DEFAULT 'available',
    capabilities jsonb,
    system_prompt text NOT NULL,
    tools jsonb DEFAULT '[]',
    workflows jsonb DEFAULT '[]',
    performance jsonb DEFAULT '{}',
    availability jsonb DEFAULT '{}',
    cost jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ai_employees
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view ai employees" ON public.ai_employees;
DROP POLICY IF EXISTS "Service role can manage ai employees" ON public.ai_employees;

-- Create proper RLS policies for ai_employees
CREATE POLICY "ai_employees_public_read" ON public.ai_employees
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "ai_employees_service_manage" ON public.ai_employees
    FOR ALL
    TO service_role
    USING (true);

-- Ensure purchased_employees table has proper RLS
ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own hired employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can hire employees (insert)" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can update their own hired employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can delete their own hired employees" ON public.purchased_employees;

-- Create proper RLS policies for purchased_employees
CREATE POLICY "purchased_employees_select_own" ON public.purchased_employees
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "purchased_employees_insert_own" ON public.purchased_employees
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "purchased_employees_update_own" ON public.purchased_employees
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "purchased_employees_delete_own" ON public.purchased_employees
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create unique index to prevent duplicate hires
CREATE UNIQUE INDEX IF NOT EXISTS ux_purchased_employees_user_employee 
ON public.purchased_employees(user_id, employee_id);

-- Grant necessary permissions
GRANT SELECT ON public.ai_employees TO anon, authenticated;
GRANT ALL ON public.ai_employees TO service_role;
GRANT ALL ON public.purchased_employees TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "ai_employees_public_read" ON public.ai_employees IS 'Allow public read access to AI employees catalog';
COMMENT ON POLICY "purchased_employees_select_own" ON public.purchased_employees IS 'Users can only view their own purchased employees';
COMMENT ON POLICY "purchased_employees_insert_own" ON public.purchased_employees IS 'Users can only hire employees for themselves';
