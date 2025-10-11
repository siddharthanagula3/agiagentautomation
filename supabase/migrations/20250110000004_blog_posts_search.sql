-- Create full-text search indexes

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
-- Tags and SEO keywords columns don't exist in blog_posts table
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN(tags);
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_keywords ON public.blog_posts USING GIN(seo_keywords);
CREATE INDEX IF NOT EXISTS idx_blog_posts_fts ON public.blog_posts USING GIN(to_tsvector('english', title || ' ' || excerpt || ' ' || content));
