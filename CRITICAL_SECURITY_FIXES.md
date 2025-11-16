# CRITICAL SECURITY FIXES

**Priority: IMMEDIATE - Deploy within 24 hours**

---

## Fix #1: Token Tracking Authentication (CRITICAL)

### Current Issue

`netlify/functions/utils/token-tracking.ts` uses `VITE_SUPABASE_ANON_KEY` which cannot write to `token_usage` table due to RLS policies. This causes **silent failures** - token usage is never tracked in production.

### File: `netlify/functions/utils/token-tracking.ts`

**BEFORE (Line 100-110):**

```typescript
export async function storeTokenUsage(
  provider: string,
  model: string,
  userId: string | null,
  sessionId: string | null,
  usage: TokenUsage
): Promise<void> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // ❌ WRONG KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Token Tracking] Supabase not configured, skipping storage');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey); // ❌ ANON KEY FAILS RLS
```

**AFTER (Fixed):**

```typescript
export async function storeTokenUsage(
  provider: string,
  model: string,
  userId: string | null,
  sessionId: string | null,
  usage: TokenUsage
): Promise<void> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ✅ CORRECT KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Token Tracking] Supabase not configured, skipping storage');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey); // ✅ SERVICE_ROLE BYPASSES RLS
```

### Verification

After deploying, check token_usage table:

```sql
SELECT COUNT(*), MAX(created_at)
FROM token_usage
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Should show recent entries after fix
```

---

## Fix #2: Add Authentication to LLM Proxies (CRITICAL)

### Current Issue

`anthropic-proxy.ts` and `openai-proxy.ts` have **NO authentication check**. Anyone with the function URL can make unlimited LLM API calls, draining your API credits.

### File: `netlify/functions/utils/auth-middleware.ts` (NEW FILE)

```typescript
import { HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify Supabase JWT token from Authorization header
 * Returns user if valid, throws error if invalid
 */
export async function verifySupabaseAuth(
  authHeader: string | undefined
): Promise<{
  id: string;
  email: string;
} | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.warn('[Auth] Invalid token:', error?.message);
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
  };
}

/**
 * Authentication middleware for Netlify functions
 */
export function withAuth(
  handler: (
    event: HandlerEvent,
    user: { id: string; email: string }
  ) => Promise<any>
): (event: HandlerEvent) => Promise<any> {
  return async (event: HandlerEvent) => {
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    const user = await verifySupabaseAuth(authHeader);

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        }),
      };
    }

    return handler(event, user);
  };
}
```

### File: `netlify/functions/anthropic-proxy.ts`

**BEFORE (Line 15-23):**

```typescript
const anthropicHandler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
```

**AFTER (Fixed):**

```typescript
import { withAuth } from './utils/auth-middleware'; // ✅ ADD IMPORT

const anthropicHandler: Handler = async (event: HandlerEvent, user: { id: string; email: string }) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Now we have authenticated user.id and user.email
  console.log('[Anthropic Proxy] Request from user:', user.id);
```

**AND (Line 87-94) - Update token tracking:**

```typescript
// Track token usage
if (data.usage) {
  const tokenUsage = calculateTokenCost(
    'anthropic',
    model,
    data.usage.input_tokens,
    data.usage.output_tokens
  );

  // Store usage in Supabase (non-blocking)
  storeTokenUsage('anthropic', model, user.id, sessionId, tokenUsage).catch(
    //                                  ^^^^^^^ Use authenticated user ID
    (err) => {
      console.error('[Anthropic Proxy] Failed to store token usage:', err);
    }
  );
```

**AND (Line 137) - Export with auth middleware:**

```typescript
// Export handler with rate limiting AND authentication
export const handler = withAuth(withRateLimit(anthropicHandler));
//                     ^^^^^^^^ ADD AUTH WRAPPER
```

### Same changes for `openai-proxy.ts` and `google-proxy.ts`

---

## Fix #3: Verify Upstash Redis Configuration (CRITICAL)

### Current Issue

Rate limiting middleware returns `null` if Redis is not configured, which disables ALL rate limiting.

### Check Netlify Environment Variables

1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Verify these exist:
   ```
   UPSTASH_REDIS_REST_URL=https://YOUR_REDIS.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN_HERE
   ```

### If Missing, Create Upstash Redis Database

1. Go to https://upstash.com/
2. Create free Redis database
3. Copy REST URL and token
4. Add to Netlify environment variables
5. Redeploy

### Fallback Rate Limiting (Temporary Fix)

If you can't set up Redis immediately, add in-memory rate limiting:

**File: `netlify/functions/utils/rate-limiter.ts`**

**AFTER (Line 20-26):**

```typescript
// Fallback in-memory rate limiter for development/emergency
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();

function fallbackRateLimit(identifier: string): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const limit = 10;
  const windowMs = 60000; // 1 minute

  const entry = inMemoryLimits.get(identifier);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    inMemoryLimits.set(identifier, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

// If Redis is not configured, use fallback (log warning)
if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    '[Rate Limiter] Redis not configured. Using IN-MEMORY rate limiting (NOT SUITABLE FOR PRODUCTION MULTI-INSTANCE)'
  );
  return { fallback: true }; // Signal to use fallback
}
```

**Then in `checkRateLimit()` function:**

```typescript
export async function checkRateLimit(event: HandlerEvent): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  statusCode?: number;
  body?: string;
}> {
  const limiter = initializeRateLimiter();

  const identifier = getUserIdentifier(event);

  // If rate limiter is not configured, use fallback
  if (!limiter || limiter.fallback) {
    return fallbackRateLimit(identifier); // ✅ USE FALLBACK INSTEAD OF ALLOWING ALL
  }
```

---

## Fix #4: Add Input Validation with Zod (HIGH PRIORITY)

### Install Zod

```bash
npm install zod
```

### File: `netlify/functions/create-pro-subscription.ts`

**BEFORE (Line 30-44):**

```typescript
try {
  const {
    userId,
    userEmail,
    billingPeriod = 'monthly',
    plan = 'pro',
  } = JSON.parse(event.body || '{}'); // ❌ NO VALIDATION

  if (!userId || !userEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: userId, userEmail',
      }),
    };
  }
```

**AFTER (Fixed):**

```typescript
import { z } from 'zod'; // ✅ ADD IMPORT

const subscriptionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  userEmail: z.string().email('Invalid email format'),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  plan: z.enum(['pro', 'max']).default('pro'),
});

try {
  const body = JSON.parse(event.body || '{}');
  const validated = subscriptionSchema.parse(body); // ✅ VALIDATE

  const { userId, userEmail, billingPeriod, plan } = validated;
```

**Add error handling:**

```typescript
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('[Plan Subscription] Validation error:', error.errors);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid request data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }),
    };
  }

  console.error('[Plan Subscription] Error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Failed to create subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
  };
}
```

### Apply same pattern to all Netlify functions that accept user input

---

## Fix #5: Add Marketplace Referential Integrity (HIGH PRIORITY)

### Current Issue

`purchased_employees.employee_id` is TEXT with no foreign key to `ai_employees`. Users can hire non-existent employees.

### Migration: `supabase/migrations/20250113000004_fix_marketplace_integrity.sql`

```sql
-- =============================================
-- Fix Marketplace Referential Integrity
-- =============================================

-- Step 1: Add employee_id column to ai_employees if not exists
ALTER TABLE public.ai_employees
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

-- Step 2: Populate employee_id from existing data
-- Assuming employee_id should be generated from name + role
UPDATE public.ai_employees
SET employee_id = LOWER(REGEXP_REPLACE(name || '-' || role, '[^a-zA-Z0-9-]', '', 'g'))
WHERE employee_id IS NULL;

-- Step 3: Clean up orphaned purchased_employees
-- (employees that don't exist in ai_employees)
DELETE FROM public.purchased_employees
WHERE employee_id NOT IN (SELECT employee_id FROM public.ai_employees WHERE employee_id IS NOT NULL);

-- Step 4: Add foreign key constraint
ALTER TABLE public.purchased_employees
ADD CONSTRAINT fk_purchased_employees_employee_id
FOREIGN KEY (employee_id) REFERENCES public.ai_employees(employee_id)
ON DELETE RESTRICT; -- Prevent deleting employees that users have hired

-- Step 5: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_employees_employee_id
ON public.ai_employees(employee_id);

-- =============================================
-- Verification Query
-- =============================================

-- Count orphaned records (should be 0 after cleanup)
SELECT COUNT(*) as orphaned_purchases
FROM public.purchased_employees
WHERE employee_id NOT IN (SELECT employee_id FROM public.ai_employees);

-- Verify all purchased employees have valid references
SELECT
  pe.id,
  pe.employee_id,
  pe.name,
  ae.name as actual_name,
  CASE
    WHEN ae.id IS NULL THEN 'ORPHANED'
    ELSE 'OK'
  END as status
FROM public.purchased_employees pe
LEFT JOIN public.ai_employees ae ON pe.employee_id = ae.employee_id
ORDER BY status DESC, pe.created_at DESC
LIMIT 100;
```

---

## Deployment Order (Critical Path)

1. **Fix #1: Token Tracking** (5 minutes)
   - Update `token-tracking.ts` to use `SUPABASE_SERVICE_ROLE_KEY`
   - Deploy to Netlify
   - Verify with SQL query

2. **Fix #3: Redis Configuration** (15 minutes)
   - Set up Upstash Redis OR deploy fallback rate limiter
   - Add env vars to Netlify
   - Redeploy

3. **Fix #2: LLM Proxy Auth** (30 minutes)
   - Create `auth-middleware.ts`
   - Update `anthropic-proxy.ts`, `openai-proxy.ts`, `google-proxy.ts`
   - Deploy and test with authenticated requests

4. **Database Indexes** (10 minutes)
   - Run `20250113000003_add_critical_performance_indexes.sql` migration
   - Verify with `EXPLAIN ANALYZE` on key queries

5. **Fix #5: Marketplace Integrity** (20 minutes)
   - Review orphaned records
   - Run `20250113000004_fix_marketplace_integrity.sql` migration
   - Verify no orphaned purchases

6. **Fix #4: Input Validation** (1-2 hours)
   - Install Zod
   - Add validation schemas to all functions
   - Test error cases

---

## Testing Checklist

After deploying fixes:

- [ ] **Token Tracking:** Make LLM request, check `token_usage` table has new row
- [ ] **Auth:** Try LLM request without token → 401 error
- [ ] **Auth:** Try LLM request with valid token → Success
- [ ] **Rate Limit:** Make 11 requests in 1 minute → 429 error on 11th
- [ ] **Marketplace:** Try hiring employee with invalid ID → Constraint violation
- [ ] **Performance:** Run query benchmarks, verify 5-10x improvement

---

## Rollback Plan

If any fix causes issues:

1. **Token Tracking:** Revert to `VITE_SUPABASE_ANON_KEY` (loses tracking, but safer)
2. **LLM Auth:** Remove `withAuth()` wrapper temporarily
3. **Rate Limit Fallback:** Deploy without fallback (allows all requests)
4. **Database Indexes:** Drop indexes with `DROP INDEX` commands
5. **Marketplace FK:** Remove constraint with `ALTER TABLE purchased_employees DROP CONSTRAINT fk_purchased_employees_employee_id`

---

## Monitoring Post-Deployment

1. **Token Usage:** Check hourly counts

   ```sql
   SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*), SUM(total_cost)
   FROM token_usage
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

2. **Auth Failures:** Monitor 401 errors in Netlify logs

   ```bash
   netlify logs:stream --filter="401"
   ```

3. **Rate Limit Hits:** Count 429 responses

   ```bash
   netlify logs:stream --filter="Rate limit exceeded"
   ```

4. **Query Performance:** Use `pg_stat_statements`
   ```sql
   SELECT query, calls, mean_exec_time, max_exec_time
   FROM pg_stat_statements
   WHERE query LIKE '%chat_messages%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

---

## Emergency Contacts

- **Database Issues:** Check Supabase logs at https://app.supabase.com
- **Netlify Function Errors:** Check function logs at https://app.netlify.com
- **Stripe Webhook Failures:** Check webhook events at https://dashboard.stripe.com/webhooks

**DEPLOY IMMEDIATELY - These fixes prevent data loss and security vulnerabilities**
