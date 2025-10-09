-- ================================================================
-- SIMPLEST POSSIBLE: Just add the name column
-- ================================================================
-- Since you cleared the data, we don't need to update anything!
-- ================================================================

ALTER TABLE purchased_employees ADD COLUMN name TEXT;

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_employees' 
ORDER BY ordinal_position;

