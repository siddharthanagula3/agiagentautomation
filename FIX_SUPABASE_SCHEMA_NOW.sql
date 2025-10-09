-- URGENT: Fix purchased_employees table schema
-- Run this SQL directly in Supabase SQL Editor

-- Add missing 'name' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'purchased_employees' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.purchased_employees 
    ADD COLUMN name VARCHAR(255);
    
    -- Set default name from role for existing records
    UPDATE public.purchased_employees 
    SET name = role 
    WHERE name IS NULL;
    
    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.purchased_employees 
    ALTER COLUMN name SET NOT NULL;
    
    RAISE NOTICE 'Added name column to purchased_employees table';
  ELSE
    RAISE NOTICE 'name column already exists';
  END IF;
END $$;

-- Add missing 'is_active' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'purchased_employees' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.purchased_employees 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    -- Set all existing records to active
    UPDATE public.purchased_employees 
    SET is_active = true 
    WHERE is_active IS NULL;
    
    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.purchased_employees 
    ALTER COLUMN is_active SET NOT NULL;
    
    RAISE NOTICE 'Added is_active column to purchased_employees table';
  ELSE
    RAISE NOTICE 'is_active column already exists';
  END IF;
END $$;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- Check if there are any records
SELECT COUNT(*) as total_records FROM purchased_employees;

-- Show last 5 purchases (if any)
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
LIMIT 5;

