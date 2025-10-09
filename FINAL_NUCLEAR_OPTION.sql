-- ================================================================
-- NUCLEAR OPTION: Disable RLS temporarily and add column
-- ================================================================
-- Use this ONLY if the other two scripts fail
-- This temporarily disables Row Level Security
-- ================================================================

-- Disable RLS temporarily
ALTER TABLE purchased_employees DISABLE ROW LEVEL SECURITY;

-- Add the column with explicit schema
ALTER TABLE public.purchased_employees 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Set defaults
UPDATE public.purchased_employees 
SET name = role 
WHERE name IS NULL OR name = '';

-- Re-enable RLS
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- Show data
SELECT * FROM purchased_employees LIMIT 5;

