-- Vibe Interface: Multi-Agent Collaborative Workspace
-- Creates all necessary tables for the /vibe interface
-- Inspired by MGX.dev and MetaGPT architecture

-- Vibe chat sessions
CREATE TABLE IF NOT EXISTS vibe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe messages (user and agent messages)
CREATE TABLE IF NOT EXISTS vibe_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  employee_id UUID REFERENCES ai_employees(id),
  employee_name TEXT,
  employee_role TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_streaming BOOLEAN DEFAULT FALSE
);

-- Vibe files (uploaded files and references)
CREATE TABLE IF NOT EXISTS vibe_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe agent messages (structured communication between agents)
CREATE TABLE IF NOT EXISTS vibe_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assignment', 'task_result', 'status_update', 'question', 'resource_request', 'handoff')),
  from_agent TEXT NOT NULL,
  to_agents TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe execution tasks (parallel task tracking)
CREATE TABLE IF NOT EXISTS vibe_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES ai_employees(id),
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_user ON vibe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_updated ON vibe_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vibe_messages_session ON vibe_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_messages_timestamp ON vibe_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_messages_employee ON vibe_messages(employee_id) WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vibe_files_session ON vibe_files(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_files_user ON vibe_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_vibe_agent_messages_session ON vibe_agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_agent_messages_timestamp ON vibe_agent_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vibe_tasks_session ON vibe_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_tasks_status ON vibe_tasks(status);
CREATE INDEX IF NOT EXISTS idx_vibe_tasks_assigned ON vibe_tasks(assigned_to);

-- Row Level Security (RLS) Policies

-- vibe_sessions: Users can only access their own sessions
ALTER TABLE vibe_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vibe sessions"
  ON vibe_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vibe sessions"
  ON vibe_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vibe sessions"
  ON vibe_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vibe sessions"
  ON vibe_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- vibe_messages: Users can only access messages from their sessions
ALTER TABLE vibe_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions"
  ON vibe_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON vibe_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their sessions"
  ON vibe_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their sessions"
  ON vibe_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- vibe_files: Users can only access files from their sessions
ALTER TABLE vibe_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files from their sessions"
  ON vibe_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_files.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their sessions"
  ON vibe_files FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_files.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their sessions"
  ON vibe_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_files.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- vibe_agent_messages: Users can only access agent messages from their sessions
ALTER TABLE vibe_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent messages from their sessions"
  ON vibe_agent_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create agent messages"
  ON vibe_agent_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- vibe_tasks: Users can only access tasks from their sessions
ALTER TABLE vibe_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks from their sessions"
  ON vibe_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_tasks.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create tasks"
  ON vibe_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_tasks.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update tasks"
  ON vibe_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_tasks.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE vibe_sessions IS 'Chat sessions for the VIBE multi-agent interface';
COMMENT ON TABLE vibe_messages IS 'User and agent messages in VIBE conversations';
COMMENT ON TABLE vibe_files IS 'Files uploaded or referenced in VIBE sessions';
COMMENT ON TABLE vibe_agent_messages IS 'Structured communication between agents (MetaGPT-inspired)';
COMMENT ON TABLE vibe_tasks IS 'Parallel execution tasks with dependency tracking';
