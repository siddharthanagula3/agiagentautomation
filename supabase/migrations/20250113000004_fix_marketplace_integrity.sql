-- =============================================
-- Marketplace Data Integrity Migration
-- Created: 2025-01-13
-- Purpose: Add foreign key constraints and data validation
-- Impact: Prevents orphaned records, ensures referential integrity
-- =============================================

-- =============================================
-- 1. ADD EMPLOYEE_ID TO AI_EMPLOYEES
-- =============================================

-- Add employee_id column if it doesn't exist
ALTER TABLE public.ai_employees
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Generate employee IDs from existing data
UPDATE public.ai_employees
SET employee_id = LOWER(REGEXP_REPLACE(
  name || '-' || COALESCE(role, 'employee'),
  '[^a-zA-Z0-9-]',
  '',
  'g'
))
WHERE employee_id IS NULL;

-- Make employee_id unique and not null
ALTER TABLE public.ai_employees
ADD CONSTRAINT ai_employees_employee_id_unique
UNIQUE (employee_id);

ALTER TABLE public.ai_employees
ALTER COLUMN employee_id SET NOT NULL;

-- =============================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- =============================================

-- First, clean up any orphaned records
-- (purchased_employees referencing non-existent ai_employees)
DELETE FROM public.purchased_employees
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_employees
  WHERE ai_employees.employee_id = purchased_employees.employee_id
);

-- Now add the foreign key constraint
ALTER TABLE public.purchased_employees
ADD CONSTRAINT purchased_employees_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES public.ai_employees(employee_id)
ON DELETE RESTRICT;  -- Prevent deletion of employees that are hired

-- =============================================
-- 3. ADD CHECK CONSTRAINTS FOR DATA VALIDATION
-- =============================================

-- Ensure purchased_at is not in the future
ALTER TABLE public.purchased_employees
ADD CONSTRAINT purchased_employees_purchased_at_valid
CHECK (purchased_at <= NOW());

-- Ensure updated_at >= created_at
ALTER TABLE public.purchased_employees
ADD CONSTRAINT purchased_employees_dates_valid
CHECK (updated_at >= created_at);

-- Ensure employee names are not empty
ALTER TABLE public.ai_employees
ADD CONSTRAINT ai_employees_name_not_empty
CHECK (LENGTH(TRIM(name)) > 0);

-- Ensure roles are not empty
ALTER TABLE public.ai_employees
ADD CONSTRAINT ai_employees_role_not_empty
CHECK (LENGTH(TRIM(role)) > 0);

-- =============================================
-- 4. ADD INDEXES FOR FOREIGN KEY LOOKUPS
-- =============================================

-- Index on ai_employees.employee_id (already unique, but add explicit index)
CREATE INDEX IF NOT EXISTS idx_ai_employees_employee_id
  ON public.ai_employees(employee_id);

-- Composite index for common marketplace queries
CREATE INDEX IF NOT EXISTS idx_ai_employees_category_status
  ON public.ai_employees(category, status)
  WHERE status = 'active';

-- =============================================
-- 5. ADD DATA CONSISTENCY TRIGGERS
-- =============================================

-- Trigger to prevent updates that would orphan purchased_employees
CREATE OR REPLACE FUNCTION prevent_employee_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.employee_id IS DISTINCT FROM NEW.employee_id THEN
    -- Check if this employee is already purchased
    IF EXISTS (
      SELECT 1 FROM public.purchased_employees
      WHERE employee_id = OLD.employee_id
    ) THEN
      RAISE EXCEPTION 'Cannot change employee_id for hired employees. Current: %, New: %',
        OLD.employee_id, NEW.employee_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_employee_id_change_trigger
  BEFORE UPDATE ON public.ai_employees
  FOR EACH ROW
  EXECUTE FUNCTION prevent_employee_id_change();

-- =============================================
-- 6. ADD CASCADE UPDATE FOR NAMES
-- =============================================

-- When employee name/role changes, sync to purchased_employees
CREATE OR REPLACE FUNCTION sync_employee_details()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name OR
     OLD.role IS DISTINCT FROM NEW.role THEN

    UPDATE public.purchased_employees
    SET
      name = NEW.name,
      role = NEW.role,
      updated_at = NOW()
    WHERE employee_id = NEW.employee_id;

    -- Log the sync operation
    RAISE NOTICE 'Synced % purchased records for employee %',
      (SELECT COUNT(*) FROM public.purchased_employees WHERE employee_id = NEW.employee_id),
      NEW.employee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_employee_details_trigger
  AFTER UPDATE ON public.ai_employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_details();

-- =============================================
-- 7. ADD AUDIT TABLE FOR EMPLOYEE CHANGES
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_employees_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_ai_employees_audit_employee_date
  ON public.ai_employees_audit(employee_id, changed_at DESC);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.ai_employees_audit (
      employee_id,
      action,
      old_data,
      changed_at
    ) VALUES (
      OLD.employee_id,
      'deleted',
      row_to_json(OLD),
      NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.ai_employees_audit (
      employee_id,
      action,
      old_data,
      new_data,
      changed_at
    ) VALUES (
      NEW.employee_id,
      'updated',
      row_to_json(OLD),
      row_to_json(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.ai_employees_audit (
      employee_id,
      action,
      new_data,
      changed_at
    ) VALUES (
      NEW.employee_id,
      'created',
      row_to_json(NEW),
      NOW()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_employee_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_employees
  FOR EACH ROW
  EXECUTE FUNCTION audit_employee_changes();

-- =============================================
-- 8. ENABLE RLS ON AUDIT TABLE
-- =============================================

ALTER TABLE public.ai_employees_audit ENABLE ROW LEVEL SECURITY;

-- Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.ai_employees_audit
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles
      WHERE role = 'admin'
    )
  );

-- =============================================
-- 9. VERIFICATION QUERIES
-- =============================================

-- Verify no orphaned records
COMMENT ON TABLE public.purchased_employees IS
  'Verification: SELECT COUNT(*) FROM purchased_employees p LEFT JOIN ai_employees e ON p.employee_id = e.employee_id WHERE e.employee_id IS NULL; -- Should return 0';

-- Verify all employees have valid IDs
COMMENT ON COLUMN public.ai_employees.employee_id IS
  'Format: lowercase-with-dashes, derived from name-role';

-- =============================================
-- 10. MAINTENANCE
-- =============================================

-- Update statistics
ANALYZE public.ai_employees;
ANALYZE public.purchased_employees;
ANALYZE public.ai_employees_audit;

-- =============================================
-- ROLLBACK (if needed)
-- =============================================

-- To rollback:
-- DROP TRIGGER IF EXISTS prevent_employee_id_change_trigger ON public.ai_employees CASCADE;
-- DROP TRIGGER IF EXISTS sync_employee_details_trigger ON public.ai_employees CASCADE;
-- DROP TRIGGER IF EXISTS audit_employee_changes_trigger ON public.ai_employees CASCADE;
-- DROP FUNCTION IF EXISTS prevent_employee_id_change CASCADE;
-- DROP FUNCTION IF EXISTS sync_employee_details CASCADE;
-- DROP FUNCTION IF EXISTS audit_employee_changes CASCADE;
-- DROP TABLE IF EXISTS public.ai_employees_audit CASCADE;
-- ALTER TABLE public.purchased_employees DROP CONSTRAINT IF EXISTS purchased_employees_employee_id_fkey CASCADE;
-- ALTER TABLE public.ai_employees DROP CONSTRAINT IF EXISTS ai_employees_employee_id_unique CASCADE;
-- ALTER TABLE public.ai_employees DROP COLUMN IF EXISTS employee_id CASCADE;

-- =============================================
-- END OF MIGRATION
-- =============================================
