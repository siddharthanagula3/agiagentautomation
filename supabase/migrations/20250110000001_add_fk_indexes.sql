-- Add covering indexes for all unindexed foreign keys
-- This addresses the Supabase Linter warning: unindexed_foreign_keys

-- Index for purchased_employees.user_id (FK to auth.users)
CREATE INDEX IF NOT EXISTS idx_purchased_employees_user_id 
ON purchased_employees (user_id);

-- Index for token_usage.user_id (FK to auth.users) 
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id 
ON token_usage (user_id);

-- Index for token_usage.llm_provider (if it references another table)
-- Note: This might not be needed if llm_provider is just a string enum
-- CREATE INDEX IF NOT EXISTS idx_token_usage_llm_provider 
-- ON token_usage (llm_provider);

-- Index for any other foreign keys that might exist
-- Add more as needed based on your schema

-- Note: Run this migration after creating the tables
-- This will improve query performance for joins and foreign key lookups
