-- ================================================================
-- FINAL FIX: Add 'name' column to purchased_employees table
-- ================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/lywdzvfibhzbljrgovwr/editor/sql
-- 2. Click "New Query"
-- 3. Copy & paste this ENTIRE file
-- 4. Click "Run" or press Ctrl+Enter
-- 
-- NOTE: The 'is_active' column already exists in your schema!
--       We only need to add the 'name' column.
-- ================================================================

-- Add the missing 'name' column
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Set default values for any existing records (use role as default name)
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL OR name = '';

-- ================================================================
-- VERIFICATION QUERIES (These will run automatically)
-- ================================================================

-- Show the updated schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- Show any existing purchased employees (if any)
SELECT 
    id,
    user_id,
    employee_id,
    name,           -- NEW COLUMN!
    role,
    provider,
    is_active,      -- ALREADY EXISTS!
    purchased_at,
    created_at
FROM purchased_employees
ORDER BY purchased_at DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS! The ''name'' column has been added to purchased_employees table.';
    RAISE NOTICE '✅ Your purchase system is now fully functional!';
    RAISE NOTICE '✅ Go to /marketplace and try purchasing an AI Employee.';
END $$;

