-- ================================================================
-- Add Status Tracking to Purchased Employees
-- ================================================================
-- Adds status and last_activity columns to track real-time employee state
-- This enables persisting employee status across sessions
-- ================================================================

-- Add status column with default 'idle'
ALTER TABLE public.purchased_employees
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'idle'
CHECK (status IN ('idle', 'working', 'thinking'));

-- Add last_activity timestamp
ALTER TABLE public.purchased_employees
ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now();

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_purchased_employees_status
ON public.purchased_employees(status);

-- Create index on last_activity for recent activity queries
CREATE INDEX IF NOT EXISTS idx_purchased_employees_last_activity
ON public.purchased_employees(last_activity DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.purchased_employees.status IS 'Current employee status: idle, working, or thinking';
COMMENT ON COLUMN public.purchased_employees.last_activity IS 'Timestamp of last employee activity update';
