# Backend Fixes - Quick Reference Card

**Print this and check off as you go**

---

## Critical Fixes (Do Today - 1.5 hours total)

### ☐ Fix #1: Token Tracking Authentication (5 min)

**File:** `netlify/functions/utils/token-tracking.ts`
**Line:** 101
**Change:**

```diff
- const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
+ const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Deploy:** Push to git → Netlify auto-deploys
**Test:**

```sql
SELECT COUNT(*) FROM token_usage WHERE created_at > NOW() - '1 hour';
-- Should show > 0 after making LLM request
```

---

### ☐ Fix #2: Database Performance Indexes (10 min)

**File:** `supabase/migrations/20250113000003_add_critical_performance_indexes.sql`
**Action:**

1. Open Supabase dashboard → SQL Editor
2. Paste entire migration file
3. Click "Run"
   **Test:**

```sql
EXPLAIN ANALYZE SELECT * FROM chat_messages
WHERE session_id = 'xxx' ORDER BY created_at DESC LIMIT 50;
-- Should show "Index Scan" not "Seq Scan"
```

---

### ☐ Fix #3: Verify Rate Limiting (15 min)

**Action:**

1. Go to Netlify → Site settings → Environment variables
2. Check if these exist:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**If Missing:**

- **Option A:** Set up Upstash Redis (https://upstash.com)
- **Option B:** Deploy fallback limiter (see CRITICAL_SECURITY_FIXES.md)

**Test:**

```bash
# Make 11 requests in 1 minute
for i in {1..11}; do
  curl -X POST https://your-site.netlify.app/.netlify/functions/anthropic-proxy
done
# Should get 429 on request #11
```

---

### ☐ Fix #4: Add LLM Proxy Authentication (30 min)

**Create:** `netlify/functions/utils/auth-middleware.ts` (see CRITICAL_SECURITY_FIXES.md)
**Update:** `anthropic-proxy.ts`, `openai-proxy.ts`, `google-proxy.ts`
**Change:**

```diff
- const anthropicHandler: Handler = async (event: HandlerEvent) => {
+ import { withAuth } from './utils/auth-middleware';
+ const anthropicHandler: Handler = async (event: HandlerEvent, user) => {

  // ... existing code ...

- export const handler = withRateLimit(anthropicHandler);
+ export const handler = withAuth(withRateLimit(anthropicHandler));
```

**Test:**

```bash
# Without token
curl -X POST https://your-site/.netlify/functions/anthropic-proxy
# Should return 401 Unauthorized

# With valid token
curl -X POST https://your-site/.netlify/functions/anthropic-proxy \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
# Should return 200 OK
```

---

### ☐ Fix #5: Marketplace Data Integrity (20 min)

**Create:** `supabase/migrations/20250113000004_fix_marketplace_integrity.sql`
**Content:**

```sql
-- Add employee_id column to ai_employees
ALTER TABLE ai_employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

-- Populate from existing data
UPDATE ai_employees
SET employee_id = LOWER(REGEXP_REPLACE(name || '-' || role, '[^a-zA-Z0-9-]', '', 'g'))
WHERE employee_id IS NULL;

-- Clean orphaned records
DELETE FROM purchased_employees
WHERE employee_id NOT IN (SELECT employee_id FROM ai_employees);

-- Add foreign key
ALTER TABLE purchased_employees
ADD CONSTRAINT fk_purchased_employees_employee_id
FOREIGN KEY (employee_id) REFERENCES ai_employees(employee_id)
ON DELETE RESTRICT;
```

**Test:**

```sql
SELECT COUNT(*) FROM purchased_employees pe
LEFT JOIN ai_employees ae ON pe.employee_id = ae.employee_id
WHERE ae.id IS NULL;
-- Should return 0
```

---

## Verification Checklist

After deploying all fixes, run these checks:

### ☐ Token Tracking Working

```sql
SELECT COUNT(*), MAX(created_at) FROM token_usage;
-- Should have recent entries
```

### ☐ Indexes Created

```sql
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
-- Should return 40+
```

### ☐ Rate Limiting Active

```bash
# Make 11 rapid requests
# Should get 429 Too Many Requests on 11th
```

### ☐ Auth Required on Proxies

```bash
curl -X POST https://your-site/.netlify/functions/anthropic-proxy
# Should return 401 without token
```

### ☐ No Orphaned Employees

```sql
SELECT COUNT(*) FROM purchased_employees pe
LEFT JOIN ai_employees ae ON pe.employee_id = ae.employee_id
WHERE ae.id IS NULL;
-- Should return 0
```

### ☐ Query Performance Improved

```sql
EXPLAIN ANALYZE SELECT * FROM chat_messages
WHERE session_id = 'test' ORDER BY created_at DESC LIMIT 50;
-- Execution time should be < 5ms
```

---

## Environment Variables Checklist

### ☐ Netlify Environment Variables

```
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY (CRITICAL - needed for token tracking)
✓ STRIPE_SECRET_KEY
✓ STRIPE_WEBHOOK_SECRET
✓ VITE_OPENAI_API_KEY
✓ VITE_ANTHROPIC_API_KEY
✓ VITE_GOOGLE_API_KEY
✓ UPSTASH_REDIS_REST_URL (if using Redis rate limiting)
✓ UPSTASH_REDIS_REST_TOKEN (if using Redis rate limiting)
```

---

## Deployment Order

1. ☐ **Fix #1** → Deploy → Test (5 min)
2. ☐ **Fix #2** → Run in Supabase → Test (10 min)
3. ☐ **Fix #3** → Configure → Test (15 min)
4. ☐ **Fix #4** → Deploy → Test (30 min)
5. ☐ **Fix #5** → Run in Supabase → Test (20 min)
6. ☐ Run full verification script (5 min)

**Total Time:** ~1.5 hours

---

## Success Criteria

After all fixes:

- ✓ Token usage data is being saved to database
- ✓ All queries run 5-10x faster
- ✓ Rate limiting prevents abuse
- ✓ LLM proxies require authentication
- ✓ No orphaned marketplace records
- ✓ Platform ready for 10,000+ users

---

## If Something Breaks

### Token tracking still not working?

1. Check Netlify logs for errors
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Make sure RLS policies exist on `token_usage` table

### Rate limiting not working?

1. Check if Upstash Redis env vars are set
2. Try fallback in-memory limiter
3. Check Netlify function logs for rate limit errors

### Auth causing 401 errors for valid users?

1. Check Supabase JWT is being passed in `Authorization` header
2. Verify token is not expired
3. Check auth middleware logic

### Database migration failed?

1. Check for syntax errors
2. Verify table/column names match schema
3. Roll back if needed: `DROP INDEX idx_name CASCADE;`

---

## Quick Links

- **Supabase Dashboard:** https://app.supabase.com
- **Netlify Dashboard:** https://app.netlify.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Full Audit Report:** `BACKEND_INFRASTRUCTURE_AUDIT_REPORT.md`
- **Detailed Fixes:** `CRITICAL_SECURITY_FIXES.md`
- **Health Check:** `verify-backend-health.sql`

---

## Contact/Support

- Database issues → Check Supabase logs
- Function errors → Check Netlify function logs
- Stripe webhooks → Check Stripe webhook events
- Performance → Run `verify-backend-health.sql`

---

**Print Date:** 2025-01-13
**Next Review:** 2025-02-13 (30 days)

**REMEMBER:** These are production-critical fixes. Deploy within 24 hours!
