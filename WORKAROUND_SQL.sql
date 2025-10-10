-- ================================================================
-- WORKAROUND: Avoids the public.public bug
-- ================================================================
-- This version doesn't use ALTER TABLE after creation
-- ================================================================

-- Step 1: Drop existing table
DROP TABLE IF EXISTS purchased_employees CASCADE;

-- Step 2: Create table (RLS will be disabled, we'll fix it later)
CREATE TABLE purchased_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR NOT NULL,
  name TEXT NOT NULL,
  role VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, employee_id)
);

-- Step 3: Create indexes (these don't have the bug)
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees(employee_id);

-- Step 4: Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- ================================================================
-- IMPORTANT: After this runs successfully, use the Visual Table Editor to:
-- 1. Go to Table Editor
-- 2. Click on purchased_employees table
-- 3. Click the settings icon (top right)
-- 4. Enable "Row Level Security"
-- 5. Then add policies manually through the UI
-- ================================================================

