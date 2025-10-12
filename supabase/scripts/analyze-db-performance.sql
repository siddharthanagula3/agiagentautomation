-- ================================================================
-- Database Performance Analysis Script
-- ================================================================
-- This script analyzes database performance, identifies slow queries,
-- and suggests optimizations
-- ================================================================

-- ================================================================
-- 1. TABLE SIZE ANALYSIS
-- ================================================================

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ================================================================
-- 2. INDEX ANALYSIS
-- ================================================================

-- Show all indexes and their usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read = 0 THEN 0
        ELSE (idx_tup_fetch::float / idx_tup_read::float) * 100
    END as hit_ratio_percent
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY hit_ratio_percent ASC;

-- Show unused indexes (potential candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND idx_tup_read = 0
    AND indexname NOT LIKE '%_pkey'  -- Don't suggest removing primary keys
ORDER BY tablename, indexname;

-- ================================================================
-- 3. SLOW QUERY ANALYSIS
-- ================================================================

-- Show top 10 slowest queries (requires pg_stat_statements extension)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC 
LIMIT 10;

-- Show queries with high I/O
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    shared_blks_read,
    shared_blks_hit,
    shared_blks_dirtied,
    shared_blks_written
FROM pg_stat_statements 
WHERE shared_blks_read > 1000
ORDER BY shared_blks_read DESC 
LIMIT 10;

-- ================================================================
-- 4. TABLE ACCESS PATTERNS
-- ================================================================

-- Show table access statistics
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Identify tables with high sequential scan ratio (potential indexing candidates)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    CASE 
        WHEN seq_scan + idx_scan = 0 THEN 0
        ELSE (seq_scan::float / (seq_scan + idx_scan)::float) * 100
    END as seq_scan_ratio
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND seq_scan + idx_scan > 0
ORDER BY seq_scan_ratio DESC;

-- ================================================================
-- 5. MISSING INDEX ANALYSIS
-- ================================================================

-- Analyze foreign key constraints that might need indexes
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================
-- 6. LOCK ANALYSIS
-- ================================================================

-- Show current locks
SELECT 
    l.locktype,
    l.database,
    l.relation::regclass,
    l.page,
    l.tuple,
    l.virtualxid,
    l.transactionid,
    l.classid,
    l.objid,
    l.objsubid,
    l.virtualtransaction,
    l.pid,
    l.mode,
    l.granted,
    a.usename,
    a.query,
    a.query_start,
    age(now(), a.query_start) AS "age"
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY a.query_start;

-- ================================================================
-- 7. CONNECTION ANALYSIS
-- ================================================================

-- Show current connections
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- Show long-running queries
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    query_start,
    state,
    query
FROM pg_stat_activity 
WHERE datname = current_database()
    AND state = 'active'
    AND query NOT LIKE '%pg_stat_activity%'
    AND query_start < now() - interval '1 minute'
ORDER BY query_start;

-- ================================================================
-- 8. VACUUM AND ANALYZE RECOMMENDATIONS
-- ================================================================

-- Tables that need vacuuming
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    CASE 
        WHEN n_live_tup = 0 THEN 0
        ELSE (n_dead_tup::float / n_live_tup::float) * 100
    END as dead_tuple_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND n_dead_tup > 0
ORDER BY dead_tuple_ratio DESC;

-- ================================================================
-- 9. PERFORMANCE RECOMMENDATIONS
-- ================================================================

-- Generate index recommendations based on foreign keys
SELECT 
    'CREATE INDEX CONCURRENTLY idx_' || tc.table_name || '_' || kcu.column_name || 
    ' ON ' || tc.table_schema || '.' || tc.table_name || ' (' || kcu.column_name || ');' as recommended_index
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = tc.table_schema 
            AND tablename = tc.table_name 
            AND indexdef LIKE '%' || kcu.column_name || '%'
    )
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================
-- 10. SUMMARY REPORT
-- ================================================================

-- Database size summary
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Active Connections' as metric,
    COUNT(*)::text as value
FROM pg_stat_activity 
WHERE datname = current_database()
UNION ALL
SELECT 
    'Long Running Queries' as metric,
    COUNT(*)::text as value
FROM pg_stat_activity 
WHERE datname = current_database()
    AND state = 'active'
    AND query_start < now() - interval '1 minute'
    AND query NOT LIKE '%pg_stat_activity%';
