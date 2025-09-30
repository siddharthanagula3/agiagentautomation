-- ============================================
-- ANALYTICS & METRICS TABLES
-- Complete analytics system for tracking all metrics
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ANALYTICS METRICS TABLE
-- Stores aggregated metrics data
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    time_period VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_metrics_user ON analytics_metrics(user_id);
CREATE INDEX idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX idx_analytics_metrics_period ON analytics_metrics(period_start, period_end);
CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);

-- ============================================
-- 2. ANALYTICS EVENTS TABLE
-- Tracks individual user events and actions
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    employee_id VARCHAR(50),
    workflow_id UUID,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- ============================================
-- 3. PERFORMANCE METRICS TABLE
-- Stores system performance data
-- ============================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_category VARCHAR(50) NOT NULL, -- 'api', 'database', 'workflow', 'employee'
    metric_name VARCHAR(100) NOT NULL,
    response_time NUMERIC, -- in milliseconds
    success_rate NUMERIC, -- percentage
    error_count INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_category ON performance_metrics(metric_category);
CREATE INDEX idx_performance_metrics_measured ON performance_metrics(measured_at DESC);

-- ============================================
-- 4. COST TRACKING TABLE
-- Tracks costs across all services
-- ============================================
CREATE TABLE IF NOT EXISTS cost_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'ai_api', 'storage', 'bandwidth', 'compute'
    service_name VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'google', etc.
    cost_amount NUMERIC(10, 4) NOT NULL,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    usage_units VARCHAR(50), -- 'tokens', 'requests', 'GB', etc.
    usage_amount NUMERIC,
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_user ON cost_tracking(user_id);
CREATE INDEX idx_cost_tracking_service ON cost_tracking(service_type);
CREATE INDEX idx_cost_tracking_period ON cost_tracking(billing_period_start, billing_period_end);

-- ============================================
-- 5. DASHBOARD STATS VIEW
-- Pre-aggregated view for dashboard
-- ============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    pe.user_id,
    COUNT(DISTINCT pe.id) as total_employees,
    COUNT(DISTINCT CASE WHEN we.status = 'running' THEN we.id END) as active_executions,
    COUNT(DISTINCT CASE WHEN we.status = 'completed' THEN we.id END) as completed_executions,
    COUNT(DISTINCT CASE WHEN we.status = 'failed' THEN we.id END) as failed_executions,
    COALESCE(SUM(api.tokens_used), 0) as total_tokens_used,
    COALESCE(SUM(api.cost), 0) as total_cost,
    COALESCE(AVG(we.duration_minutes), 0) as avg_execution_time,
    CASE 
        WHEN COUNT(we.id) > 0 THEN
            (COUNT(CASE WHEN we.status = 'completed' THEN 1 END)::FLOAT / COUNT(we.id)::FLOAT * 100)
        ELSE 0
    END as success_rate
FROM purchased_employees pe
LEFT JOIN workforce_executions we ON we.user_id = pe.user_id
LEFT JOIN api_usage api ON api.user_id = pe.user_id
GROUP BY pe.user_id;

-- ============================================
-- 6. WORKFLOW ANALYTICS VIEW
-- Aggregated workflow performance
-- ============================================
CREATE OR REPLACE VIEW workflow_analytics AS
SELECT
    aw.user_id,
    aw.id as workflow_id,
    aw.name as workflow_name,
    aw.category,
    COUNT(ae.id) as total_executions,
    COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN ae.status = 'failed' THEN 1 END) as failed_executions,
    COALESCE(AVG(ae.duration_ms), 0) as avg_duration_ms,
    CASE 
        WHEN COUNT(ae.id) > 0 THEN
            (COUNT(CASE WHEN ae.status = 'completed' THEN 1 END)::FLOAT / COUNT(ae.id)::FLOAT * 100)
        ELSE 0
    END as success_rate,
    MAX(ae.executed_at) as last_executed_at
FROM automation_workflows aw
LEFT JOIN automation_executions ae ON ae.workflow_id = aw.id
GROUP BY aw.user_id, aw.id, aw.name, aw.category;

-- ============================================
-- 7. EMPLOYEE PERFORMANCE VIEW
-- AI Employee performance metrics
-- ============================================
CREATE OR REPLACE VIEW employee_performance AS
SELECT
    pe.user_id,
    pe.employee_id,
    pe.role,
    pe.provider,
    COUNT(wt.id) as total_tasks,
    COUNT(CASE WHEN wt.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN wt.status = 'failed' THEN 1 END) as failed_tasks,
    COALESCE(AVG(wt.duration_minutes), 0) as avg_task_duration,
    COALESCE(SUM(api.tokens_used), 0) as total_tokens_used,
    COALESCE(SUM(api.cost), 0) as total_cost,
    CASE 
        WHEN COUNT(wt.id) > 0 THEN
            (COUNT(CASE WHEN wt.status = 'completed' THEN 1 END)::FLOAT / COUNT(wt.id)::FLOAT * 100)
        ELSE 0
    END as success_rate
FROM purchased_employees pe
LEFT JOIN workforce_tasks wt ON wt.agent_id = pe.employee_id
LEFT JOIN api_usage api ON api.agent_id = pe.employee_id
GROUP BY pe.user_id, pe.employee_id, pe.role, pe.provider;

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics
CREATE POLICY "Users can view own analytics metrics" ON analytics_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics metrics" ON analytics_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own cost tracking" ON cost_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert cost tracking" ON cost_tracking
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get dashboard stats for a user
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_employees', COUNT(DISTINCT pe.id),
        'active_executions', COUNT(DISTINCT CASE WHEN we.status = 'running' THEN we.id END),
        'completed_executions', COUNT(DISTINCT CASE WHEN we.status = 'completed' THEN we.id END),
        'failed_executions', COUNT(DISTINCT CASE WHEN we.status = 'failed' THEN we.id END),
        'total_tokens_used', COALESCE(SUM(api.tokens_used), 0),
        'total_cost', COALESCE(SUM(api.cost), 0),
        'avg_execution_time', COALESCE(AVG(we.duration_minutes), 0),
        'success_rate', CASE 
            WHEN COUNT(we.id) > 0 THEN
                ROUND((COUNT(CASE WHEN we.status = 'completed' THEN 1 END)::NUMERIC / COUNT(we.id)::NUMERIC * 100), 2)
            ELSE 0
        END
    ) INTO result
    FROM purchased_employees pe
    LEFT JOIN workforce_executions we ON we.user_id = pe.user_id AND we.created_at > NOW() - INTERVAL '30 days'
    LEFT JOIN api_usage api ON api.user_id = pe.user_id AND api.created_at > NOW() - INTERVAL '30 days'
    WHERE pe.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record analytics event
CREATE OR REPLACE FUNCTION record_analytics_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_event_name VARCHAR,
    p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics_events (user_id, event_type, event_name, event_data)
    VALUES (p_user_id, p_event_type, p_event_name, p_event_data)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Analytics tables created successfully!';
    RAISE NOTICE 'Tables: analytics_metrics, analytics_events, performance_metrics, cost_tracking';
    RAISE NOTICE 'Views: dashboard_stats, workflow_analytics, employee_performance';
    RAISE NOTICE 'Functions: get_dashboard_stats, record_analytics_event';
END $$;
