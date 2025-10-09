-- ================================================================
-- SIMPLE FIX: Add 'name' column to purchased_employees
-- ================================================================
-- Copy & paste this ENTIRE script into Supabase SQL Editor
-- Then click "Run" or press Ctrl+Enter
-- ================================================================

-- Step 1: Add the name column (simple, no schema prefix)
ALTER TABLE purchased_employees 
ADD COLUMN name TEXT;

-- Step 2: Set default values for any existing records
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL;

-- ================================================================
-- VERIFICATION (These will show results)
-- ================================================================

-- Show the updated table structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchased_employees'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show any existing purchased employees
SELECT 
    id,
    employee_id,
    name,
    role,
    provider,
    is_active,
    purchased_at
FROM purchased_employees
ORDER BY purchased_at DESC
LIMIT 10;

