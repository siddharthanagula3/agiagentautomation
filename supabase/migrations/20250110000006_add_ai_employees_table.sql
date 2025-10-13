-- ================================================================
-- Add AI Employees Table
-- ================================================================
-- This migration adds the ai_employees table that was missing
-- from the main schema but is referenced in seed data
-- ================================================================

-- Create AI Employees table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_employees_role ON public.ai_employees(role);
CREATE INDEX IF NOT EXISTS idx_ai_employees_category ON public.ai_employees(category);
CREATE INDEX IF NOT EXISTS idx_ai_employees_status ON public.ai_employees(status);
CREATE INDEX IF NOT EXISTS idx_ai_employees_level ON public.ai_employees(level);
CREATE INDEX IF NOT EXISTS idx_ai_employees_department ON public.ai_employees(department);

-- Enable Row Level Security
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view ai employees" ON public.ai_employees
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage ai employees" ON public.ai_employees
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.ai_employees TO authenticated;
GRANT ALL ON public.ai_employees TO service_role;

-- Add comment
COMMENT ON TABLE public.ai_employees IS 'AI employees available for hire in the marketplace';
