-- =====================================================
-- Blog Tables RLS Security Migration
-- =====================================================
-- Migration: 20260130000001_add_blog_tables_rls.sql
-- Description: Add RLS to blog_categories and blog_comments tables
-- Risk Level: MEDIUM - Fixes potential cross-user data access
-- Rollback: See ROLLBACK section at end
-- =====================================================

-- =====================================================
-- 1. Fix: blog_categories - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Everyone can read blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Service role can manage blog categories" ON public.blog_categories;

-- Anyone can read blog categories (public content)
CREATE POLICY "Everyone can read blog categories"
  ON public.blog_categories
  FOR SELECT
  USING (true);

-- Only service role can manage categories
CREATE POLICY "Service role can manage blog categories"
  ON public.blog_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 2. Fix: blog_comments - Enable RLS
-- =====================================================
ALTER TABLE IF EXISTS public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view comments on published posts" ON public.blog_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Service role can manage all comments" ON public.blog_comments;

-- Users can view comments on published posts
CREATE POLICY "Users can view comments on published posts"
  ON public.blog_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = blog_comments.post_id
      AND blog_posts.published = true
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.blog_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.blog_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.blog_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all comments (moderation)
CREATE POLICY "Service role can manage all comments"
  ON public.blog_comments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Add comments for documentation
-- =====================================================
COMMENT ON POLICY "Everyone can read blog categories" ON public.blog_categories
  IS 'RLS: Blog categories are public content';
COMMENT ON POLICY "Users can view comments on published posts" ON public.blog_comments
  IS 'RLS: Comments are visible only on published blog posts';
COMMENT ON POLICY "Authenticated users can create comments" ON public.blog_comments
  IS 'RLS: Only authenticated users can create comments';
COMMENT ON POLICY "Users can update their own comments" ON public.blog_comments
  IS 'RLS: Users can only edit their own comments';
COMMENT ON POLICY "Users can delete their own comments" ON public.blog_comments
  IS 'RLS: Users can only delete their own comments';

-- =====================================================
-- ROLLBACK SECTION
-- To rollback, run these commands:
-- =====================================================
-- ALTER TABLE public.blog_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.blog_comments DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Everyone can read blog categories" ON public.blog_categories;
-- DROP POLICY IF EXISTS "Service role can manage blog categories" ON public.blog_categories;
-- DROP POLICY IF EXISTS "Users can view comments on published posts" ON public.blog_comments;
-- DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.blog_comments;
-- DROP POLICY IF EXISTS "Users can update their own comments" ON public.blog_comments;
-- DROP POLICY IF EXISTS "Users can delete their own comments" ON public.blog_comments;
-- DROP POLICY IF EXISTS "Service role can manage all comments" ON public.blog_comments;
