-- Add message edit support
-- This migration adds the ability to edit messages and track edit history

-- Add updated_at column to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add edit tracking column
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE;

-- Add edit count column
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Create message edit history table
CREATE TABLE IF NOT EXISTS chat_message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES chat_messages(id)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_message_edits_message_id ON chat_message_edits(message_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_edited_at ON chat_message_edits(edited_at DESC);

-- Enable RLS on message edits table
ALTER TABLE chat_message_edits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view edit history for messages in their sessions
CREATE POLICY "Users can view own message edits"
  ON chat_message_edits FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id
      FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

-- RLS Policy: Allow users to update their own messages
CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Function to track message edits
CREATE OR REPLACE FUNCTION track_message_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Store previous version in edit history
    INSERT INTO chat_message_edits (message_id, previous_content, edited_at)
    VALUES (OLD.id, OLD.content, NOW());

    -- Update message metadata
    NEW.updated_at = NOW();
    NEW.edited = TRUE;
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically track edits
DROP TRIGGER IF EXISTS trigger_track_message_edit ON chat_messages;
CREATE TRIGGER trigger_track_message_edit
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION track_message_edit();

-- Update existing messages to have updated_at = created_at
UPDATE chat_messages
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN chat_messages.updated_at IS 'Timestamp of last edit';
COMMENT ON COLUMN chat_messages.edited IS 'Whether message has been edited';
COMMENT ON COLUMN chat_messages.edit_count IS 'Number of times message has been edited';
COMMENT ON TABLE chat_message_edits IS 'History of all message edits for audit trail';
