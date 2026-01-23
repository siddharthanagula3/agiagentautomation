-- Migration: Add email notifications queue and related tables
-- Date: 2026-01-22
-- Description: Creates tables for email notifications, 2FA setup, shared artifacts, and message reactions

-- =============================================
-- EMAIL NOTIFICATIONS QUEUE
-- =============================================

CREATE TABLE IF NOT EXISTS email_notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- support_ticket, notification, alert, marketing
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created
ON email_notifications_queue(status, created_at)
WHERE status = 'pending';

-- Index for user's email history
CREATE INDEX IF NOT EXISTS idx_email_queue_user
ON email_notifications_queue(user_id, created_at DESC);

-- RLS for email notifications
ALTER TABLE email_notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email history"
  ON email_notifications_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- USER 2FA SETUP
-- =============================================

CREATE TABLE IF NOT EXISTS user_2fa_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Encrypted backup codes
  is_enabled BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for 2FA setup
ALTER TABLE user_2fa_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own 2FA setup"
  ON user_2fa_setup
  FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- SHARED ARTIFACTS
-- =============================================

CREATE TABLE IF NOT EXISTS shared_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type VARCHAR(20) DEFAULT 'link', -- link, user, team
  shared_with UUID[], -- User IDs if share_type is 'user'
  access_level VARCHAR(20) DEFAULT 'view', -- view, edit, comment
  share_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  password_hash TEXT, -- Optional password protection
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for share token lookup
CREATE INDEX IF NOT EXISTS idx_shared_artifacts_token
ON shared_artifacts(share_token)
WHERE share_token IS NOT NULL;

-- Index for owner's shared artifacts
CREATE INDEX IF NOT EXISTS idx_shared_artifacts_owner
ON shared_artifacts(owner_id, created_at DESC);

-- RLS for shared artifacts
ALTER TABLE shared_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shared artifacts"
  ON shared_artifacts
  FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view artifacts shared with them"
  ON shared_artifacts
  FOR SELECT
  USING (auth.uid() = ANY(shared_with));

-- =============================================
-- MESSAGE REACTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL, -- up, down, helpful, love, laugh, sad, angry
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one reaction type per user per message
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reactions_unique
ON message_reactions(message_id, user_id, reaction_type);

-- Index for fetching reactions by message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message
ON message_reactions(message_id);

-- RLS for message reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reactions"
  ON message_reactions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all reactions"
  ON message_reactions
  FOR SELECT
  USING (true);

-- =============================================
-- ADD ARCHIVE/PIN COLUMNS TO CHAT_SESSIONS
-- =============================================

-- Add is_archived column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add is_pinned column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Index for filtered queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived
ON chat_sessions(user_id, is_archived)
WHERE is_archived = TRUE;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_pinned
ON chat_sessions(user_id, is_pinned)
WHERE is_pinned = TRUE;

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Trigger for email_notifications_queue updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_queue_updated_at ON email_notifications_queue;
CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON email_notifications_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- Trigger for user_2fa_setup updated_at
CREATE OR REPLACE FUNCTION update_2fa_setup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_2fa_setup_updated_at ON user_2fa_setup;
CREATE TRIGGER user_2fa_setup_updated_at
  BEFORE UPDATE ON user_2fa_setup
  FOR EACH ROW
  EXECUTE FUNCTION update_2fa_setup_updated_at();

-- Trigger for shared_artifacts updated_at
CREATE OR REPLACE FUNCTION update_shared_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_artifacts_updated_at ON shared_artifacts;
CREATE TRIGGER shared_artifacts_updated_at
  BEFORE UPDATE ON shared_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_artifacts_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE email_notifications_queue IS 'Queue for outgoing email notifications';
COMMENT ON TABLE user_2fa_setup IS 'User two-factor authentication settings';
COMMENT ON TABLE shared_artifacts IS 'Shared code artifacts and conversation exports';
COMMENT ON TABLE message_reactions IS 'User reactions to chat messages';
