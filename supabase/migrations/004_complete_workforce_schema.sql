-- ================================================
-- AI WORKFORCE PLATFORM - COMPLETE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. PURCHASED AI EMPLOYEES
-- ================================================
CREATE TABLE IF NOT EXISTS purchased_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) DEFAULT 1.00,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, employee_id)
);

CREATE INDEX idx_purchased_employees_user_id ON purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_active ON purchased_employees(user_id, is_active);

-- ================================================
-- 2. CHAT SESSIONS
-- ================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    provider VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(user_id, is_active);

-- ================================================
-- 3. CHAT MESSAGES
-- ================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(session_id, created_at);

-- ================================================
-- 4. WORKFORCE EXECUTIONS
-- ================================================
CREATE TABLE IF NOT EXISTS workforce_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    intent_type VARCHAR(50),
    domain VARCHAR(50),
    complexity VARCHAR(50),
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    estimated_time INTEGER,
    actual_time INTEGER,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4) DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workforce_executions_user_id ON workforce_executions(user_id);
CREATE INDEX idx_workforce_executions_status ON workforce_executions(status);
CREATE INDEX idx_workforce_executions_created_at ON workforce_executions(user_id, created_at DESC);

-- ================================================
-- 5. WORKFORCE TASKS
-- ================================================
CREATE TABLE IF NOT EXISTS workforce_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workforce_executions(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    domain VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20),
    complexity VARCHAR(50),
    assigned_agent VARCHAR(100),
    dependencies JSONB DEFAULT '[]'::jsonb,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    estimated_time INTEGER,
    actual_time INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workforce_tasks_execution_id ON workforce_tasks(execution_id);
CREATE INDEX idx_workforce_tasks_status ON workforce_tasks(execution_id, status);

-- ================================================
-- 6. API USAGE TRACKING
-- ================================================
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    operation_type VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    execution_id UUID REFERENCES workforce_executions(id) ON DELETE SET NULL,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);

-- ================================================
-- 7. USER SETTINGS (Enhanced)
-- ================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- AI Preferences
    default_provider VARCHAR(50) DEFAULT 'claude',
    auto_execute BOOLEAN DEFAULT false,
    max_cost_per_execution DECIMAL(10,2) DEFAULT 10.00,
    require_preview BOOLEAN DEFAULT true,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    execution_complete_email BOOLEAN DEFAULT true,
    execution_failed_email BOOLEAN DEFAULT true,
    weekly_summary_email BOOLEAN DEFAULT true,
    
    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ================================================
-- 8. BILLING & SUBSCRIPTIONS
-- ================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    included_tokens INTEGER DEFAULT 100000,
    used_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_customer_id);

-- ================================================
-- 9. BILLING INVOICES
-- ================================================
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_invoices_user_id ON billing_invoices(user_id);
CREATE INDEX idx_billing_invoices_status ON billing_invoices(status);

-- ================================================
-- 10. ANALYTICS & METRICS
-- ================================================
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Execution Metrics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Usage Metrics
    total_tokens_used INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- AI Employee Metrics
    active_employees INTEGER DEFAULT 0,
    
    -- Chat Metrics
    total_messages INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, metric_date)
);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(user_id, metric_date DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Purchased Employees Policies
CREATE POLICY "Users can view their own purchased employees"
    ON purchased_employees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased employees"
    ON purchased_employees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased employees"
    ON purchased_employees FOR UPDATE
    USING (auth.uid() = user_id);

-- Chat Sessions Policies
CREATE POLICY "Users can view their own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view messages from their sessions"
    ON chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages to their sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    ));

-- Workforce Executions Policies
CREATE POLICY "Users can view their own executions"
    ON workforce_executions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
    ON workforce_executions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions"
    ON workforce_executions FOR UPDATE
    USING (auth.uid() = user_id);

-- Workforce Tasks Policies
CREATE POLICY "Users can view tasks from their executions"
    ON workforce_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workforce_executions
        WHERE workforce_executions.id = workforce_tasks.execution_id
        AND workforce_executions.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert tasks to their executions"
    ON workforce_tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM workforce_executions
        WHERE workforce_executions.id = workforce_tasks.execution_id
        AND workforce_executions.user_id = auth.uid()
    ));

CREATE POLICY "Users can update tasks from their executions"
    ON workforce_tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM workforce_executions
        WHERE workforce_executions.id = workforce_tasks.execution_id
        AND workforce_executions.user_id = auth.uid()
    ));

-- API Usage Policies
CREATE POLICY "Users can view their own API usage"
    ON api_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage"
    ON api_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Billing Invoices Policies
CREATE POLICY "Users can view their own invoices"
    ON billing_invoices FOR SELECT
    USING (auth.uid() = user_id);

-- User Analytics Policies
CREATE POLICY "Users can view their own analytics"
    ON user_analytics FOR SELECT
    USING (auth.uid() = user_id);

-- ================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workforce_executions_updated_at BEFORE UPDATE ON workforce_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_message_at on chat_sessions when message is added
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_session_on_message AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_last_message();

-- Auto-create user settings on first login
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_settings_on_signup AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- Auto-create user subscription on first login
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_subscriptions (user_id, plan_type, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_subscription_on_signup AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0')
    INTO new_number;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoices
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- ================================================
-- VIEWS FOR ANALYTICS
-- ================================================

-- User Dashboard Stats View
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    user_id,
    COUNT(DISTINCT pe.id) as total_employees,
    COUNT(DISTINCT CASE WHEN pe.is_active THEN pe.id END) as active_employees,
    COUNT(DISTINCT we.id) as total_executions,
    COUNT(DISTINCT CASE WHEN we.status = 'running' THEN we.id END) as active_executions,
    COALESCE(SUM(CASE WHEN we.status = 'completed' THEN we.completed_tasks ELSE 0 END), 0) as total_completed_tasks,
    COALESCE(SUM(CASE WHEN we.status = 'completed' THEN we.failed_tasks ELSE 0 END), 0) as total_failed_tasks,
    COALESCE(SUM(we.actual_cost), 0) as total_spent,
    COUNT(DISTINCT cs.id) as total_chat_sessions,
    COUNT(DISTINCT CASE WHEN cs.is_active THEN cs.id END) as active_chat_sessions
FROM auth.users u
LEFT JOIN purchased_employees pe ON u.id = pe.user_id
LEFT JOIN workforce_executions we ON u.id = we.user_id
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
GROUP BY user_id;

-- Recent Activity View
CREATE OR REPLACE VIEW user_recent_activity AS
SELECT 
    'execution' as activity_type,
    we.id as activity_id,
    we.user_id,
    we.input_text as description,
    we.status,
    we.created_at
FROM workforce_executions we
UNION ALL
SELECT 
    'purchase' as activity_type,
    pe.id as activity_id,
    pe.user_id,
    'Hired ' || pe.name as description,
    'completed' as status,
    pe.purchased_at as created_at
FROM purchased_employees pe
UNION ALL
SELECT 
    'chat' as activity_type,
    cs.id as activity_id,
    cs.user_id,
    'Started chat: ' || cs.title as description,
    CASE WHEN cs.is_active THEN 'active' ELSE 'inactive' END as status,
    cs.created_at
FROM chat_sessions cs
ORDER BY created_at DESC;

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Uncomment to insert sample settings for existing users
-- INSERT INTO user_settings (user_id)
-- SELECT id FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- INSERT INTO user_subscriptions (user_id, plan_type, status)
-- SELECT id, 'free', 'active' FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Tables created: 10';
    RAISE NOTICE '🔒 RLS policies applied: All tables secured';
    RAISE NOTICE '⚡ Triggers created: Auto-updates enabled';
    RAISE NOTICE '📈 Views created: Analytics ready';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your AI Workforce Platform database is ready!';
END $$;
