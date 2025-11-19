-- Add message bookmarks support
-- Migration: 20251119000002_add_message_bookmarks.sql
-- Allows users to bookmark/favorite important chat messages

-- Create message_bookmarks table
CREATE TABLE IF NOT EXISTS public.message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  note TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one bookmark per message per user
  CONSTRAINT message_bookmarks_user_message_unique UNIQUE(user_id, message_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_id ON public.message_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_session_id ON public.message_bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_message_id ON public.message_bookmarks(message_id);
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_tags ON public.message_bookmarks USING gin(tags);

-- Enable RLS
ALTER TABLE public.message_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_bookmarks
-- Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.message_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
  ON public.message_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON public.message_bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.message_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.message_bookmarks IS 'User bookmarks for important chat messages';
COMMENT ON COLUMN public.message_bookmarks.id IS 'Unique bookmark identifier';
COMMENT ON COLUMN public.message_bookmarks.user_id IS 'Owner of the bookmark';
COMMENT ON COLUMN public.message_bookmarks.session_id IS 'Chat session containing the message';
COMMENT ON COLUMN public.message_bookmarks.message_id IS 'Bookmarked message';
COMMENT ON COLUMN public.message_bookmarks.note IS 'Optional note about why message was bookmarked';
COMMENT ON COLUMN public.message_bookmarks.tags IS 'Optional tags for categorization';

-- Create function to update bookmark updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_bookmark_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_message_bookmark_updated_at ON public.message_bookmarks;
CREATE TRIGGER trigger_update_message_bookmark_updated_at
  BEFORE UPDATE ON public.message_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_message_bookmark_updated_at();

-- Create view for bookmarked messages with full details
CREATE OR REPLACE VIEW public.bookmarked_messages AS
SELECT
  b.id AS bookmark_id,
  b.user_id,
  b.session_id,
  b.message_id,
  b.note AS bookmark_note,
  b.tags AS bookmark_tags,
  b.created_at AS bookmarked_at,
  b.updated_at AS bookmark_updated_at,
  m.role AS message_role,
  m.content AS message_content,
  m.created_at AS message_created_at,
  s.title AS session_title,
  s.created_at AS session_created_at
FROM public.message_bookmarks b
JOIN public.chat_messages m ON b.message_id = m.id
JOIN public.chat_sessions s ON b.session_id = s.id;

-- Grant access to view
GRANT SELECT ON public.bookmarked_messages TO authenticated;

COMMENT ON VIEW public.bookmarked_messages IS 'Detailed view of bookmarked messages with session info';
