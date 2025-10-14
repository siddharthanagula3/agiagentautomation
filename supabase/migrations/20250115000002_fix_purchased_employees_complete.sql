-- Complete Fix for Purchased Employees
-- This migration ensures the purchased_employees table works correctly with proper RLS

-- Drop and recreate the table to ensure clean structure
DROP TABLE IF EXISTS public.purchased_employees CASCADE;

-- Create the purchased_employees table with proper structure
CREATE TABLE public.purchased_employees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT true,
    purchased_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchased_employees_pkey PRIMARY KEY (id),
    CONSTRAINT purchased_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT purchased_employees_unique UNIQUE (user_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create indexes for performance
CREATE INDEX idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;
CREATE INDEX idx_purchased_employees_purchased_at ON public.purchased_employees(purchased_at DESC);

-- Grant permissions
GRANT ALL ON public.purchased_employees TO authenticated;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchased_employees_updated_at 
    BEFORE UPDATE ON public.purchased_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.purchased_employees IS 'AI employees purchased/hired by users';
COMMENT ON POLICY "purchased_employees_select_own" ON public.purchased_employees IS 'Users can only view their own purchased employees';
COMMENT ON POLICY "purchased_employees_insert_own" ON public.purchased_employees IS 'Users can only hire employees for themselves';
