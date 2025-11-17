-- ================================================================
-- Participant Stats RPC Function Migration
-- ================================================================
-- Creates atomic increment function for participant statistics
-- Fixes Bug #3: Race Condition - Participant Stats Increment
-- Prevents race conditions when updating participant stats
-- ================================================================

-- ================================================================
-- INCREMENT PARTICIPANT STATS RPC
-- ================================================================
-- Atomically increments participant statistics (messages, tokens, cost, tasks)
-- This prevents race conditions that can occur with read-modify-write patterns
-- Used in multi-agent-chat-database.ts incrementParticipantStats()

CREATE OR REPLACE FUNCTION public.increment_participant_stats(
  p_participant_id UUID,
  p_message_count INTEGER DEFAULT 0,
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_incurred NUMERIC DEFAULT 0,
  p_tasks_completed INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  -- Atomic update using PostgreSQL's native increment
  -- This is safe from race conditions unlike fetch-then-update
  UPDATE public.conversation_participants
  SET
    message_count = message_count + p_message_count,
    tokens_used = tokens_used + p_tokens_used,
    cost_incurred = cost_incurred + p_cost_incurred,
    tasks_completed = tasks_completed + p_tasks_completed,
    last_active_at = NOW()
  WHERE id = p_participant_id;

  -- If no row was updated, raise an error (participant doesn't exist)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found: %', p_participant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PERMISSIONS
-- ================================================================
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_participant_stats(UUID, INTEGER, INTEGER, NUMERIC, INTEGER) TO authenticated;

-- ================================================================
-- COMMENTS
-- ================================================================
COMMENT ON FUNCTION public.increment_participant_stats IS
  'Atomically increments participant statistics (messages, tokens, cost, tasks) to prevent race conditions. Called from multi-agent-chat-database.ts incrementParticipantStats()';
