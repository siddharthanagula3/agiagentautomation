-- Final Fix for Purchased Employees Table
-- This migration adds the missing RLS policies and unique constraint

-- Enable RLS on purchased_employees (if not already enabled)
ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "purchased_employees_select_own" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_insert_own" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_update_own" ON public.purchased_employees;
DROP POLICY IF EXISTS "purchased_employees_delete_own" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can view their own hired employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can hire employees (insert)" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can update their own hired employees" ON public.purchased_employees;
DROP POLICY IF EXISTS "Users can delete their own hired employees" ON public.purchased_employees;

-- Create proper RLS policies
CREATE POLICY "purchased_employees_select_own" ON public.purchased_employees
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "purchased_employees_insert_own" ON public.purchased_employees
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "purchased_employees_update_own" ON public.purchased_employees
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "purchased_employees_delete_own" ON public.purchased_employees
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate hires
-- This will prevent the same user from hiring the same employee twice
ALTER TABLE public.purchased_employees 
ADD CONSTRAINT purchased_employees_unique UNIQUE (user_id, employee_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_purchased_employees_purchased_at ON public.purchased_employees(purchased_at DESC);

-- Grant necessary permissions
GRANT ALL ON public.purchased_employees TO authenticated;

-- Add trigger for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_purchased_employees_updated_at ON public.purchased_employees;
CREATE TRIGGER update_purchased_employees_updated_at 
    BEFORE UPDATE ON public.purchased_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.purchased_employees IS 'AI employees purchased/hired by users';
COMMENT ON POLICY "purchased_employees_select_own" ON public.purchased_employees IS 'Users can only view their own purchased employees';
COMMENT ON POLICY "purchased_employees_insert_own" ON public.purchased_employees IS 'Users can only hire employees for themselves';
COMMENT ON CONSTRAINT purchased_employees_unique ON public.purchased_employees IS 'Prevents duplicate hires of the same employee by the same user';
