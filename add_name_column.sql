-- Add missing 'name' column to purchased_employees table
-- This is the ONLY missing column (is_active already exists)

ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Set default values for existing records
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL OR name = '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
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
    provider,
    is_active,
    purchased_at
FROM purchased_employees
ORDER BY purchased_at DESC
LIMIT 10;

