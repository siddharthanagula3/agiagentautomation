-- Create user_shortcuts table for storing custom prompt shortcuts
-- Migration: 20250111000001_add_user_shortcuts_table.sql

CREATE TABLE IF NOT EXISTS public.user_shortcuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT user_shortcuts_label_not_empty CHECK (char_length(trim(label)) > 0),
  CONSTRAINT user_shortcuts_prompt_not_empty CHECK (char_length(trim(prompt)) > 0),
  CONSTRAINT user_shortcuts_category_valid CHECK (
    category IN ('coding', 'writing', 'business', 'creative', 'analysis', 'general')
  )
);

-- Add indexes for better query performance
CREATE INDEX idx_user_shortcuts_user_id ON public.user_shortcuts(user_id);
CREATE INDEX idx_user_shortcuts_category ON public.user_shortcuts(category);
CREATE INDEX idx_user_shortcuts_created_at ON public.user_shortcuts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_shortcuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own shortcuts
CREATE POLICY "Users can view their own shortcuts"
  ON public.user_shortcuts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shortcuts"
  ON public.user_shortcuts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shortcuts"
  ON public.user_shortcuts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shortcuts"
  ON public.user_shortcuts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_shortcuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_shortcuts_updated_at_trigger
  BEFORE UPDATE ON public.user_shortcuts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_shortcuts_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.user_shortcuts IS 'Stores custom prompt shortcuts created by users for quick access in chat interface';
