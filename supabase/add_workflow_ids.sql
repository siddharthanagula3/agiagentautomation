/**
 * Add Workflow IDs to AI Employees
 * Run this in Supabase SQL Editor to configure ChatKit workflows
 */

-- Step 1: Add workflow_id column to metadata (if not using JSONB)
-- If your metadata is already JSONB, skip this step

-- Step 2: Update employees with workflow IDs
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Replace workflow IDs with your actual Agent Builder workflow IDs

UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  CASE
    -- Data & Analytics Employees
    WHEN role LIKE '%Data%Analyst%' THEN '"flow_data_analyst_001"'::jsonb
    WHEN role LIKE '%Business%Intelligence%' THEN '"flow_bi_specialist_001"'::jsonb
    WHEN role LIKE '%Research%' THEN '"flow_research_analyst_001"'::jsonb
    
    -- Content & Creative Employees
    WHEN role LIKE '%Content%Writer%' THEN '"flow_content_writer_001"'::jsonb
    WHEN role LIKE '%Marketing%' THEN '"flow_marketing_specialist_001"'::jsonb
    WHEN role LIKE '%Social%Media%' THEN '"flow_social_media_manager_001"'::jsonb
    WHEN role LIKE '%Copywriter%' THEN '"flow_copywriter_001"'::jsonb
    
    -- Technical Employees
    WHEN role LIKE '%Developer%' OR role LIKE '%Engineer%' THEN '"flow_code_assistant_001"'::jsonb
    WHEN role LIKE '%DevOps%' THEN '"flow_devops_engineer_001"'::jsonb
    WHEN role LIKE '%QA%' OR role LIKE '%Testing%' THEN '"flow_qa_engineer_001"'::jsonb
    
    -- Customer Support Employees
    WHEN role LIKE '%Support%' OR role LIKE '%Service%' THEN '"flow_customer_support_001"'::jsonb
    WHEN role LIKE '%Success%' THEN '"flow_customer_success_001"'::jsonb
    
    -- Sales & Business Employees
    WHEN role LIKE '%Sales%' THEN '"flow_sales_rep_001"'::jsonb
    WHEN role LIKE '%Account%Manager%' THEN '"flow_account_manager_001"'::jsonb
    WHEN role LIKE '%Business%Development%' THEN '"flow_biz_dev_001"'::jsonb
    
    -- HR & Operations Employees
    WHEN role LIKE '%HR%' OR role LIKE '%Recruiter%' THEN '"flow_hr_specialist_001"'::jsonb
    WHEN role LIKE '%Project%Manager%' THEN '"flow_project_manager_001"'::jsonb
    WHEN role LIKE '%Operations%' THEN '"flow_operations_manager_001"'::jsonb
    
    -- Design Employees
    WHEN role LIKE '%Designer%' OR role LIKE '%UX%' OR role LIKE '%UI%' THEN '"flow_designer_001"'::jsonb
    
    -- Default for others
    ELSE '"flow_general_assistant_001"'::jsonb
  END
)
WHERE user_id = 'YOUR_USER_ID' -- Replace with your user ID
  AND status = 'active';

-- Step 3: Verify the updates
SELECT 
  id,
  name,
  role,
  metadata->>'workflow_id' as workflow_id,
  status
FROM purchased_employees
WHERE user_id = 'YOUR_USER_ID' -- Replace with your user ID
ORDER BY role;

-- Step 4: Update specific employee with custom workflow
-- Example: Update a specific employee
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  '"flow_custom_workflow_123"'::jsonb
)
WHERE id = 'SPECIFIC_EMPLOYEE_ID'
  AND user_id = 'YOUR_USER_ID';

-- Step 5: Set default workflow for employees without one
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  '"flow_default_001"'::jsonb
)
WHERE metadata->>'workflow_id' IS NULL
  AND user_id = 'YOUR_USER_ID'
  AND status = 'active';

-- Step 6: Create a view for easy workflow management (optional)
CREATE OR REPLACE VIEW employee_workflows AS
SELECT 
  pe.id,
  pe.user_id,
  pe.name,
  pe.role,
  pe.status,
  pe.metadata->>'workflow_id' as workflow_id,
  pe.capabilities,
  pe.created_at
FROM purchased_employees pe
WHERE pe.status = 'active'
ORDER BY pe.role, pe.name;

-- Step 7: Grant access to the view
GRANT SELECT ON employee_workflows TO authenticated;

-- Step 8: Check employees missing workflow IDs
SELECT 
  id,
  name,
  role,
  status,
  created_at
FROM purchased_employees
WHERE metadata->>'workflow_id' IS NULL
  AND status = 'active'
ORDER BY created_at DESC;

/**
 * WORKFLOW ID MAPPING GUIDE
 * 
 * Create these workflows in OpenAI Agent Builder:
 * https://platform.openai.com/agent-builder
 * 
 * WORKFLOW IDs FORMAT: flow_<category>_<number>
 * 
 * Categories:
 * - Data & Analytics: flow_data_analyst_001, flow_bi_specialist_001
 * - Content: flow_content_writer_001, flow_copywriter_001
 * - Technical: flow_code_assistant_001, flow_devops_engineer_001
 * - Support: flow_customer_support_001, flow_customer_success_001
 * - Sales: flow_sales_rep_001, flow_account_manager_001
 * - HR: flow_hr_specialist_001, flow_recruiter_001
 * - Operations: flow_project_manager_001, flow_operations_manager_001
 * - Design: flow_designer_001, flow_ux_specialist_001
 * - General: flow_general_assistant_001 (default fallback)
 * 
 * How to Create:
 * 1. Go to Agent Builder
 * 2. Click "Create New Workflow"
 * 3. Configure agent personality and capabilities
 * 4. Add tools (Code Interpreter, Web Search, etc.)
 * 5. Set system instructions
 * 6. Save and copy the workflow_id
 * 7. Use in the SQL above
 */

-- Step 9: Function to automatically assign workflow based on role (optional)
CREATE OR REPLACE FUNCTION assign_workflow_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if workflow_id is not set
  IF NEW.metadata->>'workflow_id' IS NULL THEN
    NEW.metadata = jsonb_set(
      COALESCE(NEW.metadata, '{}'::jsonb),
      '{workflow_id}',
      CASE
        WHEN NEW.role LIKE '%Data%Analyst%' THEN '"flow_data_analyst_001"'::jsonb
        WHEN NEW.role LIKE '%Content%Writer%' THEN '"flow_content_writer_001"'::jsonb
        WHEN NEW.role LIKE '%Developer%' THEN '"flow_code_assistant_001"'::jsonb
        WHEN NEW.role LIKE '%Support%' THEN '"flow_customer_support_001"'::jsonb
        ELSE '"flow_general_assistant_001"'::jsonb
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to auto-assign workflows
CREATE TRIGGER auto_assign_workflow
  BEFORE INSERT OR UPDATE ON purchased_employees
  FOR EACH ROW
  EXECUTE FUNCTION assign_workflow_id();

-- Cleanup (if needed)
-- DROP TRIGGER IF EXISTS auto_assign_workflow ON purchased_employees;
-- DROP FUNCTION IF EXISTS assign_workflow_id();
-- DROP VIEW IF EXISTS employee_workflows;

