-- Comprehensive Database Schema for AGI Agent Automation
-- This file contains all the necessary tables and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB
);

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) UNIQUE,
  employee_id TEXT UNIQUE,
  department TEXT,
  position TEXT,
  salary DECIMAL,
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contact_info JSONB
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'assignment', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB,
  action_url TEXT
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) UNIQUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_employees table
CREATE TABLE IF NOT EXISTS public.ai_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capabilities JSONB,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'maintenance')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  configuration JSONB,
  performance_metrics JSONB
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  ai_employee_id UUID REFERENCES public.ai_employees(id),
  message TEXT NOT NULL,
  is_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed'))
);

-- Create billing table
CREATE TABLE IF NOT EXISTS public.billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create workforce table
CREATE TABLE IF NOT EXISTS public.workforce (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  members JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB
);

-- Enable Row Level Security on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for jobs table
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for employees table
CREATE POLICY "Users can view own employee record" ON public.employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employee record" ON public.employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employee record" ON public.employees
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for analytics table
CREATE POLICY "Users can view own analytics" ON public.analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for settings table
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for ai_employees table
CREATE POLICY "Users can view ai employees" ON public.ai_employees
  FOR SELECT USING (true);

CREATE POLICY "Users can insert ai employees" ON public.ai_employees
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update ai employees" ON public.ai_employees
  FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for chat_messages table
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for reports table
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for billing table
CREATE POLICY "Users can view own billing" ON public.billing
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing" ON public.billing
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing" ON public.billing
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for workforce table
CREATE POLICY "Users can view own workforce" ON public.workforce
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workforce" ON public.workforce
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workforce" ON public.workforce
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_ai_employee_id ON public.chat_messages(ai_employee_id);

-- Grant necessary permissions
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.analytics TO authenticated;
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.ai_employees TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.billing TO authenticated;
GRANT ALL ON public.workforce TO authenticated;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_jobs', (SELECT COUNT(*) FROM public.jobs WHERE created_by = user_uuid),
    'completed_jobs', (SELECT COUNT(*) FROM public.jobs WHERE created_by = user_uuid AND status = 'completed'),
    'pending_jobs', (SELECT COUNT(*) FROM public.jobs WHERE created_by = user_uuid AND status = 'pending'),
    'unread_notifications', (SELECT COUNT(*) FROM public.notifications WHERE user_id = user_uuid AND read = false),
    'ai_employees_count', (SELECT COUNT(*) FROM public.ai_employees WHERE created_by = user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_stats', public.get_user_stats(user_uuid),
    'recent_jobs', (SELECT json_agg(j) FROM (
      SELECT id, title, status, created_at 
      FROM public.jobs 
      WHERE created_by = user_uuid 
      ORDER BY created_at DESC 
      LIMIT 5
    ) j),
    'recent_notifications', (SELECT json_agg(n) FROM (
      SELECT id, title, type, created_at, read
      FROM public.notifications 
      WHERE user_id = user_uuid 
      ORDER BY created_at DESC 
      LIMIT 10
    ) n)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
