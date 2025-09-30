-- ============================================
-- AUTOMATION & WORKFLOW TABLES
-- Complete automation system for workflow management
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AUTOMATION WORKFLOWS TABLE
-- Stores workflow configurations
-- ============================================
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'data_processing', 'communication', 'deployment', 'monitoring'
    trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'webhook', 'event'
    trigger_config JSONB DEFAULT '{}',
    workflow_config JSONB NOT NULL, -- Node-based workflow configuration
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_automation_workflows_user ON automation_workflows(user_id);
CREATE INDEX idx_automation_workflows_category ON automation_workflows(category);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_automation_workflows_tags ON automation_workflows USING GIN(tags);

-- ============================================
-- 2. AUTOMATION EXECUTIONS TABLE
-- Tracks workflow execution history
-- ============================================
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    trigger_source VARCHAR(50), -- 'manual', 'schedule', 'webhook', 'api'
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    error_stack TEXT,
    execution_log TEXT[],
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_executions_user ON automation_executions(user_id);
CREATE INDEX idx_automation_executions_workflow ON automation_executions(workflow_id);
CREATE INDEX idx_automation_executions_status ON automation_executions(status);
CREATE INDEX idx_automation_executions_created ON automation_executions(created_at DESC);

-- ============================================
-- 3. AUTOMATION NODES TABLE
-- Stores individual nodes in workflows
-- ============================================
CREATE TABLE IF NOT EXISTS automation_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- Unique within workflow
    node_type VARCHAR(50) NOT NULL, -- 'trigger', 'action', 'condition', 'loop', 'ai_task'
    node_config JSONB NOT NULL,
    position_x NUMERIC,
    position_y NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, node_id)
);

CREATE INDEX idx_automation_nodes_workflow ON automation_nodes(workflow_id);

-- ============================================
-- 4. AUTOMATION CONNECTIONS TABLE
-- Stores connections between nodes
-- ============================================
CREATE TABLE IF NOT EXISTS automation_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    connection_type VARCHAR(20) DEFAULT 'flow', -- 'flow', 'condition_true', 'condition_false'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automation_connections_workflow ON automation_connections(workflow_id);

-- ============================================
-- 5. WEBHOOK CONFIGS TABLE
-- Stores webhook configurations
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL UNIQUE,
    webhook_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    allowed_methods TEXT[] DEFAULT ARRAY['POST'],
    headers_config JSONB DEFAULT '{}',
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    total_triggers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_configs_user ON webhook_configs(user_id);
CREATE INDEX idx_webhook_configs_workflow ON webhook_configs(workflow_id);
CREATE INDEX idx_webhook_configs_url ON webhook_configs(webhook_url);

-- ============================================
-- 6. SCHEDULED TASKS TABLE
-- Stores scheduled task configurations
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    total_runs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_tasks_user ON scheduled_tasks(user_id);
CREATE INDEX idx_scheduled_tasks_workflow ON scheduled_tasks(workflow_id);
CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at);

-- ============================================
-- 7. INTEGRATION CONFIGS TABLE
-- Stores integration settings
-- ============================================
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'slack', 'github', 'n8n', 'zapier', etc.
    integration_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    credentials JSONB, -- Encrypted credentials
    settings JSONB DEFAULT '{}',
    rate_limit INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_configs_user ON integration_configs(user_id);
CREATE INDEX idx_integration_configs_type ON integration_configs(integration_type);

-- ============================================
-- 8. CACHE ENTRIES TABLE
-- Stores cached data for performance
-- ============================================
CREATE TABLE IF NOT EXISTS cache_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires ON cache_entries(expires_at);

-- ============================================
-- 9. API RATE LIMITS TABLE
-- Tracks API rate limit usage
-- ============================================
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 0,
    limit_per_hour INTEGER NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_rate_limits_user ON api_rate_limits(user_id);
CREATE INDEX idx_api_rate_limits_endpoint ON api_rate_limits(api_endpoint);
CREATE INDEX idx_api_rate_limits_window ON api_rate_limits(window_start, window_end);

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies for automation_workflows
CREATE POLICY "Users can view own workflows" ON automation_workflows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows" ON automation_workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON automation_workflows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows" ON automation_workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for automation_executions
CREATE POLICY "Users can view own executions" ON automation_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert executions" ON automation_executions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own executions" ON automation_executions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for other tables
CREATE POLICY "Users can manage own webhook configs" ON webhook_configs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scheduled tasks" ON scheduled_tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integration configs" ON integration_configs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Cache is accessible to all" ON cache_entries
    FOR SELECT USING (true);

CREATE POLICY "System can manage cache" ON cache_entries
    FOR ALL USING (true);

CREATE POLICY "Users can view own rate limits" ON api_rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON api_rate_limits
    FOR ALL USING (true);

-- ============================================
-- 11. TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Update timestamp on workflow update
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_timestamp
    BEFORE UPDATE ON automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_timestamp();

-- Update execution duration
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_execution_duration
    BEFORE UPDATE ON automation_executions
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION calculate_execution_duration();

-- Clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. HELPER FUNCTIONS
-- ============================================

-- Get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_stats(workflow_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_executions', COUNT(*),
        'successful_executions', COUNT(CASE WHEN status = 'completed' THEN 1 END),
        'failed_executions', COUNT(CASE WHEN status = 'failed' THEN 1 END),
        'avg_duration_ms', COALESCE(AVG(duration_ms), 0),
        'success_rate', CASE 
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100), 2)
            ELSE 0
        END,
        'last_execution_at', MAX(executed_at)
    ) INTO result
    FROM automation_executions
    WHERE workflow_id = workflow_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's automation overview
CREATE OR REPLACE FUNCTION get_automation_overview(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_workflows', COUNT(DISTINCT aw.id),
        'active_workflows', COUNT(DISTINCT CASE WHEN aw.is_active THEN aw.id END),
        'total_executions', COUNT(ae.id),
        'running_executions', COUNT(CASE WHEN ae.status = 'running' THEN 1 END),
        'completed_today', COUNT(CASE WHEN ae.status = 'completed' AND ae.executed_at::DATE = CURRENT_DATE THEN 1 END),
        'success_rate', CASE 
            WHEN COUNT(ae.id) > 0 THEN
                ROUND((COUNT(CASE WHEN ae.status = 'completed' THEN 1 END)::NUMERIC / COUNT(ae.id)::NUMERIC * 100), 2)
            ELSE 0
        END,
        'avg_execution_time', COALESCE(AVG(ae.duration_ms), 0)
    ) INTO result
    FROM automation_workflows aw
    LEFT JOIN automation_executions ae ON ae.workflow_id = aw.id AND ae.created_at > NOW() - INTERVAL '30 days'
    WHERE aw.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Automation tables created successfully!';
    RAISE NOTICE 'Tables: automation_workflows, automation_executions, automation_nodes, automation_connections';
    RAISE NOTICE 'Tables: webhook_configs, scheduled_tasks, integration_configs, cache_entries, api_rate_limits';
    RAISE NOTICE 'Functions: get_workflow_stats, get_automation_overview, cleanup_expired_cache';
END $$;
