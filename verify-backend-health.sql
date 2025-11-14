-- =============================================
-- Backend Health Verification Script
-- Run this in Supabase SQL Editor after deploying fixes
-- =============================================

-- =============================================
-- 1. VERIFY RLS POLICIES
-- =============================================

SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  ARRAY_AGG(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC;

-- Expected: All user tables should have 1-4 policies

-- =============================================
-- 2. VERIFY INDEXES EXIST
-- =============================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check for critical indexes:
-- ✓ idx_chat_messages_session_created
-- ✓ idx_token_usage_user_date
-- ✓ idx_purchased_employees_user_active
-- ✓ idx_webhook_audit_log_event_action

-- =============================================
-- 3. CHECK TOKEN USAGE TRACKING
-- =============================================

-- Recent token usage (should have entries if LLM calls made)
SELECT
  COUNT(*) as total_records,
  MAX(created_at) as latest_entry,
  SUM(total_cost) as total_cost_tracked,
  SUM(total_tokens) as total_tokens_tracked
FROM token_usage
WHERE created_at > NOW() - INTERVAL '24 hours';

-- By provider
SELECT
  provider,
  COUNT(*) as calls,
  SUM(total_tokens) as tokens,
  ROUND(SUM(total_cost)::numeric, 4) as cost
FROM token_usage
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY provider
ORDER BY cost DESC;

-- =============================================
-- 4. VERIFY WEBHOOK AUDIT LOG
-- =============================================

-- Check for idempotency records
SELECT
  event_type,
  action,
  COUNT(*) as count
FROM webhook_audit_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type, action
ORDER BY event_type, action;

-- Check for any failed webhook processing
SELECT
  event_id,
  event_type,
  action,
  details,
  timestamp
FROM webhook_audit_log
WHERE action = 'processing_failed'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC
LIMIT 20;

-- =============================================
-- 5. CHECK MARKETPLACE INTEGRITY
-- =============================================

-- Verify no orphaned purchased_employees
SELECT
  pe.id,
  pe.user_id,
  pe.employee_id,
  pe.name,
  ae.name as ai_employee_name,
  CASE
    WHEN ae.id IS NULL THEN '❌ ORPHANED'
    ELSE '✓ OK'
  END as status
FROM purchased_employees pe
LEFT JOIN ai_employees ae ON pe.employee_id = ae.employee_id
WHERE ae.id IS NULL;

-- Expected: 0 rows (no orphaned records)

-- Count employees by user
SELECT
  u.email,
  COUNT(pe.id) as employees_hired,
  COUNT(DISTINCT pe.employee_id) as unique_employees
FROM users u
LEFT JOIN purchased_employees pe ON u.id = pe.user_id AND pe.is_active = true
GROUP BY u.id, u.email
ORDER BY employees_hired DESC
LIMIT 20;

-- =============================================
-- 6. VERIFY CHAT SESSIONS
-- =============================================

-- Active chat sessions
SELECT
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT employee_id) as unique_employees
FROM chat_sessions
WHERE is_active = true;

-- Sessions with message counts
SELECT
  cs.id,
  cs.employee_id,
  cs.title,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message_at
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
WHERE cs.is_active = true
GROUP BY cs.id, cs.employee_id, cs.title
ORDER BY last_message_at DESC NULLS LAST
LIMIT 20;

-- =============================================
-- 7. CHECK SUBSCRIPTION STATUS
-- =============================================

-- User subscription distribution
SELECT
  plan,
  plan_status,
  COUNT(*) as user_count,
  COUNT(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 END) as with_stripe_sub
FROM users
GROUP BY plan, plan_status
ORDER BY user_count DESC;

-- Active subscriptions
SELECT
  u.email,
  u.plan,
  u.plan_status,
  u.stripe_subscription_id,
  u.subscription_start_date,
  u.subscription_end_date
FROM users u
WHERE u.plan IN ('pro', 'max')
  AND u.plan_status = 'active'
ORDER BY u.subscription_start_date DESC
LIMIT 20;

-- =============================================
-- 8. CHECK MULTI-AGENT CONVERSATIONS
-- =============================================

-- Active multi-agent conversations
SELECT
  status,
  conversation_type,
  COUNT(*) as count,
  AVG(active_agents_count) as avg_agents,
  AVG(total_messages) as avg_messages
FROM multi_agent_conversations
GROUP BY status, conversation_type
ORDER BY count DESC;

-- Recent conversations with participants
SELECT
  mac.id,
  mac.title,
  mac.status,
  mac.active_agents_count,
  mac.total_messages,
  COUNT(cp.id) as participant_count
FROM multi_agent_conversations mac
LEFT JOIN conversation_participants cp ON mac.id = cp.conversation_id
WHERE mac.created_at > NOW() - INTERVAL '7 days'
GROUP BY mac.id, mac.title, mac.status, mac.active_agents_count, mac.total_messages
ORDER BY mac.created_at DESC
LIMIT 20;

-- =============================================
-- 9. DATABASE SIZE AND GROWTH
-- =============================================

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 20;

-- =============================================
-- 10. SLOW QUERY CHECK (if pg_stat_statements enabled)
-- =============================================

SELECT
  SUBSTRING(query, 1, 100) as query_snippet,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms,
  ROUND(total_exec_time::numeric, 2) as total_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND mean_exec_time > 10 -- queries averaging > 10ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- =============================================
-- 11. INDEX USAGE STATISTICS
-- =============================================

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 30;

-- Check for unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================
-- 12. CONNECTION POOL STATUS
-- =============================================

SELECT
  COUNT(*) as total_connections,
  COUNT(CASE WHEN state = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle,
  COUNT(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();

-- =============================================
-- 13. HEALTH CHECK SUMMARY
-- =============================================

SELECT
  'RLS Policies' as check_name,
  COUNT(*) as value,
  'policies' as unit,
  CASE WHEN COUNT(*) > 30 THEN '✓ PASS' ELSE '⚠️ WARNING' END as status
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Performance Indexes',
  COUNT(*),
  'indexes',
  CASE WHEN COUNT(*) > 20 THEN '✓ PASS' ELSE '⚠️ WARNING' END
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'

UNION ALL

SELECT
  'Token Usage Records (24h)',
  COUNT(*),
  'records',
  CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '❌ FAIL' END
FROM token_usage
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Active Chat Sessions',
  COUNT(*),
  'sessions',
  CASE WHEN COUNT(*) >= 0 THEN '✓ PASS' ELSE '❌ FAIL' END
FROM chat_sessions
WHERE is_active = true

UNION ALL

SELECT
  'Orphaned Employees',
  COUNT(*),
  'records',
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '❌ FAIL' END
FROM purchased_employees pe
LEFT JOIN ai_employees ae ON pe.employee_id = ae.employee_id
WHERE ae.id IS NULL

UNION ALL

SELECT
  'Database Size',
  ROUND((pg_database_size(current_database()) / 1024.0 / 1024.0)::numeric, 2),
  'MB',
  CASE
    WHEN pg_database_size(current_database()) < 1024*1024*1024 THEN '✓ PASS'
    WHEN pg_database_size(current_database()) < 5*1024*1024*1024 THEN '⚠️ WARNING'
    ELSE '❌ CRITICAL'
  END;

-- =============================================
-- EXPECTED RESULTS AFTER FIXES:
-- =============================================

-- ✓ All tables have RLS policies
-- ✓ 40+ performance indexes exist
-- ✓ Token usage has recent entries (if LLM calls made)
-- ✓ No orphaned purchased_employees
-- ✓ Webhook audit log has processed events
-- ✓ Chat sessions have messages
-- ✓ No slow queries (all < 50ms average)
-- ✓ Indexes are being used (idx_scan > 0)
-- ✓ Database size reasonable (< 1GB for small user base)

-- =============================================
-- TROUBLESHOOTING:
-- =============================================

-- If token_usage is empty:
-- 1. Check netlify/functions/utils/token-tracking.ts uses SERVICE_ROLE key
-- 2. Make a test LLM request
-- 3. Check Netlify function logs for errors

-- If orphaned purchased_employees found:
-- 1. Run migration: 20250113000004_fix_marketplace_integrity.sql

-- If indexes missing:
-- 1. Run migration: 20250113000003_add_critical_performance_indexes.sql

-- If slow queries found:
-- 1. Add indexes for frequently queried columns
-- 2. Use EXPLAIN ANALYZE to diagnose query plans
-- 3. Consider query optimization (LIMIT, WHERE clauses)

-- =============================================
-- END OF VERIFICATION SCRIPT
-- =============================================
