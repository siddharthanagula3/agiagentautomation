-- ================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ================================================================
-- Go to: https://supabase.com/dashboard/project/lywdzvfibhzbljrgovwr/editor/sql
-- Click "New Query", paste this ENTIRE file, click "Run"
-- ================================================================

-- Step 1: Drop the table
DROP TABLE IF EXISTS purchased_employees CASCADE;

-- Step 2: Recreate with all correct columns
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

-- Step 3: Create indexes
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON purchased_employees(user_id, is_active) WHERE is_active = true;

-- Step 4: Enable RLS
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
CREATE POLICY "Users view own employees"
  ON purchased_employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service insert employees"
  ON purchased_employees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update own employees"
  ON purchased_employees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service update employees"
  ON purchased_employees FOR UPDATE
  USING (auth.role() = 'service_role');

-- Step 6: Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchased_employees'
ORDER BY ordinal_position;

