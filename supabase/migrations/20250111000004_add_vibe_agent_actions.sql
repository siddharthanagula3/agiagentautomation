-- Migration: Add VIBE Agent Actions Tracking Table
-- Purpose: Track real-time agent actions for VIBE workspace views
-- Date: 2025-01-11

-- Create agent actions table
CREATE TABLE IF NOT EXISTS vibe_agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'file_edit',
    'command_execution',
    'app_preview',
    'task_planning',
    'tool_execution',
    'file_read',
    'file_create',
    'file_delete'
  )),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vibe_agent_actions_session ON vibe_agent_actions(session_id);
CREATE INDEX idx_vibe_agent_actions_timestamp ON vibe_agent_actions(timestamp DESC);
CREATE INDEX idx_vibe_agent_actions_status ON vibe_agent_actions(status);
CREATE INDEX idx_vibe_agent_actions_agent ON vibe_agent_actions(agent_name);
CREATE INDEX idx_vibe_agent_actions_type ON vibe_agent_actions(action_type);

-- Add comment
COMMENT ON TABLE vibe_agent_actions IS 'Tracks real-time agent actions for VIBE workspace visualization';
COMMENT ON COLUMN vibe_agent_actions.action_type IS 'Type of action: file_edit, command_execution, app_preview, task_planning, tool_execution, file_read, file_create, file_delete';
COMMENT ON COLUMN vibe_agent_actions.metadata IS 'Action-specific metadata: { file_path, command, preview_url, task_id, tool_name, etc. }';
COMMENT ON COLUMN vibe_agent_actions.result IS 'Output/result of the action';

-- Enable Row Level Security
ALTER TABLE vibe_agent_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own agent actions
CREATE POLICY "Users can view their own agent actions"
  ON vibe_agent_actions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM vibe_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert agent actions (backend only)
CREATE POLICY "Service role can insert agent actions"
  ON vibe_agent_actions FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can update agent actions (backend only)
CREATE POLICY "Service role can update agent actions"
  ON vibe_agent_actions FOR UPDATE
  USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_vibe_agent_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vibe_agent_actions_updated_at
  BEFORE UPDATE ON vibe_agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_vibe_agent_actions_updated_at();
