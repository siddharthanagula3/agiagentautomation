-- ================================================================
-- CRITICAL FIX: Run this SQL in Supabase SQL Editor NOW
-- ================================================================
-- This fixes the purchase system by adding missing columns
-- 
-- HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/lywdzvfibhzbljrgovwr/editor/sql
-- 2. Click "New Query"
-- 3. Copy & paste this entire file
-- 4. Click "Run" or press Ctrl+Enter
-- ================================================================

-- Add missing name column
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add missing is_active column
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any existing records
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL OR name = '';

UPDATE purchased_employees 
SET is_active = COALESCE(is_active, true);

-- Verify the fix worked
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- Show any existing purchased employees
SELECT 
    id,
    user_id,
    employee_id,
    name,
    role,
    is_active,
    purchased_at
FROM purchased_employees
ORDER BY purchased_at DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema fix completed successfully!';
    RAISE NOTICE '✅ You can now purchase AI Employees';
    RAISE NOTICE '✅ Go to /marketplace and try purchasing an employee';
END $$;

