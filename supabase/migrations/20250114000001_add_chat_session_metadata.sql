-- Add metadata columns to chat_sessions for starred, pinned, archived, and shared_link
-- Migration: 20250114000001_add_chat_session_metadata.sql

-- Add metadata columns if they don't exist
DO $$
BEGIN
  -- Add is_starred column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'is_starred'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN is_starred BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add is_pinned column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN is_pinned BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add is_archived column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add shared_link column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'shared_link'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN shared_link VARCHAR(255);
  END IF;

  -- Add metadata JSONB column for additional metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'chat_sessions'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_starred ON public.chat_sessions(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_pinned ON public.chat_sessions(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_archived ON public.chat_sessions(user_id, is_archived) WHERE is_archived = true;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_shared_link ON public.chat_sessions(shared_link) WHERE shared_link IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.chat_sessions.is_starred IS 'Whether the session is starred by the user';
COMMENT ON COLUMN public.chat_sessions.is_pinned IS 'Whether the session is pinned to the top';
COMMENT ON COLUMN public.chat_sessions.is_archived IS 'Whether the session is archived';
COMMENT ON COLUMN public.chat_sessions.shared_link IS 'Public share link for the session';
COMMENT ON COLUMN public.chat_sessions.metadata IS 'Additional metadata stored as JSONB';

