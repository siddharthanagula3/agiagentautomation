-- ================================================================
-- Workforce Tables Migration
-- ================================================================
-- Creates tables for workforce execution tracking system
-- Fixes Bug #1: Missing Tables - workforce_executions and workforce_tasks
-- ================================================================

-- ================================================================
-- WORKFORCE EXECUTIONS TABLE
-- ================================================================
-- Tracks overall execution of workforce tasks initiated by users
CREATE TABLE IF NOT EXISTS public.workforce_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'planning', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  intent_type text,
  domain text,
  complexity text,
  total_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  failed_tasks integer NOT NULL DEFAULT 0,
  estimated_time integer,
  actual_time integer,
  estimated_cost numeric(10,4) DEFAULT 0,
  actual_cost numeric(10,4) NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- WORKFORCE TASKS TABLE
-- ================================================================
-- Tracks individual tasks within a workforce execution
CREATE TABLE IF NOT EXISTS public.workforce_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.workforce_executions(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  complexity text NOT NULL,
  assigned_agent text NOT NULL,
  dependencies text[] DEFAULT '{}',
  result jsonb,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  estimated_time integer,
  actual_time integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_per_execution UNIQUE (execution_id, task_id)
);

-- ================================================================
-- INDEXES
-- ================================================================
-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workforce_executions_user_id ON public.workforce_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workforce_executions_status ON public.workforce_executions(status);
CREATE INDEX IF NOT EXISTS idx_workforce_executions_created_at ON public.workforce_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workforce_executions_user_status ON public.workforce_executions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_workforce_tasks_execution_id ON public.workforce_tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_workforce_tasks_status ON public.workforce_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workforce_tasks_assigned_agent ON public.workforce_tasks(assigned_agent);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
-- Enable RLS on workforce tables
ALTER TABLE public.workforce_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own executions
CREATE POLICY "Users can view own executions"
  ON public.workforce_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own executions
CREATE POLICY "Users can insert own executions"
  ON public.workforce_executions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own executions
CREATE POLICY "Users can update own executions"
  ON public.workforce_executions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own executions
CREATE POLICY "Users can delete own executions"
  ON public.workforce_executions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can view tasks for their executions
CREATE POLICY "Users can view own execution tasks"
  ON public.workforce_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workforce_executions
      WHERE id = workforce_tasks.execution_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can insert tasks for their executions
CREATE POLICY "Users can insert own execution tasks"
  ON public.workforce_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workforce_executions
      WHERE id = workforce_tasks.execution_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can update tasks for their executions
CREATE POLICY "Users can update own execution tasks"
  ON public.workforce_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workforce_executions
      WHERE id = workforce_tasks.execution_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can delete tasks for their executions
CREATE POLICY "Users can delete own execution tasks"
  ON public.workforce_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workforce_executions
      WHERE id = workforce_tasks.execution_id
      AND user_id = auth.uid()
    )
  );

-- ================================================================
-- VIEWS FOR DASHBOARD STATS
-- ================================================================

-- User Dashboard Stats View
-- Aggregates statistics for dashboard display
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT
  we.user_id,
  COUNT(DISTINCT pe.id) as total_employees,
  COUNT(DISTINCT CASE WHEN we.status IN ('pending', 'planning', 'running', 'paused') THEN we.id END) as active_executions,
  COUNT(DISTINCT we.id) as total_executions,
  SUM(we.completed_tasks) as total_completed_tasks,
  SUM(we.failed_tasks) as total_failed_tasks,
  SUM(we.actual_cost) as total_spent,
  COUNT(DISTINCT CASE WHEN we.status IN ('pending', 'planning', 'running', 'paused') THEN pe.id END) as active_employees
FROM
  public.workforce_executions we
  LEFT JOIN public.purchased_employees pe ON pe.user_id = we.user_id
GROUP BY
  we.user_id;

-- User Recent Activity View
-- Shows recent activity for users (last 100 items)
CREATE OR REPLACE VIEW public.user_recent_activity AS
SELECT
  we.user_id,
  we.id as execution_id,
  we.input_text as activity,
  we.status,
  we.created_at,
  'execution' as activity_type
FROM
  public.workforce_executions we
ORDER BY
  we.created_at DESC
LIMIT 100;

-- ================================================================
-- UPDATED AT TRIGGER
-- ================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workforce_execution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workforce_executions
DROP TRIGGER IF EXISTS update_workforce_executions_updated_at ON public.workforce_executions;
CREATE TRIGGER update_workforce_executions_updated_at
  BEFORE UPDATE ON public.workforce_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workforce_execution_updated_at();

-- ================================================================
-- COMMENTS
-- ================================================================
COMMENT ON TABLE public.workforce_executions IS 'Tracks overall execution of AI workforce tasks';
COMMENT ON TABLE public.workforce_tasks IS 'Tracks individual tasks within workforce executions';
COMMENT ON VIEW public.user_dashboard_stats IS 'Aggregated statistics for user dashboard';
COMMENT ON VIEW public.user_recent_activity IS 'Recent activity feed for users';
