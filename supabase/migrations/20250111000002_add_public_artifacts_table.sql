-- Create public_artifacts table for community artifact showcase
-- Migration: 20250111000002_add_public_artifacts_table.sql

CREATE TABLE IF NOT EXISTS public.public_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Artifact details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_name VARCHAR(100),

  -- Engagement metrics
  views INTEGER DEFAULT 0 NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  shares INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Status
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,

  -- Constraints
  CONSTRAINT public_artifacts_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT public_artifacts_content_not_empty CHECK (char_length(trim(content)) > 0),
  CONSTRAINT public_artifacts_type_valid CHECK (
    type IN ('html', 'react', 'svg', 'mermaid', 'markdown', 'code', 'document')
  ),
  CONSTRAINT public_artifacts_views_non_negative CHECK (views >= 0),
  CONSTRAINT public_artifacts_likes_non_negative CHECK (likes >= 0),
  CONSTRAINT public_artifacts_shares_non_negative CHECK (shares >= 0)
);

-- Add indexes for better query performance
CREATE INDEX idx_public_artifacts_user_id ON public.public_artifacts(user_id);
CREATE INDEX idx_public_artifacts_type ON public.public_artifacts(type);
CREATE INDEX idx_public_artifacts_created_at ON public.public_artifacts(created_at DESC);
CREATE INDEX idx_public_artifacts_views ON public.public_artifacts(views DESC);
CREATE INDEX idx_public_artifacts_likes ON public.public_artifacts(likes DESC);
CREATE INDEX idx_public_artifacts_is_featured ON public.public_artifacts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_public_artifacts_is_public ON public.public_artifacts(is_public) WHERE is_public = TRUE;

-- Full-text search index for title and description
CREATE INDEX idx_public_artifacts_search ON public.public_artifacts
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Tags search index
CREATE INDEX idx_public_artifacts_tags ON public.public_artifacts USING gin(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE public.public_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public artifacts can be viewed by anyone, but only owners can modify
CREATE POLICY "Anyone can view public artifacts"
  ON public.public_artifacts
  FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can view their own artifacts"
  ON public.public_artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own artifacts"
  ON public.public_artifacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts"
  ON public.public_artifacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts"
  ON public.public_artifacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_public_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER public_artifacts_updated_at_trigger
  BEFORE UPDATE ON public.public_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_public_artifacts_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_artifact_views(artifact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.public_artifacts
  SET views = views + 1
  WHERE id = artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment like count
CREATE OR REPLACE FUNCTION increment_artifact_likes(artifact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.public_artifacts
  SET likes = likes + 1
  WHERE id = artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.public_artifacts IS 'Stores publicly shared artifacts (HTML, React, SVG, etc.) created by users in the artifact gallery';
COMMENT ON FUNCTION increment_artifact_views(UUID) IS 'Increments the view count for an artifact';
COMMENT ON FUNCTION increment_artifact_likes(UUID) IS 'Increments the like count for an artifact';
