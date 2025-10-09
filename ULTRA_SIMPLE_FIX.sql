-- ================================================================
-- ULTRA SIMPLE: Just add the column, nothing else
-- ================================================================
-- This avoids ALL triggers, RLS policies, and schema issues
-- ================================================================

-- Step 1: Add column (bare minimum syntax)
ALTER TABLE purchased_employees ADD COLUMN name TEXT;

-- Step 2: Set values (simple UPDATE)
UPDATE purchased_employees SET name = role WHERE name IS NULL;

-- Step 3: Verify (just show the columns)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'purchased_employees' ORDER BY ordinal_position;

