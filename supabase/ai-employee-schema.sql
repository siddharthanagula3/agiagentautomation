-- AI Employee System Database Schema
-- This script creates the necessary tables and relationships for the AI employee system

-- ========================================
-- ENUMS
-- ========================================

-- Employee categories
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_category') THEN
        CREATE TYPE employee_category AS ENUM (
            'executive_leadership', 'engineering_technology', 'product_management',
            'design_ux', 'ai_data_science', 'it_security_ops', 'marketing_growth',
            'sales_business', 'customer_success', 'human_resources', 'finance_accounting',
            'legal_risk_compliance', 'specialized_niche'
        );
    END IF;
END $$;

-- Employee levels
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_level') THEN
        CREATE TYPE employee_level AS ENUM (
            'entry', 'junior', 'mid', 'senior', 'staff', 'principal',
            'distinguished', 'director', 'vp', 'c_level'
        );
    END IF;
END $$;

-- Employee status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
        CREATE TYPE employee_status AS ENUM (
            'available', 'working', 'busy', 'maintenance', 'training', 'offline'
        );
    END IF;
END $$;

-- Tool types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_type') THEN
        CREATE TYPE tool_type AS ENUM (
            'code_generation', 'data_analysis', 'api_integration', 'workflow_automation',
            'communication', 'research', 'design', 'testing', 'deployment', 'monitoring', 'custom'
        );
    END IF;
END $$;

-- Integration types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_type') THEN
        CREATE TYPE integration_type AS ENUM (
            'n8n_workflow', 'openai_api', 'anthropic_api', 'cursor_agent',
            'replit_agent', 'claude_code', 'custom_api', 'webhook', 'database', 'file_system'
        );
    END IF;
END $$;

-- Assignment status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM (
            'assigned', 'in_progress', 'completed', 'failed', 'cancelled', 'on_hold'
        );
    END IF;
END $$;

-- ========================================
-- TABLES
-- ========================================

-- AI Employees table
CREATE TABLE IF NOT EXISTS ai_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    category employee_category NOT NULL,
    department VARCHAR(255) NOT NULL,
    level employee_level NOT NULL,
    status employee_status DEFAULT 'available',
    capabilities JSONB DEFAULT '{}',
    system_prompt TEXT,
    tools JSONB DEFAULT '[]',
    workflows JSONB DEFAULT '[]',
    performance JSONB DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    cost JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- AI Tools table
CREATE TABLE IF NOT EXISTS ai_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type tool_type NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '[]',
    invocation_pattern TEXT,
    integration_type integration_type NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Assignments table (updated)
CREATE TABLE IF NOT EXISTS job_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status assignment_status DEFAULT 'assigned',
    priority INTEGER DEFAULT 1,
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    actual_duration INTEGER, -- in minutes
    tools_used JSONB DEFAULT '[]',
    workflows_executed JSONB DEFAULT '[]',
    performance JSONB DEFAULT '{}',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool Executions table
CREATE TABLE IF NOT EXISTS tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    parameters JSONB DEFAULT '{}',
    result JSONB,
    context JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER
);

-- Employee Performance History table
CREATE TABLE IF NOT EXISTS employee_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    performance_data JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
);

-- Employee Training Records table
CREATE TABLE IF NOT EXISTS employee_training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    training_type VARCHAR(255) NOT NULL,
    training_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress',
    performance_improvement JSONB DEFAULT '{}'
);

-- ========================================
-- INDEXES
-- ========================================

-- AI Employees indexes
CREATE INDEX IF NOT EXISTS idx_ai_employees_category ON ai_employees(category);
CREATE INDEX IF NOT EXISTS idx_ai_employees_status ON ai_employees(status);
CREATE INDEX IF NOT EXISTS idx_ai_employees_level ON ai_employees(level);
CREATE INDEX IF NOT EXISTS idx_ai_employees_department ON ai_employees(department);
CREATE INDEX IF NOT EXISTS idx_ai_employees_active ON ai_employees(is_active);

-- AI Tools indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_type ON ai_tools(type);
CREATE INDEX IF NOT EXISTS idx_ai_tools_integration_type ON ai_tools(integration_type);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON ai_tools(is_active);

-- Job Assignments indexes
CREATE INDEX IF NOT EXISTS idx_job_assignments_employee_id ON job_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_job_assignments_priority ON job_assignments(priority);

-- Tool Executions indexes
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_id ON tool_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_employee_id ON tool_executions(employee_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_job_id ON tool_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_executed_at ON tool_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_tool_executions_success ON tool_executions(success);

-- Performance History indexes
CREATE INDEX IF NOT EXISTS idx_employee_performance_history_employee_id ON employee_performance_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_history_recorded_at ON employee_performance_history(recorded_at);

-- Training Records indexes
CREATE INDEX IF NOT EXISTS idx_employee_training_records_employee_id ON employee_training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_records_status ON employee_training_records(status);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training_records ENABLE ROW LEVEL SECURITY;

-- AI Employees policies
DROP POLICY IF EXISTS "Users can view all employees" ON ai_employees;
CREATE POLICY "Users can view all employees" ON ai_employees FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage employees" ON ai_employees;
CREATE POLICY "Admins can manage employees" ON ai_employees FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- AI Tools policies
DROP POLICY IF EXISTS "Users can view all tools" ON ai_tools;
CREATE POLICY "Users can view all tools" ON ai_tools FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage tools" ON ai_tools;
CREATE POLICY "Admins can manage tools" ON ai_tools FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Job Assignments policies
DROP POLICY IF EXISTS "Users can view own assignments" ON job_assignments;
CREATE POLICY "Users can view own assignments" ON job_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage assignments" ON job_assignments;
CREATE POLICY "Admins can manage assignments" ON job_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Tool Executions policies
DROP POLICY IF EXISTS "Users can view own tool executions" ON tool_executions;
CREATE POLICY "Users can view own tool executions" ON tool_executions FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all tool executions" ON tool_executions;
CREATE POLICY "Admins can view all tool executions" ON tool_executions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Performance History policies
DROP POLICY IF EXISTS "Admins can view performance history" ON employee_performance_history;
CREATE POLICY "Admins can view performance history" ON employee_performance_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Training Records policies
DROP POLICY IF EXISTS "Admins can manage training records" ON employee_training_records;
CREATE POLICY "Admins can manage training records" ON employee_training_records FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to update employee performance
CREATE OR REPLACE FUNCTION update_employee_performance(
    employee_uuid UUID,
    performance_data JSONB
) RETURNS void AS $$
BEGIN
    UPDATE ai_employees
    SET performance = performance_data,
        updated_at = NOW()
    WHERE id = employee_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee statistics
CREATE OR REPLACE FUNCTION get_employee_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_employees', (SELECT COUNT(*) FROM ai_employees WHERE is_active = true),
        'available_employees', (SELECT COUNT(*) FROM ai_employees WHERE status = 'available' AND is_active = true),
        'working_employees', (SELECT COUNT(*) FROM ai_employees WHERE status = 'working' AND is_active = true),
        'total_tools', (SELECT COUNT(*) FROM ai_tools WHERE is_active = true),
        'active_assignments', (SELECT COUNT(*) FROM job_assignments WHERE status = 'in_progress'),
        'completed_assignments', (SELECT COUNT(*) FROM job_assignments WHERE status = 'completed'),
        'average_performance', (
            SELECT AVG((performance->>'efficiency')::numeric) 
            FROM ai_employees 
            WHERE is_active = true AND performance->>'efficiency' IS NOT NULL
        )
    ) INTO stats;
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to assign employee to job
CREATE OR REPLACE FUNCTION assign_employee_to_job(
    employee_uuid UUID,
    job_uuid UUID,
    priority_level INTEGER DEFAULT 1
) RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Create assignment
    INSERT INTO job_assignments (employee_id, job_id, priority)
    VALUES (employee_uuid, job_uuid, priority_level)
    RETURNING id INTO assignment_id;
    
    -- Update employee status
    UPDATE ai_employees
    SET status = 'working',
        updated_at = NOW()
    WHERE id = employee_uuid;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete job assignment
CREATE OR REPLACE FUNCTION complete_job_assignment(
    assignment_uuid UUID,
    performance_data JSONB DEFAULT '{}'
) RETURNS void AS $$
DECLARE
    employee_uuid UUID;
BEGIN
    -- Get employee ID
    SELECT employee_id INTO employee_uuid
    FROM job_assignments
    WHERE id = assignment_uuid;
    
    -- Update assignment
    UPDATE job_assignments
    SET status = 'completed',
        completed_at = NOW(),
        performance = performance_data,
        updated_at = NOW()
    WHERE id = assignment_uuid;
    
    -- Update employee status
    UPDATE ai_employees
    SET status = 'available',
        updated_at = NOW()
    WHERE id = employee_uuid;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_ai_employees_updated_at ON ai_employees;
CREATE TRIGGER update_ai_employees_updated_at 
    BEFORE UPDATE ON ai_employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_tools_updated_at ON ai_tools;
CREATE TRIGGER update_ai_tools_updated_at 
    BEFORE UPDATE ON ai_tools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_assignments_updated_at ON job_assignments;
CREATE TRIGGER update_job_assignments_updated_at 
    BEFORE UPDATE ON job_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert some sample AI employees
INSERT INTO ai_employees (name, role, category, department, level, status, capabilities, system_prompt, performance, cost) VALUES
('CEO Agent', 'Chief Executive Officer', 'executive_leadership', 'Executive', 'c_level', 'available', 
 '{"core_skills": ["Strategic Planning", "Leadership", "Decision Making"], "technical_skills": ["Business Strategy", "Financial Analysis"], "soft_skills": ["Communication", "Vision Setting"]}',
 'You are a Chief Executive Officer AI agent...',
 '{"efficiency": 95, "accuracy": 98, "speed": 90, "reliability": 97, "rating": 4.9, "total_tasks_completed": 0}',
 '{"hourly_rate": 500.00, "currency": "USD", "billing_model": "hourly"}'
),
('Senior Software Engineer', 'Senior Software Engineer', 'engineering_technology', 'Engineering', 'senior', 'available',
 '{"core_skills": ["JavaScript", "Python", "React", "Node.js"], "technical_skills": ["Full-stack Development", "Architecture Design"], "soft_skills": ["Code Review", "Mentoring"]}',
 'You are a Senior Software Engineer AI agent...',
 '{"efficiency": 95, "accuracy": 94, "speed": 88, "reliability": 96, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 120.00, "currency": "USD", "billing_model": "hourly"}'
),
('ML Engineer', 'Machine Learning Engineer', 'ai_data_science', 'AI/ML', 'senior', 'available',
 '{"core_skills": ["Python", "TensorFlow", "PyTorch", "MLOps"], "technical_skills": ["Model Development", "Data Pipeline"], "soft_skills": ["Research", "Analysis"]}',
 'You are a Machine Learning Engineer AI agent...',
 '{"efficiency": 95, "accuracy": 97, "speed": 85, "reliability": 94, "rating": 4.9, "total_tasks_completed": 0}',
 '{"hourly_rate": 150.00, "currency": "USD", "billing_model": "hourly"}'
)
ON CONFLICT (id) DO NOTHING;

-- Insert some sample tools
INSERT INTO ai_tools (name, type, description, integration_type, config, is_active) VALUES
('Code Generator', 'code_generation', 'Generates code based on requirements', 'openai_api', 
 '{"apiKey": "your-openai-key", "model": "gpt-4", "temperature": 0.7}', true),
('Data Analyzer', 'data_analysis', 'Analyzes data and generates insights', 'anthropic_api',
 '{"apiKey": "your-anthropic-key", "model": "claude-3-sonnet", "maxTokens": 1000}', true),
('N8N Workflow', 'workflow_automation', 'Executes N8N workflows', 'n8n_workflow',
 '{"n8nWorkflowId": "workflow-123", "n8nApiKey": "your-n8n-key", "n8nBaseUrl": "https://your-n8n.com"}', true)
ON CONFLICT (id) DO NOTHING;
