// Marketing Website API Services
// Connects frontend to Supabase Edge Functions and database

import { supabase } from '@shared/lib/supabase-client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ============================================================================
// CONTACT FORM
// ============================================================================

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  companySize?: string;
  message: string;
  source?: string;
}

export async function submitContactForm(data: ContactFormData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/contact-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit contact form');
  }

  return response.json();
}

// ============================================================================
// NEWSLETTER
// ============================================================================

export interface NewsletterData {
  email: string;
  name?: string;
  source?: string;
  tags?: string[];
}

export async function subscribeToNewsletter(data: NewsletterData) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/newsletter-subscribe`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to subscribe to newsletter');
  }

  return response.json();
}

// ============================================================================
// BLOG POSTS
// ============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url?: string;
  author: {
    id: string;
    display_name: string;
    avatar_emoji: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  published_at: string;
  read_time: string;
  views: number;
  featured: boolean;
}

export interface BlogPostsParams {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
}

export async function getBlogPosts(params: BlogPostsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.set('category', params.category);
  if (params.search) queryParams.set('search', params.search);
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());
  if (params.featured) queryParams.set('featured', 'true');

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/blog-posts?${queryParams}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch blog posts');
  }

  return response.json();
}

export async function getBlogCategories() {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// ============================================================================
// RESOURCES
// ============================================================================

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Guide' | 'Template' | 'Video' | 'Ebook' | 'Webinar';
  category: string;
  duration?: string;
  download_count: number;
  thumbnail_url?: string;
  featured: boolean;
}

export async function getResources(type?: string) {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (type && type !== 'All') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function trackResourceDownload(
  resourceId: string,
  userEmail?: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/resource-download`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId, userEmail }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to track download');
  }

  return response.json();
}

// ============================================================================
// PRICING PLANS
// ============================================================================

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  not_included?: string[];
  popular: boolean;
  color_gradient: string;
}

export async function getPricingPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('active', true)
    .order('display_order');

  if (error) throw error;
  return data as PricingPlan[];
}

// ============================================================================
// HELP & SUPPORT
// ============================================================================

export interface SupportCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  color_gradient: string;
  article_count: number;
}

export interface HelpArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  views: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export async function getSupportCategories() {
  const { data, error } = await supabase
    .from('support_categories')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return data as SupportCategory[];
}

export async function getHelpArticles(categorySlug?: string) {
  let query = supabase
    .from('help_articles')
    .select(
      `
      *,
      category:support_categories(*)
    `
    )
    .eq('published', true);

  if (categorySlug) {
    const { data: category } = await supabase
      .from('support_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getFAQItems() {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('published', true)
    .order('display_order');

  if (error) throw error;
  return data as FAQItem[];
}

// ============================================================================
// SUPPORT TICKETS (Authenticated Users Only)
// ============================================================================

export interface SupportTicket {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: string;
}

export async function createSupportTicket(ticket: SupportTicket) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(ticket)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(
      `
      *,
      category:support_categories(*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
