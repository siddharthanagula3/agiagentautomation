-- ================================================================
-- AGI Agent Automation Platform - Complete Database Schema
-- ================================================================
-- This is a comprehensive schema that sets up all tables, indexes,
-- and Row Level Security (RLS) policies for the platform
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================================================
-- CORE USER TABLES
-- ================================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  name text,
  avatar text,
  role text DEFAULT 'user'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  preferences jsonb DEFAULT '{}'::jsonb,
  phone text,
  location text,
  plan text DEFAULT 'free'::text,
  subscription_end_date timestamp with time zone,
  plan_status text DEFAULT 'active'::text,
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_period text DEFAULT 'monthly'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  name text,
  phone text,
  bio text,
  avatar_url text,
  timezone text DEFAULT 'America/New_York'::text,
  language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  workflow_alerts boolean DEFAULT true,
  employee_updates boolean DEFAULT false,
  system_maintenance boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  weekly_reports boolean DEFAULT true,
  instant_alerts boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  session_timeout integer DEFAULT 30,
  theme text DEFAULT 'dark'::text,
  auto_save boolean DEFAULT true,
  debug_mode boolean DEFAULT false,
  analytics_enabled boolean DEFAULT true,
  cache_size text DEFAULT '1GB'::text,
  backup_frequency text DEFAULT 'daily'::text,
  retention_period integer DEFAULT 30,
  max_concurrent_jobs integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_info text,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================================
-- SUBSCRIPTION & BILLING
-- ================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric,
  price_yearly numeric,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  not_included jsonb DEFAULT '[]'::jsonb,
  popular boolean DEFAULT false,
  color_gradient text DEFAULT 'from-blue-500 to-cyan-500'::text,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  plan_id uuid,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'paused'::text])),
  billing_cycle text DEFAULT 'monthly'::text CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

-- User credits
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  subscription_id uuid,
  bonus_credits numeric DEFAULT 0.00,
  purchased_credits numeric DEFAULT 0.00,
  total_credits numeric GENERATED ALWAYS AS (bonus_credits + purchased_credits) STORED,
  credits_used numeric DEFAULT 0.00,
  last_credit_purchase timestamp with time zone,
  first_time_user boolean DEFAULT true,
  weekly_billing_enabled boolean DEFAULT false,
  last_billing_date timestamp with time zone,
  next_billing_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_credits_pkey PRIMARY KEY (id),
  CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_credits_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id)
);

-- Credit transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_credit_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['bonus'::text, 'purchase'::text, 'usage'::text, 'refund'::text, 'adjustment'::text])),
  amount numeric NOT NULL,
  description text,
  ai_employee_id uuid,
  workflow_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT credit_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT credit_transactions_user_credit_id_fkey FOREIGN KEY (user_credit_id) REFERENCES public.user_credits(id)
);

-- ================================================================
-- CHAT & AI EMPLOYEES
-- ================================================================

-- Purchased AI Employees (Free Instant Hiring)
CREATE TABLE IF NOT EXISTS public.purchased_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  provider text NOT NULL,
  is_active boolean DEFAULT true,
  purchased_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchased_employees_pkey PRIMARY KEY (id),
  CONSTRAINT purchased_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT purchased_employees_unique UNIQUE (user_id, employee_id)
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id character varying NOT NULL,
  role character varying NOT NULL,
  provider character varying NOT NULL,
  title character varying,
  is_active boolean DEFAULT true,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying]::text[])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS public.token_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  provider text NOT NULL CHECK (provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'google'::text, 'perplexity'::text])),
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  input_cost numeric NOT NULL DEFAULT 0,
  output_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT token_usage_pkey PRIMARY KEY (id),
  CONSTRAINT token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================================
-- AUTOMATION & WORKFLOWS
-- ================================================================

-- Automation workflows
CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  category character varying NOT NULL,
  trigger_type character varying NOT NULL,
  trigger_config jsonb DEFAULT '{}'::jsonb,
  workflow_config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  is_template boolean DEFAULT false,
  version integer DEFAULT 1,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_executed_at timestamp with time zone,
  CONSTRAINT automation_workflows_pkey PRIMARY KEY (id),
  CONSTRAINT automation_workflows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Automation nodes
CREATE TABLE IF NOT EXISTS public.automation_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  node_id character varying NOT NULL,
  node_type character varying NOT NULL,
  node_config jsonb NOT NULL,
  position_x numeric,
  position_y numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT automation_nodes_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id) ON DELETE CASCADE
);

-- Automation connections
CREATE TABLE IF NOT EXISTS public.automation_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  source_node_id character varying NOT NULL,
  target_node_id character varying NOT NULL,
  connection_type character varying DEFAULT 'flow'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_connections_pkey PRIMARY KEY (id),
  CONSTRAINT automation_connections_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id) ON DELETE CASCADE
);

-- Automation executions
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  trigger_source character varying,
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  error_stack text,
  execution_log text[],
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_ms integer,
  executed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_executions_pkey PRIMARY KEY (id),
  CONSTRAINT automation_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT automation_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id)
);

-- Scheduled tasks
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  name character varying NOT NULL,
  cron_expression character varying NOT NULL,
  timezone character varying DEFAULT 'UTC'::character varying,
  is_active boolean DEFAULT true,
  next_run_at timestamp with time zone,
  last_run_at timestamp with time zone,
  total_runs integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scheduled_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT scheduled_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT scheduled_tasks_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id)
);

-- ================================================================
-- INTEGRATIONS & WEBHOOKS
-- ================================================================

-- Integration configurations
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_type character varying NOT NULL,
  integration_name character varying NOT NULL,
  is_active boolean DEFAULT true,
  credentials jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  rate_limit integer,
  last_used_at timestamp with time zone,
  total_uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT integration_configs_pkey PRIMARY KEY (id),
  CONSTRAINT integration_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid,
  name character varying NOT NULL,
  webhook_url character varying NOT NULL UNIQUE,
  webhook_secret character varying,
  is_active boolean DEFAULT true,
  allowed_methods text[] DEFAULT ARRAY['POST'::text],
  headers_config jsonb DEFAULT '{}'::jsonb,
  last_triggered_at timestamp with time zone,
  total_triggers integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT webhook_configs_pkey PRIMARY KEY (id),
  CONSTRAINT webhook_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT webhook_configs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id)
);

-- ================================================================
-- SUPPORT & MARKETING
-- ================================================================

-- Support categories
CREATE TABLE IF NOT EXISTS public.support_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'HelpCircle'::text,
  color_gradient text DEFAULT 'from-blue-500 to-cyan-500'::text,
  article_count integer DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_categories_pkey PRIMARY KEY (id)
);

-- Help articles
CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  views integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT help_articles_pkey PRIMARY KEY (id),
  CONSTRAINT help_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.support_categories(id)
);

-- FAQ items
CREATE TABLE IF NOT EXISTS public.faq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  display_order integer DEFAULT 0,
  published boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faq_items_pkey PRIMARY KEY (id)
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting_customer'::text, 'resolved'::text, 'closed'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  category_id uuid,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT support_tickets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.support_categories(id),
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid,
  user_id uuid,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT support_ticket_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  phone text,
  company_size text,
  message text NOT NULL,
  status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'closed'::text, 'spam'::text])),
  source text DEFAULT 'contact_form'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);

-- Sales leads
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_submission_id uuid,
  email text NOT NULL,
  company text,
  lead_score integer DEFAULT 0,
  status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'demo_scheduled'::text, 'proposal_sent'::text, 'negotiating'::text, 'won'::text, 'lost'::text])),
  assigned_to uuid,
  estimated_value numeric,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_leads_pkey PRIMARY KEY (id),
  CONSTRAINT sales_leads_contact_submission_id_fkey FOREIGN KEY (contact_submission_id) REFERENCES public.contact_submissions(id),
  CONSTRAINT sales_leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'unsubscribed'::text, 'bounced'::text])),
  source text DEFAULT 'website'::text,
  tags jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);

-- ================================================================
-- BLOG & CONTENT
-- ================================================================

-- Blog categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  post_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_categories_pkey PRIMARY KEY (id)
);

-- Blog authors
CREATE TABLE IF NOT EXISTS public.blog_authors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  avatar_emoji text DEFAULT '👨‍💻'::text,
  social_links jsonb DEFAULT '{}'::jsonb,
  post_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_authors_pkey PRIMARY KEY (id),
  CONSTRAINT blog_authors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  image_url text,
  author_id uuid,
  category_id uuid,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  read_time text DEFAULT '5 min read'::text,
  views integer DEFAULT 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.blog_authors(id),
  CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id)
);

-- Blog comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  content text NOT NULL,
  parent_id uuid,
  approved boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_comments_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT blog_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT blog_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id)
);

-- Resources
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['Guide'::text, 'Template'::text, 'Video'::text, 'Ebook'::text, 'Webinar'::text])),
  category text NOT NULL,
  file_url text,
  thumbnail_url text,
  duration text,
  download_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  published boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resources_pkey PRIMARY KEY (id)
);

-- Resource downloads
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  user_id uuid,
  user_email text,
  downloaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resource_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT resource_downloads_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT resource_downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ================================================================
-- SYSTEM & SECURITY
-- ================================================================

-- API rate limits
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_endpoint character varying NOT NULL,
  request_count integer DEFAULT 0,
  limit_per_hour integer NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_rate_limits_pkey PRIMARY KEY (id),
  CONSTRAINT api_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User API keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  CONSTRAINT user_api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT user_api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Cache entries
CREATE TABLE IF NOT EXISTS public.cache_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_key character varying NOT NULL UNIQUE,
  cache_value jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  accessed_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cache_entries_pkey PRIMARY KEY (id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying]::text[])),
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  link character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON public.users(plan_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);

-- Purchased employees indexes
CREATE INDEX IF NOT EXISTS idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_purchased_employees_purchased_at ON public.purchased_employees(purchased_at DESC);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON public.chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_automation_workflows_user_id ON public.automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_is_active ON public.automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_executions_workflow_id ON public.automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);

-- Token usage indexes
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can view their own user profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own user profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own user profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Purchased employees policies
CREATE POLICY "Users can view their own hired employees" ON public.purchased_employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can hire employees (insert)" ON public.purchased_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hired employees" ON public.purchased_employees
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hired employees" ON public.purchased_employees
  FOR DELETE USING (auth.uid() = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages from their sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Automation workflows policies
CREATE POLICY "Users can view their own workflows" ON public.automation_workflows
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can create workflows" ON public.automation_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON public.automation_workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON public.automation_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Token usage policies
CREATE POLICY "Users can view their own token usage" ON public.token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for marketing tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription plans are publicly readable" ON public.subscription_plans
  FOR SELECT USING (active = true);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blog posts are publicly readable" ON public.blog_posts
  FOR SELECT USING (published = true);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published FAQs are publicly readable" ON public.faq_items
  FOR SELECT USING (published = true);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published resources are publicly readable" ON public.resources
  FOR SELECT USING (published = true);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchased_employees_updated_at BEFORE UPDATE ON public.purchased_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- INITIAL DATA (Optional)
-- ================================================================

-- Insert default subscription plans if not exist
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, popular, color_gradient, not_included)
VALUES
  (
    'Pay Per Employee',
    'pay-per-employee',
    'Perfect for teams that want flexibility',
    1,
    12,
    '["$1 per AI employee per month", "Pay-as-you-go after purchase", "No upfront commitment", "Cancel anytime", "Weekly billing", "All AI features included", "24/7 Support"]'::jsonb,
    false,
    'from-blue-500 to-cyan-500',
    '[]'::jsonb
  ),
  (
    'All Access',
    'all-access',
    'Best value - Hire unlimited AI employees',
    19,
    190,
    '["Hire ALL AI employees (165+ specialized agents)", "$10 bonus credits for first-time users", "Pay-as-you-go after credits", "Weekly billing", "All AI features included", "Priority support", "Advanced analytics", "Custom integrations"]'::jsonb,
    true,
    'from-purple-500 to-pink-500',
    '[]'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'Custom pricing for large organizations',
    NULL,
    NULL,
    '["Unlimited AI employees", "Custom credit packages", "Volume discounts", "Dedicated account manager", "SLA guarantees", "Custom integrations", "Advanced security", "Training & onboarding", "24/7 Priority support"]'::jsonb,
    false,
    'from-orange-500 to-red-500',
    '[]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- SCHEMA COMPLETE
-- ================================================================
