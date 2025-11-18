-- Add token tracking to vibe_sessions
-- Tracks cumulative token usage and cost per session

-- Add token tracking columns to vibe_sessions
ALTER TABLE vibe_sessions
ADD COLUMN IF NOT EXISTS total_input_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_output_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 6) DEFAULT 0.0;

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_tokens ON vibe_sessions(total_tokens DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_cost ON vibe_sessions(total_cost DESC);

-- Add RPC function to increment token usage for a session
CREATE OR REPLACE FUNCTION increment_vibe_session_tokens(
  p_session_id UUID,
  p_input_tokens BIGINT,
  p_output_tokens BIGINT,
  p_cost NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE vibe_sessions
  SET
    total_input_tokens = total_input_tokens + p_input_tokens,
    total_output_tokens = total_output_tokens + p_output_tokens,
    total_tokens = total_tokens + p_input_tokens + p_output_tokens,
    total_cost = total_cost + p_cost,
    updated_at = now()
  WHERE id = p_session_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_vibe_session_tokens(UUID, BIGINT, BIGINT, NUMERIC) TO authenticated;

-- Comment
COMMENT ON COLUMN vibe_sessions.total_input_tokens IS 'Cumulative input tokens used in this session';
COMMENT ON COLUMN vibe_sessions.total_output_tokens IS 'Cumulative output tokens used in this session';
COMMENT ON COLUMN vibe_sessions.total_tokens IS 'Total tokens (input + output) used in this session';
COMMENT ON COLUMN vibe_sessions.total_cost IS 'Total cost in USD for this session';
COMMENT ON FUNCTION increment_vibe_session_tokens IS 'Increments token usage counters for a vibe session';
