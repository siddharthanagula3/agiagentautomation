import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  TrendingUp,
  Zap,
  Brain,
  Users,
  Rocket,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Particles } from '@shared/ui/particles';
import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';

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
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const categoryIcons: Record<string, unknown> = {
    'ai-automation': Zap,
    productivity: Rocket,
    'case-studies': Building2,
    'ai-insights': Brain,
    'team-management': Users,
    default: TrendingUp,
  };

  const getCategoryIcon = (slug: string) => {
    return categoryIcons[slug] || categoryIcons.default;
  };

  // Fetch blog posts from Supabase function
  const fetchBlogPosts = useCallback(
    async (page = 0, category = selectedCategory, search = searchQuery) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: '10',
          offset: (page * 10).toString(),
        });

        if (category !== 'All') {
          params.append('category', category);
        }

        if (search) {
          params.append('search', search);
        }

        const { data, error } = await supabase.functions.invoke('blog-posts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category !== 'All' ? category : undefined,
            search: search || undefined,
            limit: 10,
            offset: page * 10,
          }),
        });

        if (error) {
          throw error;
        }

        const response = data || { posts: [], count: 0, hasMore: false };

        if (page === 0) {
          setBlogPosts(response.posts || []);
        } else {
          setBlogPosts((prev) => [...prev, ...(response.posts || [])]);
        }

        setHasMore(response.hasMore || false);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError((err as Error).message || 'Failed to fetch blog posts');
        toast.error('Failed to load blog posts');
      } finally {
        setIsLoading(false);
      }
    },
    [selectedCategory, searchQuery]
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Don't show error for categories, just use default ones
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchBlogPosts(0);
  }, [fetchCategories, fetchBlogPosts]);

  // Calculate read time based on content length
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  const loadMorePosts = () => {
    if (!isLoading && hasMore) {
      fetchBlogPosts(currentPage + 1, selectedCategory, searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        staticity={30}
      />

      {/* Hero Section */}
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              The AI Automation Blog
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Insights, strategies, and stories about the future of work with AI
              employees
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full border-border/40 bg-background/60 pl-12 backdrop-blur-xl"
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16 flex flex-wrap justify-center gap-3"
          >
            {/* All Categories Button */}
            <motion.button
              onClick={() => setSelectedCategory('All')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === 'All'
                  ? 'scale-105 bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : 'border border-border/40 bg-background/60 text-foreground/80 backdrop-blur-xl hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <TrendingUp size={16} />
              All
            </motion.button>

            {/* Dynamic Categories */}
            {categories.map((category, idx) => {
              const IconComponent = getCategoryIcon(category.slug);
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.slug
                      ? 'scale-105 bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'border border-border/40 bg-background/60 text-foreground/80 backdrop-blur-xl hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx + 1) * 0.05 }}
                >
                  <IconComponent size={16} />
                  {category.name}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'All' && !searchQuery && (
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <FeaturedPostCard post={featuredPost} />
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <p className="mb-4 text-xl text-red-500">
                Failed to load blog posts
              </p>
              <p className="mb-6 text-muted-foreground">{error}</p>
              <Button
                onClick={() => fetchBlogPosts(0, selectedCategory, searchQuery)}
              >
                Try Again
              </Button>
            </motion.div>
          ) : isLoading && blogPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
              <p className="text-xl text-muted-foreground">
                Loading blog posts...
              </p>
            </motion.div>
          ) : regularPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post, idx) => (
                  <BlogPostCard key={post.id} post={post} index={idx} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 text-center"
                >
                  <Button
                    onClick={loadMorePosts}
                    disabled={isLoading}
                    variant="outline"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <p className="text-xl text-muted-foreground">
                No articles found matching your criteria.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-12 backdrop-blur-xl"
          >
            <div className="text-center">
              <h2 className="mb-4 text-3xl font-bold">Never Miss an Update</h2>
              <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                Get the latest insights on AI automation, productivity tips, and
                case studies delivered to your inbox every week.
              </p>
              <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 border-border/40 bg-background/60 backdrop-blur-xl"
                />
                <Button className="h-12 bg-gradient-to-r from-primary to-accent">
                  Subscribe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const FeaturedPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/40 bg-background/60 backdrop-blur-xl transition-all hover:border-primary/50"
      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative h-64 overflow-hidden md:h-full">
          <img
            src={
              post.image_url ||
              'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop'
            }
            alt={post.title}
            className="h-full w-full max-w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-white">
              Featured
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {post.category.name}
            </span>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <h2 className="mb-4 text-3xl font-bold transition-colors group-hover:text-primary">
            {post.title}
          </h2>
          <p className="mb-6 line-clamp-3 text-muted-foreground">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{post.author.avatar_emoji}</span>
              <div>
                <div className="text-sm font-medium">
                  {post.author.display_name}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  {calculateReadTime(post.content)}
                </div>
              </div>
            </div>
            <Button variant="ghost" className="group-hover:bg-primary/10">
              Read More
              <ArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BlogPostCard: React.FC<{ post: BlogPost; index: number }> = ({
  post,
  index,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur-xl transition-all hover:border-primary/50"
      whileHover={{ y: -8 }}
      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            post.image_url ||
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop'
          }
          alt={post.title}
          className="h-full w-full max-w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-xl">
            {post.category.name}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} />
          {new Date(post.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          <span>•</span>
          <Clock size={12} />
          {calculateReadTime(post.content)}
        </div>
        <h3 className="mb-3 line-clamp-2 text-xl font-bold transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.author.avatar_emoji}</span>
            <span className="text-sm font-medium">
              {post.author.display_name}
            </span>
          </div>
          <ArrowRight
            size={18}
            className="text-primary transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPage;
