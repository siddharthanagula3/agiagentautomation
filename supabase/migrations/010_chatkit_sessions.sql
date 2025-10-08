-- ChatKit Sessions Migration
-- Creates tables for ChatKit session management

-- ChatKit sessions table
CREATE TABLE IF NOT EXISTS chatkit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  employee_id TEXT,
  employee_role TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ChatKit messages table for session messages
CREATE TABLE IF NOT EXISTS chatkit_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES chatkit_sessions(session_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ChatKit workflows table for workflow configurations
CREATE TABLE IF NOT EXISTS chatkit_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_user_id ON chatkit_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_workflow_id ON chatkit_sessions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_status ON chatkit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_expires_at ON chatkit_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_chatkit_messages_session_id ON chatkit_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_messages_user_id ON chatkit_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_messages_created_at ON chatkit_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chatkit_workflows_workflow_id ON chatkit_workflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_chatkit_workflows_is_active ON chatkit_workflows(is_active);

-- Enable Row Level Security
ALTER TABLE chatkit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatkit_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatkit_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatkit_sessions
CREATE POLICY "Users can view their own ChatKit sessions" ON chatkit_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ChatKit sessions" ON chatkit_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ChatKit sessions" ON chatkit_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ChatKit sessions" ON chatkit_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chatkit_messages
CREATE POLICY "Users can view messages in their ChatKit sessions" ON chatkit_messages
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM chatkit_sessions 
      WHERE chatkit_sessions.session_id = chatkit_messages.session_id 
      AND chatkit_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their ChatKit sessions" ON chatkit_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chatkit_sessions 
      WHERE chatkit_sessions.session_id = chatkit_messages.session_id 
      AND chatkit_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ChatKit messages" ON chatkit_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ChatKit messages" ON chatkit_messages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chatkit_workflows
CREATE POLICY "Users can view active ChatKit workflows" ON chatkit_workflows
  FOR SELECT USING (is_active = TRUE);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chatkit_sessions_updated_at 
  BEFORE UPDATE ON chatkit_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatkit_workflows_updated_at 
  BEFORE UPDATE ON chatkit_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default ChatKit workflows
INSERT INTO chatkit_workflows (workflow_id, name, description, config) VALUES
  (
    'default-workflow',
    'Default AI Assistant',
    'Default ChatGPT-powered AI assistant workflow',
    '{
      "model": "gpt-4o",
      "temperature": 0.7,
      "max_tokens": 4000,
      "tools": ["web_search", "code_interpreter", "file_upload"],
      "system_prompt": "You are a helpful AI assistant powered by ChatGPT. You are part of an AI workforce and should provide expert assistance in your field."
    }'
  ),
  (
    'executive-workflow',
    'Executive AI Assistant',
    'ChatGPT-powered executive leadership assistant',
    '{
      "model": "gpt-4o",
      "temperature": 0.3,
      "max_tokens": 4000,
      "tools": ["strategic_analysis", "market_research", "financial_modeling"],
      "system_prompt": "You are an executive AI assistant with expertise in strategic planning, leadership, and organizational management."
    }'
  ),
  (
    'technical-workflow',
    'Technical AI Assistant',
    'ChatGPT-powered technical development assistant',
    '{
      "model": "gpt-4o",
      "temperature": 0.2,
      "max_tokens": 4000,
      "tools": ["code_generation", "debugging", "architecture_design"],
      "system_prompt": "You are a technical AI assistant with expertise in software development, architecture, and engineering best practices."
    }'
  ),
  (
    'creative-workflow',
    'Creative AI Assistant',
    'ChatGPT-powered creative and marketing assistant',
    '{
      "model": "gpt-4o",
      "temperature": 0.8,
      "max_tokens": 4000,
      "tools": ["content_creation", "design_assistance", "marketing_strategy"],
      "system_prompt": "You are a creative AI assistant with expertise in content creation, design, and marketing strategies."
    }'
  )
ON CONFLICT (workflow_id) DO NOTHING;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_chatkit_sessions()
RETURNS void AS $$
BEGIN
  UPDATE chatkit_sessions 
  SET status = 'expired' 
  WHERE expires_at < NOW() AND status = 'active';
  
  DELETE FROM chatkit_messages 
  WHERE session_id IN (
    SELECT session_id FROM chatkit_sessions 
    WHERE status = 'expired' AND expires_at < NOW() - INTERVAL '7 days'
  );
  
  DELETE FROM chatkit_sessions 
  WHERE status = 'expired' AND expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-chatkit-sessions', '0 2 * * *', 'SELECT cleanup_expired_chatkit_sessions();');
