# 🗄️ COMPLETE DATABASE SETUP SCRIPT
## Run These SQL Commands in Supabase SQL Editor

**IMPORTANT**: Run these commands IN ORDER, one at a time!

---

## 📋 PREPARATION

Before running any SQL:

1. ✅ Log into Supabase Dashboard: https://app.supabase.com
2. ✅ Select your project
3. ✅ Click "SQL Editor" in left sidebar
4. ✅ Click "New Query" for each migration below

---

## 🔧 MIGRATION 1: Initial Schema (Core Tables)

**What it creates**: Users, AI Employees, Jobs, Chat, Workflows, Billing

**Time to run**: ~30 seconds

**How to run**:
1. Click "New Query" in SQL Editor
2. Copy ALL content from file: `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl+Enter)
5. Wait for "Success" message

**Expected Tables Created**:
- users
- ai_employees
- employee_hires
- ai_workforces
- jobs
- tool_executions
- chat_sessions
- chat_messages
- workflows
- workflow_executions
- billing
- analytics_events

**Verify**: Run this query after migration:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'users', 'ai_employees', 'employee_hires', 'jobs', 
  'chat_sessions', 'chat_messages', 'workflows'
)
ORDER BY table_name;
```

**Expected Result**: Should show 7+ tables

✅ **Checkpoint 1 Complete**

---

## 🔧 MIGRATION 2: Settings Tables

**What it creates**: User profiles, settings, API keys, sessions

**Time to run**: ~15 seconds

**How to run**:
1. Click "New Query" in SQL Editor
2. Copy ALL content from file: `supabase/migrations/003_settings_tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success" message

**Expected Tables Created**:
- user_profiles
- user_settings
- user_api_keys
- user_sessions

**Verify**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE 'user_%'
ORDER BY table_name;
```

**Expected Result**: Should show 4 user_* tables

✅ **Checkpoint 2 Complete**

---

## 🔧 MIGRATION 3: Complete Workforce Schema

**What it creates**: Purchased employees and workforce execution tracking

**Time to run**: ~15 seconds

**How to run**:
1. Click "New Query" in SQL Editor
2. Copy ALL content from file: `supabase/migrations/004_complete_workforce_schema.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success" message

**Expected Tables Created**:
- purchased_employees
- workforce_executions

**Verify**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('purchased_employees', 'workforce_executions')
ORDER BY table_name;
```

**Expected Result**: Should show 2 tables

✅ **Checkpoint 3 Complete**

---

## 🔧 MIGRATION 4: Analytics Tables

**What it creates**: Analytics metrics, events, performance tracking, cost tracking

**Time to run**: ~20 seconds

**How to run**:
1. Click "New Query" in SQL Editor
2. Copy ALL content from file: `supabase/migrations/005_analytics_tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success" message

**Expected Tables Created**:
- analytics_metrics
- analytics_events (enhancement)
- performance_metrics
- cost_tracking

**Expected Views Created**:
- dashboard_stats
- workflow_analytics
- employee_performance

**Expected Functions Created**:
- get_dashboard_stats()
- record_analytics_event()

**Verify**:
```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'analytics_metrics', 'performance_metrics', 'cost_tracking'
)
ORDER BY table_name;

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN (
  'dashboard_stats', 'workflow_analytics', 'employee_performance'
)
ORDER BY table_name;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_dashboard_stats', 'record_analytics_event')
ORDER BY routine_name;
```

**Expected Result**: 
- 3 tables
- 3 views
- 2 functions

✅ **Checkpoint 4 Complete**

---

## 🔧 MIGRATION 5: Automation Tables

**What it creates**: Automation workflows, nodes, connections, webhooks, scheduled tasks, integrations, cache

**Time to run**: ~25 seconds

**How to run**:
1. Click "New Query" in SQL Editor
2. Copy ALL content from file: `supabase/migrations/006_automation_tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success" message

**Expected Tables Created**:
- automation_workflows
- automation_executions
- automation_nodes
- automation_connections
- webhook_configs
- scheduled_tasks
- integration_configs
- cache_entries
- api_rate_limits

**Expected Functions Created**:
- get_workflow_stats()
- get_automation_overview()
- cleanup_expired_cache()

**Verify**:
```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE 'automation_%' 
   OR table_name IN ('webhook_configs', 'scheduled_tasks', 'integration_configs', 'cache_entries', 'api_rate_limits')
ORDER BY table_name;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_workflow_stats', 
  'get_automation_overview', 
  'cleanup_expired_cache'
)
ORDER BY routine_name;
```

**Expected Result**: 
- 9 tables
- 3 functions

✅ **Checkpoint 5 Complete**

---

## ✅ FINAL VERIFICATION

After running ALL migrations, verify everything is set up correctly:

### Complete Table Count
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected Result**: At least 18 tables

### List All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables (alphabetically)**:
1. ai_employees
2. ai_workforces
3. analytics_events
4. analytics_metrics
5. api_rate_limits
6. automation_connections
7. automation_executions
8. automation_nodes
9. automation_workflows
10. billing
11. cache_entries
12. chat_messages
13. chat_sessions
14. cost_tracking
15. employee_hires
16. integration_configs
17. jobs
18. performance_metrics
19. purchased_employees
20. scheduled_tasks
21. tool_executions
22. user_api_keys
23. user_profiles
24. user_sessions
25. user_settings
26. users
27. webhook_configs
28. workflow_executions
29. workflows
30. workforce_executions

### List All Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Views**:
1. dashboard_stats
2. employee_performance
3. workflow_analytics

### List All Functions
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Expected Functions**:
1. cleanup_expired_cache
2. get_automation_overview
3. get_dashboard_stats
4. get_workflow_stats
5. record_analytics_event

---

## 🎯 SUCCESS CRITERIA

✅ **All migrations ran without errors**
✅ **At least 18 tables created**
✅ **3 views created**
✅ **5 functions created**
✅ **Row Level Security (RLS) enabled on all tables**
✅ **No error messages in SQL Editor**

---

## 🆘 TROUBLESHOOTING

### Error: "relation already exists"
**Cause**: You already ran this migration before
**Solution**: Skip this migration, continue to next one

### Error: "permission denied"
**Cause**: Not using correct database credentials
**Solution**: Make sure you're logged into YOUR Supabase project

### Error: "syntax error"
**Cause**: Didn't copy complete SQL file
**Solution**: Make sure to copy ENTIRE file content, including all lines

### Error: "extension does not exist"
**Cause**: Extensions not enabled
**Solution**: Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Tables missing after migration
**Solution**: Re-run the specific migration that creates those tables

### Want to start fresh?
**WARNING**: This deletes ALL data!
```sql
-- Drop all tables (DANGEROUS!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run all migrations from the start
```

---

## 📊 NEXT STEPS AFTER DATABASE SETUP

1. ✅ Update `.env` file with Supabase credentials
2. ✅ Get at least one AI API key
3. ✅ Start development server: `npm run dev`
4. ✅ Test authentication (sign up)
5. ✅ Test chat feature
6. ✅ Test all pages load correctly

---

## 📁 MIGRATION FILES LOCATION

All SQL files are in: `supabase/migrations/`

1. `001_initial_schema.sql` - Core tables
2. `003_settings_tables.sql` - User settings
3. `004_complete_workforce_schema.sql` - Workforce management
4. `005_analytics_tables.sql` - Analytics system
5. `006_automation_tables.sql` - Automation system

---

## 💡 PRO TIPS

1. **Run migrations in order** - Don't skip any!
2. **One at a time** - Don't try to run all at once
3. **Check for success** - Wait for "Success" message before continuing
4. **Verify tables** - Run verification queries after each migration
5. **Keep this guide open** - Reference it as you go

---

## ⏱️ TOTAL TIME ESTIMATE

- Reading this guide: 5 minutes
- Running all migrations: 5-10 minutes
- Verification: 5 minutes
- **Total: 15-20 minutes**

---

**Last Updated**: September 30, 2025
**Status**: Ready to Use
**Difficulty**: Easy (Copy & Paste)
