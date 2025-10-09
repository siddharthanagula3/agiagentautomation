-- ================================================================
-- ALTERNATIVE METHOD: If the simple ALTER TABLE fails
-- ================================================================
-- This uses a transaction and explicit checking
-- ================================================================

BEGIN;

-- Check if column exists, add if not
DO $$ 
BEGIN
    -- Try to add the column
    BEGIN
        EXECUTE 'ALTER TABLE purchased_employees ADD COLUMN name TEXT';
        RAISE NOTICE 'Added name column successfully';
    EXCEPTION 
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column name already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error: %', SQLERRM;
    END;
END $$;

-- Set defaults
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL;

COMMIT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

