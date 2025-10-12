/**
 * Individual Blog Post Page
 * Displays a single blog post with full content
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  BookOpen,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { SEOHead } from '@/components/seo/SEOHead';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
  featured: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_emoji: string;
    avatar_url?: string;
    bio?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlogPost(slug);
    }
  }, [slug]);

  const fetchBlogPost = async (postSlug: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          author:blog_authors(id, display_name, avatar_emoji, avatar_url, bio),
          category:blog_categories(id, name, slug)
        `
        )
        .eq('slug', postSlug)
        .eq('published', true)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Blog post not found');
      }

      setPost(data as BlogPost);
    } catch (err: any) {
      console.error('Error fetching blog post:', err);
      setError(err.message || 'Failed to fetch blog post');
      toast.error('Failed to load blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Post Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error ||
              "The blog post you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${post.title} | AGI Agent Automation Blog`}
        description={post.excerpt}
        image={post.image_url}
        url={`/blog/${post.slug}`}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <section className="px-4 pb-12 pt-8">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Category and Meta */}
              <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {post.category.name}
                </Badge>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {calculateReadTime(post.content)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 size={14} className="mr-1" />
                  Share
                </Button>
              </div>

              {/* Title */}
              <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 border-b border-border/40 pb-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{post.author.avatar_emoji}</span>
                  <div>
                    <div className="font-medium">
                      {post.author.display_name}
                    </div>
                    {post.author.bio && (
                      <div className="text-sm text-muted-foreground">
                        {post.author.bio}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Image */}
        {post.image_url && (
          <section className="px-4 pb-12">
            <div className="container mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="h-64 w-full object-cover md:h-96"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="prose prose-lg dark:prose-invert max-w-none"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-6 mt-8 text-3xl font-bold first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-4 mt-8 text-2xl font-bold">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-3 mt-6 text-xl font-bold">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 space-y-2 pl-6">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 space-y-2 pl-6">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 rounded-r border-l-4 border-primary bg-muted/50 py-2 pl-4 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="my-6 overflow-x-auto rounded-lg bg-muted p-4">
                      {children}
                    </pre>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </motion.div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-muted/30 px-4 py-16">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-3xl font-bold">
                Ready to Transform Your Workflow?
              </h2>
              <p className="mb-8 text-xl text-muted-foreground">
                Start building your AI workforce today and experience the future
                of productivity.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/workforce')}>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore AI Employees
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/contact-sales')}
                >
                  <User className="mr-2 h-5 w-5" />
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPostPage;
