-- Migration: Add user_id to vibe_messages for better tracking
-- Purpose: Allow direct user tracking on messages without joining through sessions
-- Date: 2025-01-16

-- Add user_id column to vibe_messages
ALTER TABLE vibe_messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_vibe_messages_user ON vibe_messages(user_id);

-- Update existing rows to populate user_id from session
UPDATE vibe_messages
SET user_id = (
  SELECT user_id FROM vibe_sessions WHERE vibe_sessions.id = vibe_messages.session_id
)
WHERE user_id IS NULL;

-- Add comment
COMMENT ON COLUMN vibe_messages.user_id IS 'Direct reference to user for simplified queries and RLS';
