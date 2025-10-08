-- OpenAI Agents SDK Database Tables
-- Tables for storing agent sessions and messages

-- Agent Sessions Table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  metadata JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Messages Table
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX idx_agent_sessions_conversation_id ON agent_sessions(conversation_id);
CREATE INDEX idx_agent_messages_conversation_id ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created_at ON agent_messages(created_at);

-- RLS Policies
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own agent sessions" 
  ON agent_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent sessions" 
  ON agent_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent sessions" 
  ON agent_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can only see messages from their conversations
CREATE POLICY "Users can view messages from own conversations" 
  ON agent_messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM agent_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations" 
  ON agent_messages FOR INSERT 
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM agent_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agent_sessions_updated_at 
  BEFORE UPDATE ON agent_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_messages_updated_at 
  BEFORE UPDATE ON agent_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
