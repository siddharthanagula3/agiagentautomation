-- Complete AI Employee System Database Schema with MCP Integration
-- This script creates all necessary tables, relationships, and functions

-- ========================================
-- EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Payment status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
        );
    END IF;
END $$;

-- ========================================
-- CORE TABLES
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
    is_active BOOLEAN DEFAULT true,
    is_hired BOOLEAN DEFAULT false,
    hired_by UUID REFERENCES users(id) ON DELETE SET NULL,
    hired_at TIMESTAMP WITH TIME ZONE
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

-- MCP Tool Definitions
CREATE TABLE IF NOT EXISTS mcp_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    input_schema JSONB NOT NULL,
    handler_function TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Assignments table
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
    mcp_tool_id UUID REFERENCES mcp_tools(id) ON DELETE SET NULL,
    parameters JSONB DEFAULT '{}',
    result JSONB,
    context JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'text', -- text, tool_call, tool_result, system
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Employee Hires table
CREATE TABLE IF NOT EXISTS employee_hires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    hire_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status payment_status DEFAULT 'pending',
    payment_amount DECIMAL(10,2) DEFAULT 1.00,
    payment_currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Sessions table
CREATE TABLE IF NOT EXISTS employee_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    messages_count INTEGER DEFAULT 0,
    tools_used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_ai_employees_hired ON ai_employees(is_hired);
CREATE INDEX IF NOT EXISTS idx_ai_employees_hired_by ON ai_employees(hired_by);

-- AI Tools indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_type ON ai_tools(type);
CREATE INDEX IF NOT EXISTS idx_ai_tools_integration_type ON ai_tools(integration_type);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON ai_tools(is_active);

-- MCP Tools indexes
CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_active ON mcp_tools(is_active);

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
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_id ON tool_executions(user_id);

-- Chat Messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_employee_id ON chat_messages(employee_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Performance History indexes
CREATE INDEX IF NOT EXISTS idx_employee_performance_history_employee_id ON employee_performance_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_history_recorded_at ON employee_performance_history(recorded_at);

-- Training Records indexes
CREATE INDEX IF NOT EXISTS idx_employee_training_records_employee_id ON employee_training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_records_status ON employee_training_records(status);

-- Employee Hires indexes
CREATE INDEX IF NOT EXISTS idx_employee_hires_user_id ON employee_hires(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_hires_employee_id ON employee_hires(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_hires_payment_status ON employee_hires(payment_status);
CREATE INDEX IF NOT EXISTS idx_employee_hires_is_active ON employee_hires(is_active);

-- Employee Sessions indexes
CREATE INDEX IF NOT EXISTS idx_employee_sessions_user_id ON employee_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee_id ON employee_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_is_active ON employee_sessions(is_active);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_hires ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_sessions ENABLE ROW LEVEL SECURITY;

-- AI Employees policies
DROP POLICY IF EXISTS "Users can view all employees" ON ai_employees;
CREATE POLICY "Users can view all employees" ON ai_employees FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can hire employees" ON ai_employees;
CREATE POLICY "Users can hire employees" ON ai_employees FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    (is_hired = false OR hired_by = auth.uid())
);

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

-- MCP Tools policies
DROP POLICY IF EXISTS "Users can view MCP tools" ON mcp_tools;
CREATE POLICY "Users can view MCP tools" ON mcp_tools FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage MCP tools" ON mcp_tools;
CREATE POLICY "Admins can manage MCP tools" ON mcp_tools FOR ALL USING (
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
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all tool executions" ON tool_executions;
CREATE POLICY "Admins can view all tool executions" ON tool_executions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Chat Messages policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create chat messages" ON chat_messages;
CREATE POLICY "Users can create chat messages" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all chat messages" ON chat_messages;
CREATE POLICY "Admins can view all chat messages" ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Employee Hires policies
DROP POLICY IF EXISTS "Users can view own hires" ON employee_hires;
CREATE POLICY "Users can view own hires" ON employee_hires FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create hires" ON employee_hires;
CREATE POLICY "Users can create hires" ON employee_hires FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all hires" ON employee_hires;
CREATE POLICY "Admins can view all hires" ON employee_hires FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Employee Sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON employee_sessions;
CREATE POLICY "Users can view own sessions" ON employee_sessions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create sessions" ON employee_sessions;
CREATE POLICY "Users can create sessions" ON employee_sessions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all sessions" ON employee_sessions;
CREATE POLICY "Admins can view all sessions" ON employee_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to hire an AI employee
CREATE OR REPLACE FUNCTION hire_ai_employee(
    employee_uuid UUID,
    user_uuid UUID,
    payment_amount DECIMAL DEFAULT 1.00
) RETURNS UUID AS $$
DECLARE
    hire_id UUID;
BEGIN
    -- Check if employee is available
    IF NOT EXISTS (SELECT 1 FROM ai_employees WHERE id = employee_uuid AND is_hired = false) THEN
        RAISE EXCEPTION 'Employee is not available for hire';
    END IF;
    
    -- Create hire record
    INSERT INTO employee_hires (user_id, employee_id, payment_amount)
    VALUES (user_uuid, employee_uuid, payment_amount)
    RETURNING id INTO hire_id;
    
    -- Update employee status
    UPDATE ai_employees
    SET is_hired = true,
        hired_by = user_uuid,
        hired_at = NOW(),
        status = 'available'
    WHERE id = employee_uuid;
    
    RETURN hire_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start a chat session
CREATE OR REPLACE FUNCTION start_chat_session(
    employee_uuid UUID,
    user_uuid UUID
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Check if user has hired this employee
    IF NOT EXISTS (
        SELECT 1 FROM employee_hires 
        WHERE employee_id = employee_uuid 
        AND user_id = user_uuid 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User has not hired this employee';
    END IF;
    
    -- End any existing active session
    UPDATE employee_sessions
    SET is_active = false, session_end = NOW()
    WHERE user_id = user_uuid AND employee_id = employee_uuid AND is_active = true;
    
    -- Create new session
    INSERT INTO employee_sessions (user_id, employee_id)
    VALUES (user_uuid, employee_uuid)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log tool execution
CREATE OR REPLACE FUNCTION log_tool_execution(
    tool_name VARCHAR,
    employee_uuid UUID,
    user_uuid UUID,
    parameters JSONB,
    result JSONB,
    success BOOLEAN,
    error_msg TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    execution_id UUID;
    tool_id UUID;
BEGIN
    -- Get tool ID
    SELECT id INTO tool_id FROM ai_tools WHERE name = tool_name;
    IF tool_id IS NULL THEN
        SELECT id INTO tool_id FROM mcp_tools WHERE name = tool_name;
    END IF;
    
    -- Log execution
    INSERT INTO tool_executions (
        tool_id, employee_id, user_id, parameters, result, success, error_message
    ) VALUES (
        tool_id, employee_uuid, user_uuid, parameters, result, success, error_msg
    ) RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

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
    
    -- Log performance history
    INSERT INTO employee_performance_history (employee_id, performance_data)
    VALUES (employee_uuid, performance_data);
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
        'hired_employees', (SELECT COUNT(*) FROM ai_employees WHERE is_hired = true),
        'total_tools', (SELECT COUNT(*) FROM ai_tools WHERE is_active = true),
        'mcp_tools', (SELECT COUNT(*) FROM mcp_tools WHERE is_active = true),
        'active_assignments', (SELECT COUNT(*) FROM job_assignments WHERE status = 'in_progress'),
        'completed_assignments', (SELECT COUNT(*) FROM job_assignments WHERE status = 'completed'),
        'total_hires', (SELECT COUNT(*) FROM employee_hires WHERE is_active = true),
        'active_sessions', (SELECT COUNT(*) FROM employee_sessions WHERE is_active = true),
        'average_performance', (
            SELECT AVG((performance->>'efficiency')::numeric) 
            FROM ai_employees 
            WHERE is_active = true AND performance->>'efficiency' IS NOT NULL
        )
    ) INTO stats;
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's hired employees
CREATE OR REPLACE FUNCTION get_user_hired_employees(user_uuid UUID)
RETURNS TABLE (
    employee_id UUID,
    employee_name VARCHAR,
    employee_role VARCHAR,
    hire_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.role,
        h.hire_date,
        h.is_active
    FROM ai_employees e
    JOIN employee_hires h ON e.id = h.employee_id
    WHERE h.user_id = user_uuid
    ORDER BY h.hire_date DESC;
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

DROP TRIGGER IF EXISTS update_mcp_tools_updated_at ON mcp_tools;
CREATE TRIGGER update_mcp_tools_updated_at 
    BEFORE UPDATE ON mcp_tools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_assignments_updated_at ON job_assignments;
CREATE TRIGGER update_job_assignments_updated_at 
    BEFORE UPDATE ON job_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert comprehensive AI employees data
INSERT INTO ai_employees (name, role, category, department, level, status, capabilities, system_prompt, performance, cost) VALUES

-- 👑 Executive Leadership
('CEO Agent', 'Chief Executive Officer', 'executive_leadership', 'Executive', 'c_level', 'available', 
 '{"core_skills": ["Strategic Planning", "Leadership", "Decision Making", "Vision Setting", "Stakeholder Management"], "technical_skills": ["Business Strategy", "Financial Analysis", "Market Analysis"], "soft_skills": ["Communication", "Vision Setting", "Inspiration"]}',
 'You are a Chief Executive Officer (CEO) with 15+ years of executive leadership experience. You are a visionary leader who excels at strategic planning, executive decision-making, and organizational transformation.',
 '{"efficiency": 95, "accuracy": 98, "speed": 90, "reliability": 97, "rating": 4.9, "total_tasks_completed": 0}',
 '{"hourly_rate": 500.00, "currency": "USD", "billing_model": "hourly"}'
),

('CTO Agent', 'Chief Technology Officer', 'executive_leadership', 'Technology', 'c_level', 'available',
 '{"core_skills": ["Technology Strategy", "Innovation", "Architecture", "Team Leadership", "Technical Vision"], "technical_skills": ["System Architecture", "Technology Assessment", "R&D Management"], "soft_skills": ["Leadership", "Innovation", "Technical Communication"]}',
 'You are a Chief Technology Officer (CTO) with 12+ years of technology leadership experience. You are an innovative leader who excels at technology strategy, innovation, and technical architecture decisions.',
 '{"efficiency": 96, "accuracy": 97, "speed": 89, "reliability": 95, "rating": 4.9, "total_tasks_completed": 0}',
 '{"hourly_rate": 450.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 💻 Engineering & Technology
('Senior Software Engineer', 'Senior Software Engineer', 'engineering_technology', 'Engineering', 'senior', 'available',
 '{"core_skills": ["JavaScript", "Python", "React", "Node.js", "Architecture"], "technical_skills": ["Full-stack Development", "Code Review", "System Design"], "soft_skills": ["Mentoring", "Code Review", "Technical Communication"]}',
 'You are a Senior Software Engineer with 8+ years of software development experience. You are a technical expert who excels at full-stack development, code architecture, and technical mentoring.',
 '{"efficiency": 95, "accuracy": 94, "speed": 88, "reliability": 96, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 120.00, "currency": "USD", "billing_model": "hourly"}'
),

('DevOps Engineer', 'DevOps Engineer', 'engineering_technology', 'Engineering', 'senior', 'available',
 '{"core_skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Monitoring"], "technical_skills": ["Infrastructure as Code", "Automation", "System Reliability"], "soft_skills": ["Problem Solving", "System Thinking", "Collaboration"]}',
 'You are a DevOps Engineer with 6+ years of DevOps and infrastructure experience. You are a systematic expert who excels at infrastructure automation, CI/CD pipelines, and system reliability.',
 '{"efficiency": 96, "accuracy": 93, "speed": 85, "reliability": 98, "rating": 4.7, "total_tasks_completed": 0}',
 '{"hourly_rate": 130.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 🧠 AI, Data Science & Analytics
('ML Engineer', 'Machine Learning Engineer', 'ai_data_science', 'AI/ML', 'senior', 'available',
 '{"core_skills": ["Python", "TensorFlow", "PyTorch", "MLOps", "Statistics"], "technical_skills": ["Model Development", "Data Pipeline", "Model Deployment"], "soft_skills": ["Research", "Analysis", "Innovation"]}',
 'You are a Machine Learning Engineer with 7+ years of ML and AI development experience. You are an analytical expert who excels at ML model development, deployment, and AI system architecture.',
 '{"efficiency": 95, "accuracy": 97, "speed": 85, "reliability": 94, "rating": 4.9, "total_tasks_completed": 0}',
 '{"hourly_rate": 150.00, "currency": "USD", "billing_model": "hourly"}'
),

('Data Scientist', 'Data Scientist', 'ai_data_science', 'Data Science', 'senior', 'available',
 '{"core_skills": ["Python", "R", "Statistics", "Machine Learning", "SQL"], "technical_skills": ["Data Analysis", "Statistical Modeling", "Visualization"], "soft_skills": ["Research", "Analysis", "Communication"]}',
 'You are a Data Scientist with 6+ years of data science and analytics experience. You are an analytical expert who excels at data analysis, statistical modeling, and business intelligence.',
 '{"efficiency": 94, "accuracy": 96, "speed": 88, "reliability": 93, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 140.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 📦 Product Management
('Product Manager', 'Product Manager', 'product_management', 'Product', 'senior', 'available',
 '{"core_skills": ["Product Strategy", "Roadmapping", "Analytics", "User Research", "Stakeholder Management"], "technical_skills": ["Product Analytics", "User Research", "Market Analysis"], "soft_skills": ["Communication", "Leadership", "Strategic Thinking"]}',
 'You are a Product Manager with 8+ years of product management experience. You are a strategic leader who excels at product strategy, stakeholder management, and user-focused development.',
 '{"efficiency": 94, "accuracy": 92, "speed": 89, "reliability": 93, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 110.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 🎨 Design & User Experience
('UX Designer', 'UX Designer', 'design_ux', 'Design', 'senior', 'available',
 '{"core_skills": ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Design Systems"], "technical_skills": ["Figma", "Sketch", "User Research", "Prototyping"], "soft_skills": ["Empathy", "Creativity", "User Advocacy"]}',
 'You are a UX Designer with 6+ years of UX design experience. You are a user-focused expert who excels at user research, wireframing, and creating intuitive user experiences.',
 '{"efficiency": 94, "accuracy": 93, "speed": 88, "reliability": 92, "rating": 4.7, "total_tasks_completed": 0}',
 '{"hourly_rate": 100.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 📈 Marketing & Growth
('Digital Marketing Manager', 'Digital Marketing Manager', 'marketing_growth', 'Marketing', 'senior', 'available',
 '{"core_skills": ["Digital Marketing", "SEO", "SEM", "Social Media", "Analytics"], "technical_skills": ["Marketing Automation", "Analytics", "Campaign Management"], "soft_skills": ["Creativity", "Communication", "Growth Mindset"]}',
 'You are a Digital Marketing Manager with 7+ years of digital marketing experience. You are a creative and data-driven expert who excels at digital marketing strategy, campaign management, and growth optimization.',
 '{"efficiency": 92, "accuracy": 91, "speed": 89, "reliability": 93, "rating": 4.6, "total_tasks_completed": 0}',
 '{"hourly_rate": 90.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 🚀 Sales & Business Development
('Enterprise Sales', 'Enterprise Account Executive', 'sales_business', 'Sales', 'senior', 'available',
 '{"core_skills": ["Enterprise Sales", "Relationship Building", "Negotiation", "CRM", "Account Management"], "technical_skills": ["Sales Analytics", "CRM Management", "Sales Automation"], "soft_skills": ["Communication", "Relationship Building", "Persuasion"]}',
 'You are an Enterprise Account Executive with 8+ years of enterprise sales experience. You are a relationship-focused expert who excels at enterprise sales, relationship management, and complex deal closure.',
 '{"efficiency": 93, "accuracy": 94, "speed": 87, "reliability": 95, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 120.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 😊 Customer Success & Support
('Customer Success Manager', 'Customer Success Manager', 'customer_success', 'Customer Success', 'senior', 'available',
 '{"core_skills": ["Customer Success", "Retention", "Onboarding", "Support", "Relationship Management"], "technical_skills": ["Customer Analytics", "Support Tools", "CRM Management"], "soft_skills": ["Empathy", "Communication", "Problem Solving"]}',
 'You are a Customer Success Manager with 6+ years of customer success experience. You are a customer-focused expert who excels at customer success, retention, and relationship management.',
 '{"efficiency": 94, "accuracy": 92, "speed": 90, "reliability": 95, "rating": 4.7, "total_tasks_completed": 0}',
 '{"hourly_rate": 85.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 👥 Human Resources
('HR Business Partner', 'HR Business Partner', 'human_resources', 'Human Resources', 'senior', 'available',
 '{"core_skills": ["HR Strategy", "Employee Relations", "Talent Management", "Compliance", "Organizational Development"], "technical_skills": ["HRIS", "Talent Analytics", "Compliance Management"], "soft_skills": ["Empathy", "Communication", "Leadership"]}',
 'You are an HR Business Partner with 7+ years of HR experience. You are a people-focused expert who excels at HR strategy, employee relations, and organizational development.',
 '{"efficiency": 91, "accuracy": 93, "speed": 87, "reliability": 92, "rating": 4.6, "total_tasks_completed": 0}',
 '{"hourly_rate": 95.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 💰 Finance & Accounting
('Financial Analyst', 'Financial Analyst', 'finance_accounting', 'Finance', 'senior', 'available',
 '{"core_skills": ["Financial Analysis", "Reporting", "Budgeting", "Forecasting", "Excel"], "technical_skills": ["Financial Modeling", "Data Analysis", "Reporting Tools"], "soft_skills": ["Analytical Thinking", "Attention to Detail", "Communication"]}',
 'You are a Financial Analyst with 6+ years of financial analysis experience. You are an analytical expert who excels at financial analysis, reporting, and investment decision support.',
 '{"efficiency": 93, "accuracy": 96, "speed": 89, "reliability": 94, "rating": 4.7, "total_tasks_completed": 0}',
 '{"hourly_rate": 90.00, "currency": "USD", "billing_model": "hourly"}'
),

-- ⚖️ Legal, Risk & Compliance
('Corporate Lawyer', 'Corporate Lawyer', 'legal_risk_compliance', 'Legal', 'senior', 'available',
 '{"core_skills": ["Corporate Law", "Contracts", "Compliance", "Risk Management", "Legal Research"], "technical_skills": ["Legal Research", "Contract Analysis", "Compliance Monitoring"], "soft_skills": ["Attention to Detail", "Communication", "Critical Thinking"]}',
 'You are a Corporate Lawyer with 10+ years of corporate law experience. You are a legal expert who excels at corporate law, contracts, compliance, and legal risk management.',
 '{"efficiency": 90, "accuracy": 98, "speed": 85, "reliability": 97, "rating": 4.8, "total_tasks_completed": 0}',
 '{"hourly_rate": 180.00, "currency": "USD", "billing_model": "hourly"}'
),

-- 🔬 Specialized & Niche
('Innovation Lab Manager', 'Innovation Lab Manager', 'specialized_niche', 'Innovation', 'senior', 'available',
 '{"core_skills": ["Innovation", "R&D", "Technology Scouting", "Project Management", "Strategy"], "technical_skills": ["Research Management", "Technology Assessment", "Innovation Metrics"], "soft_skills": ["Creativity", "Strategic Thinking", "Leadership"]}',
 'You are an Innovation Lab Manager with 8+ years of innovation and R&D experience. You are a creative and strategic expert who excels at innovation management, R&D coordination, and emerging technology exploration.',
 '{"efficiency": 92, "accuracy": 90, "speed": 88, "reliability": 91, "rating": 4.7, "total_tasks_completed": 0}',
 '{"hourly_rate": 130.00, "currency": "USD", "billing_model": "hourly"}'
)

ON CONFLICT (id) DO NOTHING;

-- Insert MCP tools
INSERT INTO mcp_tools (name, description, input_schema, handler_function, is_active) VALUES
('generate_react_component', 'Generate a React component with TypeScript and Tailwind CSS', 
 '{"type": "object", "properties": {"componentName": {"type": "string"}, "props": {"type": "array"}, "features": {"type": "array"}, "styling": {"type": "string"}}, "required": ["componentName"]}',
 'generateReactComponent', true),

('generate_api_endpoint', 'Generate a REST API endpoint with Express.js',
 '{"type": "object", "properties": {"endpointPath": {"type": "string"}, "httpMethod": {"type": "string"}, "framework": {"type": "string"}, "database": {"type": "string"}}, "required": ["endpointPath", "httpMethod"]}',
 'generateApiEndpoint', true),

('analyze_data', 'Analyze data and generate insights',
 '{"type": "object", "properties": {"data": {"type": "string"}, "analysisType": {"type": "string"}, "outputFormat": {"type": "string"}}, "required": ["data"]}',
 'analyzeData', true),

('generate_content', 'Generate marketing content',
 '{"type": "object", "properties": {"contentType": {"type": "string"}, "topic": {"type": "string"}, "tone": {"type": "string"}, "length": {"type": "string"}}, "required": ["contentType", "topic"]}',
 'generateContent', true)

ON CONFLICT (name) DO NOTHING;
