/**
 * VibeEmptyState - Stunning empty state inspired by Bolt.new, Lovable.dev, Replit
 *
 * Features:
 * - Big centered headline with gradient text
 * - Project category chips (AI Apps, Websites, Business Apps, etc.)
 * - Template suggestions with hover effects
 * - Quick start prompts
 * - Animated background elements
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Smartphone,
  Database,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Palette,
  Zap,
  ArrowRight,
  Code2,
  Layout,
  Bot
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';

interface VibeEmptyStateProps {
  onPromptSelect: (prompt: string) => void;
  onCategorySelect?: (category: string) => void;
}

interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
  gradient: string;
}

interface ProjectCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const categories: ProjectCategory[] = [
  { id: 'all', label: 'All', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'ai-apps', label: 'AI Apps', icon: <Bot className="h-3.5 w-3.5" /> },
  { id: 'websites', label: 'Websites', icon: <Globe className="h-3.5 w-3.5" /> },
  { id: 'business', label: 'Business Apps', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'mobile', label: 'Mobile', icon: <Smartphone className="h-3.5 w-3.5" /> },
];

const templates: ProjectTemplate[] = [
  {
    id: 'landing-page',
    title: 'Landing Page',
    description: 'Modern landing page with hero, features & CTA',
    icon: <Layout className="h-5 w-5" />,
    prompt: 'Create a modern landing page with a hero section, features grid, testimonials, and a call-to-action section. Use a clean, professional design with smooth animations.',
    category: 'websites',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    description: 'Data visualization dashboard with charts',
    icon: <BarChart3 className="h-5 w-5" />,
    prompt: 'Build an analytics dashboard with interactive charts, stats cards, recent activity feed, and data tables. Include dark mode support and responsive design.',
    category: 'business',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'ai-chatbot',
    title: 'AI Chatbot',
    description: 'Conversational AI interface with streaming',
    icon: <MessageSquare className="h-5 w-5" />,
    prompt: 'Create an AI chatbot interface with message bubbles, typing indicators, streaming text support, and a sleek input area. Add suggested prompts and conversation history.',
    category: 'ai-apps',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Store',
    description: 'Product catalog with cart & checkout',
    icon: <ShoppingCart className="h-5 w-5" />,
    prompt: 'Build an e-commerce product page with image gallery, size/color selectors, add to cart functionality, product reviews, and related products section.',
    category: 'business',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'portfolio',
    title: 'Portfolio Site',
    description: 'Creative portfolio with project showcase',
    icon: <Palette className="h-5 w-5" />,
    prompt: 'Design a creative portfolio website with an about section, project gallery with filters, skills section, and contact form. Use elegant animations and transitions.',
    category: 'websites',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    id: 'saas-app',
    title: 'SaaS Application',
    description: 'Full-stack SaaS with auth & database',
    icon: <Database className="h-5 w-5" />,
    prompt: 'Create a SaaS application with user authentication, dashboard, settings page, and subscription management. Include a modern UI with sidebar navigation.',
    category: 'business',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

const quickPrompts = [
  'Build a todo app with local storage',
  'Create a weather dashboard',
  'Design a blog with markdown support',
  'Make a real-time chat application',
];

export function VibeEmptyState({ onPromptSelect, onCategorySelect }: VibeEmptyStateProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Development</span>
          </div>

          <h1 className="mb-4 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            What will you{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text">
              build
            </span>{' '}
            today?
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Describe your idea and let AI transform it into working code.
            Build stunning apps, websites, and tools in minutes.
          </p>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onPromptSelect(template.prompt)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5 text-left backdrop-blur-sm transition-all duration-300',
                'hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5',
                hoveredTemplate === template.id && 'scale-[1.02]'
              )}
            >
              {/* Gradient overlay on hover */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5',
                template.gradient
              )} />

              <div className="relative z-10">
                {/* Icon with gradient background */}
                <div className={cn(
                  'mb-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-br p-2.5 text-white',
                  template.gradient
                )}>
                  {template.icon}
                </div>

                <h3 className="mb-1.5 font-semibold text-foreground">
                  {template.title}
                </h3>

                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <span>Start building</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">Or try a quick prompt:</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickPrompts.map((prompt, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => onPromptSelect(prompt)}
              >
                <Zap className="mr-1.5 h-3 w-3" />
                {prompt}
              </Badge>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span>Real-time preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Instant code generation</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>One-click deploy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
