-- Agent SDK Tables Migration
-- Creates tables for the OpenAI Agent SDK integration

-- Agent Sessions Table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Agent Analytics Table
CREATE TABLE IF NOT EXISTS agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Tools Table
CREATE TABLE IF NOT EXISTS agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('function', 'webhook', 'api')),
  parameters JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Agent Webhooks Table
CREATE TABLE IF NOT EXISTS agent_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
  headers JSONB DEFAULT '{}',
  payload JSONB DEFAULT '{}',
  retry_policy JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Agent Tool Executions Table
CREATE TABLE IF NOT EXISTS agent_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES agent_tools(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Webhook Executions Table
CREATE TABLE IF NOT EXISTS agent_webhook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES agent_webhooks(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES agent_sessions(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body JSONB,
  error TEXT,
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_employee_id ON agent_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_analytics_session_id ON agent_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_user_id ON agent_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_timestamp ON agent_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_agent_tools_user_id ON agent_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tools_type ON agent_tools(type);
CREATE INDEX IF NOT EXISTS idx_agent_tools_is_active ON agent_tools(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_webhooks_user_id ON agent_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_is_active ON agent_webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_tool_executions_session_id ON agent_tool_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_executions_tool_id ON agent_tool_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_executions_created_at ON agent_tool_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_webhook_executions_webhook_id ON agent_webhook_executions(webhook_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhook_executions_session_id ON agent_webhook_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhook_executions_created_at ON agent_webhook_executions(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_webhook_executions ENABLE ROW LEVEL SECURITY;

-- Agent Sessions RLS Policies
CREATE POLICY "Users can view their own agent sessions" ON agent_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent sessions" ON agent_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent sessions" ON agent_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent sessions" ON agent_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Agent Analytics RLS Policies
CREATE POLICY "Users can view their own agent analytics" ON agent_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent analytics" ON agent_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agent Tools RLS Policies
CREATE POLICY "Users can view their own agent tools" ON agent_tools
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent tools" ON agent_tools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent tools" ON agent_tools
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent tools" ON agent_tools
  FOR DELETE USING (auth.uid() = user_id);

-- Agent Webhooks RLS Policies
CREATE POLICY "Users can view their own agent webhooks" ON agent_webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent webhooks" ON agent_webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent webhooks" ON agent_webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent webhooks" ON agent_webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- Agent Tool Executions RLS Policies
CREATE POLICY "Users can view their own agent tool executions" ON agent_tool_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_sessions 
      WHERE agent_sessions.id = agent_tool_executions.session_id 
      AND agent_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own agent tool executions" ON agent_tool_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_sessions 
      WHERE agent_sessions.id = agent_tool_executions.session_id 
      AND agent_sessions.user_id = auth.uid()
    )
  );

-- Agent Webhook Executions RLS Policies
CREATE POLICY "Users can view their own agent webhook executions" ON agent_webhook_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_webhooks 
      WHERE agent_webhooks.id = agent_webhook_executions.webhook_id 
      AND agent_webhooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own agent webhook executions" ON agent_webhook_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_webhooks 
      WHERE agent_webhooks.id = agent_webhook_executions.webhook_id 
      AND agent_webhooks.user_id = auth.uid()
    )
  );

-- Functions for Agent SDK
CREATE OR REPLACE FUNCTION update_agent_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agent_tool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agent_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_update_agent_session_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_session_updated_at();

CREATE TRIGGER trigger_update_agent_tool_updated_at
  BEFORE UPDATE ON agent_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tool_updated_at();

CREATE TRIGGER trigger_update_agent_webhook_updated_at
  BEFORE UPDATE ON agent_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_webhook_updated_at();

-- Function to get agent session statistics
CREATE OR REPLACE FUNCTION get_agent_session_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_messages BIGINT,
  total_tokens BIGINT,
  avg_session_duration INTERVAL,
  most_used_employee_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(m.value) as total_messages,
    COALESCE(SUM(a.total_tokens), 0) as total_tokens,
    AVG(s.updated_at - s.created_at) as avg_session_duration,
    MODE() WITHIN GROUP (ORDER BY s.employee_role) as most_used_employee_role
  FROM agent_sessions s
  LEFT JOIN jsonb_array_elements(s.messages) m ON true
  LEFT JOIN agent_analytics a ON a.session_id = s.id
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old agent data
CREATE OR REPLACE FUNCTION cleanup_old_agent_data()
RETURNS void AS $$
BEGIN
  -- Delete sessions older than 90 days
  DELETE FROM agent_sessions 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete analytics older than 180 days
  DELETE FROM agent_analytics 
  WHERE timestamp < NOW() - INTERVAL '180 days';
  
  -- Delete tool executions older than 30 days
  DELETE FROM agent_tool_executions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete webhook executions older than 30 days
  DELETE FROM agent_webhook_executions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default tools for common employee roles
INSERT INTO agent_tools (user_id, name, description, type, parameters, config) VALUES
  -- These will be created for each user when they first use the system
  -- The actual insertion will be handled by the application logic
  (auth.uid(), 'web_search', 'Search the web for current information', 'function', 
   '{"type": "object", "properties": {"query": {"type": "string", "description": "Search query"}, "max_results": {"type": "number", "description": "Maximum number of results"}}, "required": ["query"]}',
   '{"enabled": true, "rate_limit": 100}')
ON CONFLICT (user_id, name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE agent_sessions IS 'Stores agent chat sessions with configuration and message history';
COMMENT ON TABLE agent_analytics IS 'Tracks token usage and performance metrics for agent sessions';
COMMENT ON TABLE agent_tools IS 'User-defined tools that can be used by agents';
COMMENT ON TABLE agent_webhooks IS 'Webhook configurations for agent integrations';
COMMENT ON TABLE agent_tool_executions IS 'Logs of tool executions during agent conversations';
COMMENT ON TABLE agent_webhook_executions IS 'Logs of webhook executions triggered by agents';

COMMENT ON FUNCTION get_agent_session_stats(UUID) IS 'Returns statistics about user agent sessions';
COMMENT ON FUNCTION cleanup_old_agent_data() IS 'Cleans up old agent data to maintain database performance';
