-- Add message reactions support
-- Migration: 20260129000002_add_message_reactions.sql
-- Allows users to react to chat messages with emojis

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one reaction per emoji per message per user
  CONSTRAINT message_reactions_user_message_emoji_unique UNIQUE(user_id, message_id, emoji)
);

-- Create indexes for performance
-- Primary index on message_id for fast lookups of all reactions on a message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
-- Secondary index on user_id for user's reaction history
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_user ON public.message_reactions(message_id, user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
-- Users can view all reactions on messages they have access to
-- (reactions are public within the chat context)
CREATE POLICY "Users can view reactions on accessible messages"
  ON public.message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_sessions cs ON cm.session_id = cs.id
      WHERE cm.id = message_reactions.message_id
      AND cs.user_id = auth.uid()
    )
  );

-- Users can create their own reactions
CREATE POLICY "Users can create their own reactions"
  ON public.message_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.message_reactions IS 'User emoji reactions on chat messages';
COMMENT ON COLUMN public.message_reactions.id IS 'Unique reaction identifier';
COMMENT ON COLUMN public.message_reactions.message_id IS 'The message being reacted to';
COMMENT ON COLUMN public.message_reactions.user_id IS 'User who created the reaction';
COMMENT ON COLUMN public.message_reactions.emoji IS 'The emoji used for the reaction';
COMMENT ON COLUMN public.message_reactions.created_at IS 'When the reaction was created';

-- Create view for aggregated reactions per message
CREATE OR REPLACE VIEW public.message_reactions_summary AS
SELECT
  message_id,
  emoji,
  COUNT(*) as count,
  array_agg(user_id) as user_ids,
  MIN(created_at) as first_reaction_at
FROM public.message_reactions
GROUP BY message_id, emoji
ORDER BY count DESC;

-- Grant access to view
GRANT SELECT ON public.message_reactions_summary TO authenticated;

COMMENT ON VIEW public.message_reactions_summary IS 'Aggregated reaction counts per message grouped by emoji';

-- Create function to get reactions for multiple messages efficiently
CREATE OR REPLACE FUNCTION public.get_message_reactions(message_ids UUID[])
RETURNS TABLE (
  message_id UUID,
  emoji TEXT,
  count BIGINT,
  user_ids UUID[],
  user_reacted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.message_id,
    mr.emoji,
    COUNT(*)::BIGINT as count,
    array_agg(mr.user_id) as user_ids,
    bool_or(mr.user_id = auth.uid()) as user_reacted
  FROM public.message_reactions mr
  WHERE mr.message_id = ANY(message_ids)
  GROUP BY mr.message_id, mr.emoji
  ORDER BY mr.message_id, count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_message_reactions IS 'Get aggregated reactions for multiple messages with user reaction status';
