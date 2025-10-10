-- ================================================================
-- CLEAN SLATE: Drop and recreate purchased_employees table
-- ================================================================
-- This fixes all schema issues by starting fresh
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the existing table (cascade removes all foreign keys)
DROP TABLE IF EXISTS purchased_employees CASCADE;

-- Recreate the table with ALL correct columns
CREATE TABLE purchased_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id character varying NOT NULL,
  name TEXT NOT NULL,                           -- ✅ NEW: Employee display name
  role character varying NOT NULL,
  provider character varying NOT NULL,
  is_active boolean DEFAULT true NOT NULL,      -- ✅ Employee active status
  purchased_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT purchased_employees_pkey PRIMARY KEY (id),
  CONSTRAINT purchased_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT purchased_employees_unique_user_employee UNIQUE (user_id, employee_id)
);

-- Create indexes for performance
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON purchased_employees(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own purchased employees"
  ON purchased_employees
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchased employees"
  ON purchased_employees
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own purchased employees"
  ON purchased_employees
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update any purchased employees"
  ON purchased_employees
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE purchased_employees IS 'Stores AI employees purchased by users';
COMMENT ON COLUMN purchased_employees.name IS 'Display name of the purchased AI employee';
COMMENT ON COLUMN purchased_employees.is_active IS 'Whether the employee is currently active';

