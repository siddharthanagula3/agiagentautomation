import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, Clock, ArrowRight, Search, TrendingUp, Zap, Brain, Users, Rocket, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Particles } from '@/components/ui/particles';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    avatar: string;
  };
  image: string;
  featured?: boolean;
}

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All', icon: TrendingUp },
    { name: 'AI Automation', icon: Zap },
    { name: 'Productivity', icon: Rocket },
    { name: 'Case Studies', icon: Building2 },
    { name: 'AI Insights', icon: Brain },
    { name: 'Team Management', icon: Users }
  ];

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: 'How AI Employees Are Transforming Modern Workplaces',
      excerpt: 'Discover how businesses are leveraging AI employees to automate repetitive tasks, boost productivity, and scale operations without traditional hiring constraints.',
      category: 'AI Automation',
      date: '2024-10-02',
      readTime: '8 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop',
      featured: true
    },
    {
      id: 2,
      title: '10 Ways AI Workflows Save Your Team 20 Hours Per Week',
      excerpt: 'Learn the practical strategies top companies use to implement AI-driven workflows that eliminate bottlenecks and reclaim valuable time.',
      category: 'Productivity',
      date: '2024-09-28',
      readTime: '6 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop'
    },
    {
      id: 3,
      title: 'Case Study: How StartupX Scaled to 100 Customers with 3 Employees',
      excerpt: 'A deep dive into how a lean startup used AI employees to handle customer support, sales outreach, and operations at scale.',
      category: 'Case Studies',
      date: '2024-09-22',
      readTime: '10 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop'
    },
    {
      id: 4,
      title: 'The Future of Work: AI Collaboration in 2025',
      excerpt: 'Explore emerging trends in human-AI collaboration and what it means for your business strategy this year.',
      category: 'AI Insights',
      date: '2024-09-15',
      readTime: '7 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=500&fit=crop'
    },
    {
      id: 5,
      title: 'Building High-Performance Teams with AI Project Managers',
      excerpt: 'Discover how AI project managers coordinate tasks, predict bottlenecks, and keep your team aligned on goals.',
      category: 'Team Management',
      date: '2024-09-08',
      readTime: '9 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=500&fit=crop'
    },
    {
      id: 6,
      title: 'Automating Customer Support: A Complete Guide',
      excerpt: 'Step-by-step strategies to implement AI-powered customer support that delights customers and reduces response times.',
      category: 'AI Automation',
      date: '2024-09-01',
      readTime: '12 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=500&fit=crop'
    },
    {
      id: 7,
      title: 'ROI Analysis: The True Cost Savings of AI Employees',
      excerpt: 'Hard numbers and real-world data on how AI employees impact your bottom line compared to traditional hiring.',
      category: 'Case Studies',
      date: '2024-08-25',
      readTime: '8 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'
    },
    {
      id: 8,
      title: 'AI Dashboards: Turning Data Into Actionable Insights',
      excerpt: 'Learn how AI-powered dashboards help you make faster, smarter decisions with real-time analytics and predictions.',
      category: 'Productivity',
      date: '2024-08-18',
      readTime: '6 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop'
    },
    {
      id: 9,
      title: 'Integration Strategies: Connecting Your Entire Tech Stack',
      excerpt: 'Best practices for integrating AI employees with your existing tools like Slack, Salesforce, and project management platforms.',
      category: 'AI Automation',
      date: '2024-08-11',
      readTime: '7 min read',
      author: {
        name: 'Siddhartha Nagula',
        avatar: '👨‍💻'
      },
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop'
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={50} staticity={30} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              The AI Automation Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Insights, strategies, and stories about the future of work with AI employees
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-background/60 backdrop-blur-xl border-border/40"
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-3 justify-center mb-16"
          >
            {categories.map((category, idx) => (
              <motion.button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.name
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'bg-background/60 backdrop-blur-xl border border-border/40 text-foreground/80 hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <category.icon size={16} />
                {category.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'All' && !searchQuery && (
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <FeaturedPostCard post={featuredPost} />
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {regularPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, idx) => (
                <BlogPostCard key={post.id} post={post} index={idx} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl text-muted-foreground">No articles found matching your criteria.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border border-border/40 p-12"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Never Miss an Update</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get the latest insights on AI automation, productivity tips, and case studies delivered to your inbox every week.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 bg-background/60 backdrop-blur-xl border-border/40"
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group"
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative h-64 md:h-full overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary to-accent text-white">
              Featured
            </span>
          </div>
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {post.category}
            </span>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-muted-foreground mb-6 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{post.author.avatar}</span>
              <div>
                <div className="text-sm font-medium">{post.author.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  {post.readTime}
                </div>
              </div>
            </div>
            <Button variant="ghost" className="group-hover:bg-primary/10">
              Read More
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BlogPostCard: React.FC<{ post: BlogPost; index: number }> = ({ post, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all group cursor-pointer"
      whileHover={{ y: -8 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-full bg-background/80 backdrop-blur-xl text-xs font-medium text-foreground">
            {post.category}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Calendar size={12} />
          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          <span>•</span>
          <Clock size={12} />
          {post.readTime}
        </div>
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.author.avatar}</span>
            <span className="text-sm font-medium">{post.author.name}</span>
          </div>
          <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPage;
