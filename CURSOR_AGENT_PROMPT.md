# 🤖 CURSOR AGENT PROMPT
## Complete Project Fix & Enhancement

---

## 🎯 YOUR MISSION

Fix all errors, enhance features, and prepare the AGI Agent Automation platform for production deployment.

---

## 📋 TASK LIST (Execute in Order)

### **PHASE 1: IMMEDIATE FIXES** ✅

#### Task 1: Fix Auth Import Errors
**Status:** PARTIALLY COMPLETE - RegisterPage fixed, verify others

**Action:**
```bash
# Search for any remaining incorrect imports
grep -r "import.*useAuth.*from.*unified-auth-store" src/
```

**Fix Pattern:**
```typescript
// ❌ WRONG
import { useAuth } from '@/stores/unified-auth-store';

// ✅ CORRECT  
import { useAuthStore } from '@/stores/unified-auth-store';
```

**Files to Check:**
- `src/pages/auth/LoginPage.tsx` ✅
- `src/pages/auth/RegisterPage.tsx` ✅ FIXED
- `src/AppRouter.tsx` ✅
- `src/components/auth/ProtectedRoute.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/pages/dashboard/*`
- `src/components/**/*`

#### Task 2: Verify Store Exports
**File:** `src/stores/index.ts`

**Verify exports match actual stores:**
```typescript
// Check each export has corresponding file
export { useAuthStore } from './unified-auth-store';
export { useAppStore } from './app-store';
export { useChatStore } from './chat-store';
export { useWorkforceStore } from './workforce-store';
// ... etc
```

**Remove phantom exports, keep only real stores.**

---

### **PHASE 2: DATABASE VERIFICATION**

#### Task 3: Check Required Tables

**Tables Checklist** (Should all exist in Supabase):
```
□ users
□ purchased_employees  
□ chat_sessions
□ chat_messages
□ workforce_executions
□ analytics_metrics
□ analytics_events
□ performance_metrics
□ cost_tracking
□ automation_workflows
□ automation_executions
□ automation_nodes
□ automation_connections
□ webhook_configs
□ scheduled_tasks
□ integration_configs
□ cache_entries
□ api_rate_limits
```

**Verification:**
User should run in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### Task 4: Migration Files Inventory

**Check these files exist:**
```
□ supabase/migrations/001_initial_schema.sql
□ supabase/migrations/005_analytics_tables.sql
□ supabase/migrations/006_automation_tables.sql
□ supabase/migrations/20250127000002_create_complete_schema.sql
```

**If any missing tables, user must run migrations in Supabase.**

---

### **PHASE 3: CODE CLEANUP**

#### Task 5: Remove Debug Code

**Files to Clean:**
1. Check `src/main.tsx`:
```typescript
// ✅ GOOD - Only loads in dev
if (import.meta.env.DEV) {
  import('./utils/test-supabase');
}
```

2. Remove/comment out `console.log` in production code (keep for errors)

3. Remove test files if any:
```
□ src/utils/test-*.ts (unless needed)
□ src/**/*.test.ts (move to tests folder)
□ src/**/*.spec.ts (move to tests folder)
```

#### Task 6: TypeScript Error Check

**Run:**
```bash
npm run type-check
```

**Fix any TypeScript errors found.** Priority order:
1. Type errors (red)
2. Null/undefined errors  
3. Import errors
4. Any errors

---

### **PHASE 4: ROUTE & NAVIGATION**

#### Task 7: Verify All Routes

**Check `src/App.tsx` has all routes:**
```typescript
// Root level routes (NOT /dashboard/*)
□ /dashboard (dashboard home)
□ /workforce
□ /chat
□ /automation
□ /analytics
□ /integrations
□ /settings
□ /billing
□ /api-keys
□ /support
□ /marketplace
```

**Test each route loads:**
- No 404 errors
- No white pages
- No infinite loading
- Data displays or shows empty state

#### Task 8: Fix Navigation Links

**Check files:**
- `src/layouts/DashboardLayout.tsx` (sidebar)
- `src/components/dashboard/DashboardHomePage.tsx` (quick actions)
- Any navigation components

**Ensure all links point to root-level routes:**
```typescript
// ❌ WRONG
<Link to="/dashboard/workforce">

// ✅ CORRECT
<Link to="/workforce">
```

---

### **PHASE 5: FEATURE VERIFICATION**

#### Task 9: Test Core Features

**Authentication:**
```
□ Registration works
□ Login works
□ Logout works
□ Session persists on refresh
□ Protected routes redirect when not authenticated
```

**Dashboard:**
```
□ Displays real data (not mock)
□ Loading states work
□ Error states work
□ Empty states work
□ Stats update
```

**Workforce:**
```
□ Lists AI employees
□ Can hire new employees
□ Can assign tasks
□ Execution history shows
```

**Chat:**
```
□ Can create chat
□ Can send messages  
□ AI responds
□ Chat history loads
□ Can switch chats
```

**Automation:**
```
□ Lists workflows
□ Can create workflow
□ Can execute workflow
□ Shows execution results
□ Stats display correctly
```

**Analytics:**
```
□ Dashboard stats show
□ Charts render
□ Cost tracking works
□ Performance metrics display
```

#### Task 10: Check Error Handling

**Every page should have:**
```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataDisplay data={data} />;
```

**Verify:**
- Loading states show spinners
- Errors show user-friendly messages
- Empty states have helpful text
- No crashes on errors

---

### **PHASE 6: PERFORMANCE**

#### Task 11: Implement Caching

**Check services use cache:**
```typescript
// Example pattern
import { cacheService } from '@/services/cache-service';

const cached = await cacheService.get(key);
if (cached) return cached;

const data = await fetchData();
await cacheService.set(key, data, ttl);
return data;
```

**Services to check:**
- `src/services/analytics-service.ts`
- `src/services/automation-service.ts`
- Any data fetching services

#### Task 12: Optimize Bundle

**Run:**
```bash
npm run build
```

**Check:**
- Build completes without errors
- No massive chunks (>1MB)
- Tree-shaking working
- No unused dependencies

**If issues:**
1. Check for circular dependencies
2. Ensure proper imports (not `import *`)
3. Use code splitting for large libraries
4. Lazy load routes

---

### **PHASE 7: PRODUCTION READINESS**

#### Task 13: Environment Configuration

**Verify `.env` has:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Optional AI keys
VITE_ANTHROPIC_API_KEY=sk-ant-xxx
VITE_GOOGLE_AI_API_KEY=AIza-xxx
VITE_BRAVE_SEARCH_API_KEY=BSA-xxx
```

**Action:**
1. Ensure variables not hard-coded
2. Check `.env.example` is template
3. Verify all `import.meta.env.VITE_*` have defaults
4. No secrets in code

#### Task 14: Security Check

**Row Level Security (RLS):**
User must verify in Supabase:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

**Policies Check:**
```sql
-- Check policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Each table should have policies for SELECT, INSERT, UPDATE, DELETE

#### Task 15: Build Verification

**Final checks:**
```bash
# TypeScript
npm run type-check

# Build
npm run build

# Preview
npm run preview
```

**All should succeed with no errors.**

---

### **PHASE 8: DEPLOYMENT PREP**

#### Task 16: Netlify Configuration

**Check `netlify.toml` exists with:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### Task 17: Git Cleanup

**Before deploy:**
```bash
# Remove sensitive files
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
echo ".DS_Store" >> .gitignore

# Commit everything
git add .
git commit -m "fix: resolve all issues and prepare for production"
git push origin main
```

---

## 🔧 SUPABASE COMMANDS FOR USER

### **User Must Run These in Supabase SQL Editor:**

#### 1. Verify Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected: 18+ tables**

#### 2. Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected Functions:**
- `get_dashboard_stats`
- `record_analytics_event`
- `get_workflow_stats`
- `get_automation_overview`
- `cleanup_expired_cache`

#### 3. Enable RLS (If Not Enabled)
```sql
-- Run for each table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
```

#### 4. Create Basic Policies (Example for users)
```sql
-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

**Repeat similar patterns for other tables.**

#### 5. Run Missing Migrations (If Tables Missing)

**If analytics tables missing:**
```sql
-- Copy entire contents of:
-- supabase/migrations/005_analytics_tables.sql
-- Paste here and run
```

**If automation tables missing:**
```sql
-- Copy entire contents of:
-- supabase/migrations/006_automation_tables.sql
-- Paste here and run
```

---

## 📊 SUCCESS CRITERIA

### **How to Know Everything is Complete:**

#### ✅ Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors  
- [ ] Build succeeds
- [ ] Preview works

#### ✅ Functionality
- [ ] Registration works
- [ ] Login works
- [ ] All routes load
- [ ] Data displays correctly
- [ ] No infinite loading
- [ ] No white pages
- [ ] Error handling works

#### ✅ Database
- [ ] All tables exist
- [ ] All functions exist
- [ ] RLS enabled
- [ ] Policies configured

#### ✅ Performance
- [ ] Caching implemented
- [ ] Bundle size reasonable
- [ ] No memory leaks
- [ ] Fast page loads

#### ✅ Security
- [ ] No secrets in code
- [ ] RLS properly configured
- [ ] CORS configured
- [ ] Environment variables used

#### ✅ Deployment
- [ ] netlify.toml configured
- [ ] Git repository clean
- [ ] No large files committed
- [ ] Ready to push

---

## 🆘 TROUBLESHOOTING

### **Common Issues & Quick Fixes:**

#### Issue: "useAuthStore is not defined"
```typescript
// Find and replace in file
import { useAuth } from '@/stores/unified-auth-store';
// with
import { useAuthStore } from '@/stores/unified-auth-store';
```

#### Issue: "Table does not exist"
- User must run migrations in Supabase
- Check migration files exist
- Verify Supabase connection

#### Issue: White page on load
```typescript
// Check AppRouter.tsx has:
useEffect(() => {
  if (!initialized) {
    initialize();
  }
}, [initialize, initialized]);
```

#### Issue: Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

#### Issue: Infinite loading
```typescript
// Add timeout to queries
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
  staleTime: 5000,
  retry: 1
});
```

---

## 📝 FINAL DELIVERABLES

### **What User Should Have:**

1. **Working Application**
   - All features functional
   - No errors in console
   - Smooth navigation
   - Real data displaying

2. **Clean Codebase**
   - No TypeScript errors
   - No unused imports
   - Consistent formatting
   - Proper error handling

3. **Configured Database**
   - All tables created
   - Functions working
   - RLS enabled
   - Policies set

4. **Documentation**
   - README.md updated
   - API docs complete
   - Deployment guide ready
   - Troubleshooting available

5. **Deployment Ready**
   - Build succeeds
   - Environment configured
   - Git repository clean
   - Ready to push

---

## 🎯 EXECUTION ORDER

### **Follow This Sequence:**

1. **First:** Fix all auth import errors (Phase 1)
2. **Second:** Verify database setup (Phase 2)
3. **Third:** Clean up code (Phase 3)
4. **Fourth:** Test routes (Phase 4)
5. **Fifth:** Verify features (Phase 5)
6. **Sixth:** Optimize performance (Phase 6)
7. **Seventh:** Security & config (Phase 7)
8. **Eighth:** Prepare deployment (Phase 8)

### **Time Estimates:**

- Phase 1-3: 30 minutes
- Phase 4-5: 45 minutes
- Phase 6-7: 30 minutes
- Phase 8: 15 minutes

**Total: ~2 hours for complete execution**

---

## ✨ IMPORTANT NOTES

### **Critical Points:**

1. **Don't skip database verification** - Most issues stem from missing tables
2. **Test after each phase** - Don't wait until end to test
3. **Keep backups** - Git commit after each major phase
4. **Read error messages** - They usually tell you exactly what's wrong
5. **Check browser console** - Most runtime errors visible there

### **Best Practices:**

- Test registration/login first - foundation for everything
- Use React Query for all data fetching
- Implement proper loading states everywhere
- Handle errors gracefully with user-friendly messages
- Cache expensive operations
- Keep components small and focused
- Use TypeScript strictly
- Follow existing patterns in codebase

---

## 🚀 READY TO START?

### **Your Action Plan:**

1. Open terminal in project root
2. Run `npm run dev`
3. Start with Phase 1, Task 1
4. Complete each task in order
5. Test after each phase
6. Check off items as you complete them
7. Fix any issues immediately
8. Move to next phase when current complete

### **Success Indicators:**

- ✅ No errors in console
- ✅ All routes working
- ✅ Data loading correctly
- ✅ Build succeeds
- ✅ User can navigate smoothly
- ✅ Features work as expected

---

**LET'S BUILD! 🎉**

