-- ================================================================
-- Missing Foreign Key Indexes Migration
-- ================================================================
-- Adds critical indexes on foreign key columns for performance
-- Fixes Bug #4: Missing Foreign Key Indexes
-- Impact: 10-100x faster queries on JOINs
-- ================================================================

-- ================================================================
-- AUTOMATION TABLES INDEXES
-- ================================================================
-- Index on automation_nodes.workflow_id for faster workflow queries
CREATE INDEX IF NOT EXISTS idx_automation_nodes_workflow
  ON public.automation_nodes(workflow_id);

-- Index on automation_connections.workflow_id for faster workflow queries
CREATE INDEX IF NOT EXISTS idx_automation_connections_workflow
  ON public.automation_connections(workflow_id);

-- ================================================================
-- CREDIT SYSTEM INDEXES
-- ================================================================
-- Index on credit_transactions.user_credit_id for faster user credit lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_credit
  ON public.credit_transactions(user_credit_id);

-- ================================================================
-- SUPPORT SYSTEM INDEXES
-- ================================================================
-- Index on support_ticket_messages.ticket_id for faster ticket message queries
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON public.support_ticket_messages(ticket_id);

-- ================================================================
-- BLOG SYSTEM INDEXES
-- ================================================================
-- Index on blog_comments.post_id for faster comment queries by post
CREATE INDEX IF NOT EXISTS idx_blog_comments_post
  ON public.blog_comments(post_id);

-- Index on blog_comments.parent_id for faster nested comment queries
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent
  ON public.blog_comments(parent_id)
  WHERE parent_id IS NOT NULL;

-- ================================================================
-- VIBE INTERFACE INDEXES
-- ================================================================
-- Index on vibe_sessions.updated_at for faster recent session queries
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_updated
  ON public.vibe_sessions(updated_at DESC);

-- ================================================================
-- TOKEN SYSTEM INDEXES
-- ================================================================
-- Index on token_transactions.transaction_type for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_token_transactions_type
  ON public.token_transactions(transaction_type);

-- Index on token_transactions.user_id for faster user transaction queries
-- (Adding this as a bonus for even better performance)
CREATE INDEX IF NOT EXISTS idx_token_transactions_user
  ON public.token_transactions(user_id);

-- Index on token_transactions.created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_token_transactions_created
  ON public.token_transactions(created_at DESC);

-- ================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ================================================================

-- Composite index for filtering vibe_sessions by user and status
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_user_status
  ON public.vibe_sessions(user_id, status)
  WHERE status IS NOT NULL;

-- Composite index for support tickets by user and status
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status
  ON public.support_tickets(user_id, status)
  WHERE status IS NOT NULL;

-- ================================================================
-- ANALYZE TABLES
-- ================================================================
-- Update table statistics for query planner optimization
ANALYZE public.automation_nodes;
ANALYZE public.automation_connections;
ANALYZE public.credit_transactions;
ANALYZE public.support_ticket_messages;
ANALYZE public.blog_comments;
ANALYZE public.vibe_sessions;
ANALYZE public.token_transactions;

-- ================================================================
-- COMMENTS
-- ================================================================
COMMENT ON INDEX idx_automation_nodes_workflow IS
  'Index on workflow_id for faster workflow-related queries';

COMMENT ON INDEX idx_automation_connections_workflow IS
  'Index on workflow_id for faster workflow connection queries';

COMMENT ON INDEX idx_credit_transactions_user_credit IS
  'Index on user_credit_id for faster user credit transaction queries';

COMMENT ON INDEX idx_support_ticket_messages_ticket IS
  'Index on ticket_id for faster ticket message queries';

COMMENT ON INDEX idx_blog_comments_post IS
  'Index on post_id for faster comment queries by post';

COMMENT ON INDEX idx_blog_comments_parent IS
  'Partial index on parent_id for faster nested comment queries';

COMMENT ON INDEX idx_vibe_sessions_updated IS
  'Index on updated_at DESC for faster recent session queries';

COMMENT ON INDEX idx_token_transactions_type IS
  'Index on transaction_type for faster filtering by transaction type';
