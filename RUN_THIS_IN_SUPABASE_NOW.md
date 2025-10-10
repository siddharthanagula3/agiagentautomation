# 🚨 URGENT: Run This SQL Script Now

## The "Failed to hire employee" error is because the database table doesn't exist yet.

### Steps to Fix (2 minutes):

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `agiagentautomation`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste This SQL**

```sql
-- ============================================
-- Free AI Employee Hiring System Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.purchased_employees CASCADE;

-- Create purchased_employees table for free hiring
CREATE TABLE public.purchased_employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT true,
    purchased_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, employee_id)
);

-- Create indexes for performance
CREATE INDEX idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure access
CREATE POLICY "Users can view their own hired employees"
    ON public.purchased_employees
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can hire employees (insert)"
    ON public.purchased_employees
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hired employees"
    ON public.purchased_employees
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hired employees"
    ON public.purchased_employees
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.purchased_employees TO authenticated;
GRANT ALL ON public.purchased_employees TO service_role;

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'purchased_employees'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Free hiring system setup complete!';
    RAISE NOTICE '👥 AI Employees can now be hired instantly for free';
    RAISE NOTICE '🔐 RLS policies enabled for secure access';
END $$;
```

4. **Click "Run" (or press F5)**

5. **Verify Success**
   - You should see a success message
   - Check the "Messages" tab for "✅ Free hiring system setup complete!"

6. **Refresh Your Marketplace Page**
   - Go back to your app
   - Try hiring an employee again
   - It should work now! 🎉

---

## What This Does

- Creates the `purchased_employees` table
- Sets up proper security (RLS policies)
- Adds performance indexes
- Enables free instant hiring

## After Running This

✅ Hiring will work instantly  
✅ No payment required  
✅ All employees are free  
✅ Only subscriptions (Pro/Max) cost money

---

**Time to fix**: ~2 minutes  
**Difficulty**: Copy & paste  
**Impact**: Fixes all hiring errors

