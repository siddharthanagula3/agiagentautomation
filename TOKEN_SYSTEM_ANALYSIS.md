# Token System Implementation Analysis

## Executive Summary

The codebase has a **partially implemented** token system with significant gaps in critical functionality. While the infrastructure for purchasing tokens is complete, the actual enforcement of token limits and deduction of tokens from user balances is **completely missing**. This represents a major business logic flaw that could lead to:

- Revenue loss (users can access unlimited tokens without paying)
- Service abuse (no cost enforcement for high-volume usage)
- Data integrity issues (usage tracking exists but isn't connected to balance management)

---

## 1. What's Implemented and Working

### 1.1 Database Layer ✅
**Files:** `supabase/migrations/20250111000003_add_token_system.sql`

**Working Components:**
- `users.token_balance` column (BIGINT, non-negative constraint)
- `token_transactions` audit table with:
  - Complete transaction history tracking
  - Multiple transaction types (purchase, usage, refund, adjustment, bonus, subscription_grant)
  - Balance snapshot before/after each transaction
  - Metadata storage in JSONB
- PostgreSQL function `update_user_token_balance()` with:
  - Row-level locking to prevent race conditions
  - Automatic transaction logging
  - Balance validation (prevents negative balances)
- PostgreSQL functions:
  - `get_user_token_balance()` - retrieve current balance
  - `get_user_transaction_history()` - paginated history

**Constraints:**
- `users_token_balance_non_negative` CHECK constraint prevents negative balances
- `token_transactions_type_valid` validates transaction types
- `token_transactions_new_balance_non_negative` validates new balance

### 1.2 Token Purchase Flow ✅
**Files:**
- `src/features/billing/services/token-pack-purchase.ts`
- `netlify/functions/buy-token-pack.ts`
- `netlify/functions/stripe-webhook.ts` (token pack section)

**Working Components:**

**Frontend:**
```typescript
buyTokenPack(params: {
  userId: string;
  userEmail: string;
  packId: string;
  tokens: number;
  price: number;
})
```
- Creates Stripe checkout session
- Configurable token packs (500K, 1.5M, 5M, 10M)
- Tracks pricing and discounts

**API Endpoint (buy-token-pack):**
- Validates required fields
- Creates Stripe payment session with correct metadata
- Stores tokens count, packId, userId in metadata
- Proper error handling

**Webhook Processing (stripe-webhook.ts):**
- Detects `checkout.session.completed` event
- Identifies token pack purchase via `metadata.type === 'token_pack_purchase'`
- Calls `supabase.rpc('update_user_token_balance', {...})` to add tokens
- Logs audit trail
- Has error handling with audit logging

**Token Balance Update:**
- Successfully reads current balance from database
- Calculates new balance
- Updates `users.token_balance` using the safe database function
- Creates transaction record with all metadata
- Returns new balance after update

### 1.3 Token Usage Tracking (Logging) ✅
**Files:**
- `src/core/integrations/token-usage-tracker.ts`
- `netlify/functions/utils/token-tracking.ts`
- `src/features/billing/services/credit-tracking.ts`
- `src/features/billing/services/usage-monitor.ts`

**Working Components:**

**Token Pricing Database:**
Comprehensive pricing for multiple models:
- OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- Anthropic: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307
- Google: gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro
- Perplexity: sonar-small/large/huge models

**Token Logging Service:**
```typescript
tokenLogger.logTokenUsage(
  model: string,
  tokensUsed: number,
  userId: string,
  sessionId?: string,
  agentId?: string,
  agentName?: string,
  inputTokens?: number,
  outputTokens?: number
)
```

**Cost Calculation:**
- Accurate pricing per model ($/per 1M tokens)
- Separates input/output tokens
- Calculates cost as: `(tokens / 1,000,000) * rate`

**Usage Storage:**
- Stores in `token_usage` table (via UsageTracker)
- Stores in `api_usage` table (via credit-tracking)
- Session-based aggregation with real-time summaries
- Daily and monthly statistics

**Integration Points:**
- Called from `anthropic-proxy.ts` (non-blocking)
- Called from streaming service after API response
- Tracks per model, per provider, per user

### 1.4 Token Display Components ✅
**Files:**
- `src/features/chat/components/TokenUsageDisplay.tsx`
- `src/features/chat/components/UsageWarningBanner.tsx`
- `src/features/chat/components/UsageWarningModal.tsx`
- `src/features/billing/pages/BillingDashboard.tsx`

**Working Components:**
- Real-time token counter showing tokens used per message
- Token cost display in USD (handles sub-penny amounts)
- Input/output token breakdown in tooltips
- Usage warning banners at 80% threshold
- Critical warning modal at 90-95% thresholds
- Progress bars showing usage percentage
- Historical token usage display on billing dashboard
- Token pack purchase UI with predefined packs

---

## 2. Critical Missing Features ❌

### 2.1 Token Deduction on Usage (CRITICAL) ❌
**Severity:** CRITICAL - System-breaking bug

**What's Missing:**
When users consume tokens (make API calls), **no tokens are deducted from their balance**.

**Evidence:**
- No code anywhere in the codebase that decrements `users.token_balance`
- Token logging only records usage in `token_usage` table (for analytics)
- No integration between token usage tracking and balance management
- Files searched:
  - All `/src/core/ai/llm/` files
  - All `/netlify/functions/` files
  - All `/src/features/chat/` files
  - Result: **Zero matches** for deduction/subtraction logic

**Impact:**
```
User Balance: 1,000,000 tokens (purchased)
After 10M tokens of API usage:
  - token_usage table: 10,000,000 tokens logged
  - users.token_balance: Still 1,000,000 (UNCHANGED)
  - User can use unlimited API calls without paying
```

**Why This Matters:**
- Free tier users can consume unlimited tokens
- Pro/Max tier users' purchased tokens never decrease
- Zero token cost enforcement
- Revenue impact: All usage after initial purchase is "free"

### 2.2 Token Limit Enforcement (CRITICAL) ❌
**Severity:** CRITICAL

**What's Missing:**
No code prevents API calls when:
- Free tier user exceeds 1M tokens/month
- Pro tier user exceeds their token allowance
- Purchased tokens are exhausted

**How It Should Work:**
1. Before making API call, check `users.token_balance`
2. Estimate tokens needed for this request (varies by model)
3. If insufficient, reject with 429 or 402 status
4. If sufficient, allow request and deduct after completion

**Current Reality:**
- LLM services accept requests unconditionally
- No pre-flight token balance checks
- No rate limiting based on token balance
- No cost enforcement mechanism

**Files That Should Have This:**
- `src/core/ai/llm/unified-language-model.ts` - Should check balance before sending
- `netlify/functions/anthropic-proxy.ts` - Should validate token sufficiency
- `netlify/functions/openai-proxy.ts` - Should validate token sufficiency
- `netlify/functions/google-proxy.ts` - Should validate token sufficiency

**Current State:** NONE of these files have token checking

### 2.3 Incomplete Token Balance Retrieval ❌
**Issue:** Token balance is never retrieved to:
- Display to user in chat UI
- Check before processing requests
- Show in billing dashboard

**Only Found In:**
- `token-pack-purchase.ts` - Gets balance only to update after purchase
- Never called from chat, LLM, or billing dashboard

**Should Be Called From:**
- Chat interface before sending messages
- Every API proxy endpoint
- Billing dashboard to show current balance
- Stream handlers to track real-time balance

### 2.4 Race Condition Risk on Concurrent Requests ⚠️
**Severity:** HIGH

**Issue:** While the database function `update_user_token_balance()` uses row-level locking (GOOD), the client-side code that calls it has no race condition protection.

**Scenario:**
```
1. User makes 2 concurrent API calls
2. Both proxies call the webhook with tokens
3. Both read current balance (say, 100K tokens)
4. Process 1: Adds 50K tokens → 150K
5. Process 2: Adds 50K tokens → 150K (overwrites!)
6. Final result: 150K instead of 200K

But wait - this uses the DB function which locks, so it might be okay...
```

**Actually Protected By:** PostgreSQL function's `FOR UPDATE` lock prevents this at DB level. However, client code doesn't know the final balance after concurrent operations.

### 2.5 No Enforcement of Plan-Based Token Limits ❌

**Current Plans in Pricing Page:**
- **Starter (Free):** 50K tokens/month
- **Pro:** 500K tokens/month
- **Business:** 5M tokens/month
- **Enterprise:** Custom

**What's Missing:**
- No tracking of "monthly allowance" separate from "purchased tokens"
- No monthly reset mechanism
- No way to distinguish:
  - Tokens from subscription (renewable monthly)
  - Tokens from purchases (one-time)
  - Tokens used this month vs. total
- `token_transactions.transaction_type` supports 'subscription_grant' but never used

---

## 3. Potential Bugs and Security Issues 🔴

### 3.1 Webhook Idempotency Vulnerability
**File:** `stripe-webhook.ts` (lines 100-122)

**Issue:**
```typescript
const processedEvents = new Set<string>();

function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  if (processedEvents.size > 1000) {
    const eventsArray = Array.from(processedEvents);
    eventsArray.slice(0, eventsArray.length - 1000)
      .forEach((id) => processedEvents.delete(id));
  }
}
```

**Problems:**
1. **In-memory storage:** Resets on server restart
2. **Not persistent:** If service restarts, same webhook can be processed twice
3. **Only keeps 1000 events:** Older events can be reprocessed
4. **Race condition:** No locks on `processedEvents` Set (JavaScript is not thread-safe)

**Attack Vector:**
1. Attacker replays token purchase webhook during server startup window
2. Tokens added twice without extra payment
3. OR Stripe retries webhook, adds tokens twice

**Fix Needed:** Store processed event IDs in database table with timestamp

### 3.2 Missing Token Sufficiency Check
**Files:** All `*-proxy.ts` files

**Current Code (anthropic-proxy.ts):**
```typescript
// Makes API call without checking token balance
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {...},
  body: JSON.stringify({model, max_tokens, system, messages, temperature}),
});
```

**Missing:**
```typescript
// Should be:
const balance = await getUserTokenBalance(userId);
const estimatedTokens = estimateTokens(messages, model);
if (balance < estimatedTokens) {
  return { statusCode: 402, body: JSON.stringify({error: 'Insufficient tokens'}) };
}
```

### 3.3 Stripe Metadata Not Validated
**File:** `stripe-webhook.ts` (lines 547-549)

**Issue:**
```typescript
if (session.metadata?.type === 'token_pack_purchase' && userId) {
  const tokens = parseInt(session.metadata.tokens || '0', 10);
```

**Problems:**
1. No validation that `tokens` is positive
2. No maximum limit (could be artificially large)
3. `packId` is stored but never validated against allowed packs
4. `sessionId` from metadata not verified

**Attack Vector:**
1. Stripe is compromised/MITM
2. Webhook metadata modified to add 1 billion tokens
3. No validation prevents it

**Fix Needed:**
```typescript
if (!Number.isInteger(tokens) || tokens <= 0 || tokens > MAX_TOKENS_PER_PURCHASE) {
  throw new Error('Invalid token amount');
}
```

### 3.4 No Rate Limiting on Token Purchases
**Issue:** A user could rapidly call `buy-token-pack` endpoint 1000 times and create 1000 checkout sessions simultaneously, overloading Stripe and the database.

**Missing:**
- Rate limiting per user
- Cooldown between purchases
- Concurrent purchase limits

### 3.5 Webhook Rate Limiting Insufficient
**File:** `stripe-webhook.ts` (lines 125-141)

**Current Limits:**
```typescript
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute per IP
```

**Issues:**
1. Uses IP-based limiting (shared by multiple users behind NAT)
2. 100 req/min = ~1.7 requests/second (aggressive for webhook retries)
3. No persistent state (resets on server restart)
4. `rateLimitMap` cleared periodically (race condition window)

### 3.6 Token Tracking Not Guaranteed to Persist
**File:** `anthropic-proxy.ts` (lines 94-99)

**Code:**
```typescript
storeTokenUsage('anthropic', model, userId, sessionId, tokenUsage).catch(
  (err) => {
    console.error('[Anthropic Proxy] Failed to store token usage:', err);
    // Continue - non-blocking
  }
);
```

**Issue:**
- If database fails, usage isn't tracked but user still gets response
- No retry logic
- No fallback queue
- Audit trail gaps if many requests fail

### 3.7 Cost Calculation Discrepancies
**Files:**
- `token-usage-tracker.ts` has different pricing than `netlify/functions/utils/token-tracking.ts`

**Example:**
```typescript
// token-usage-tracker.ts (line 52-55)
'gpt-4o': { input: 5.0, output: 15.0, provider: 'openai' },

// netlify/functions/utils/token-tracking.ts (line 9)
'gpt-4o': { input: 2.5, output: 10.0 },
```

**Impact:**
- Cost displayed to user != cost actually paid
- Billing discrepancy
- Audit issues

---

## 4. Performance Concerns ⚠️

### 4.1 In-Memory Token Caching
**File:** `token-usage-tracker.ts` (lines 110-111)

```typescript
private sessionCache: Map<string, SessionTokenSummary>;
private logEntries: Map<string, TokenLogEntry[]>;
```

**Issues:**
1. **Memory leak:** Never cleared for long-running sessions
2. **Unbounded growth:** Maps grow indefinitely
3. **Lost on restart:** All session data reset when server restarts
4. **No cleanup:** Orphaned entries from crashed sessions remain

**Better Approach:**
- Store in Redis for shared state across servers
- Auto-cleanup after session expires
- Periodic pruning of old entries

### 4.2 Database Function Locking
**File:** `20250111000003_add_token_system.sql` (line 85)

```sql
SELECT token_balance INTO v_current_balance
FROM public.users
WHERE id = p_user_id
FOR UPDATE;
```

**Concern:**
- `FOR UPDATE` locks the user row
- High concurrency will cause lock contention
- Long-running transactions holding lock = timeout risk

**Scale Impact:**
- 1 user with 100 concurrent API calls = 100 queue operations
- Each one acquires exclusive lock
- Sequential processing instead of parallel
- Could cause "lock timeout" errors at scale

### 4.3 Synchronous Token Tracking
**File:** `streaming-response-handler.ts` (line 44)

```typescript
await tokenLogger.logTokenUsage(...);
```

**Issue:**
- Blocks response completion on database write
- If database slow, user experience suffers
- Streaming response waits for database acknowledgment

**Should Be:**
- Fire-and-forget with queue
- Log after response sent
- Don't block user on tracking

### 4.4 Full Table Scans on Usage Queries
**File:** `usage-monitor.ts` (line 91)

```typescript
const { data, error } = await supabase
  .from('api_usage')
  .select('*')
  .eq('user_id', userId)
  .gte('timestamp', period.start.toISOString())
  .lte('timestamp', period.end.toISOString())
  .order('timestamp', { ascending: true });
```

**Missing Indexes:**
- Should have composite index: `(user_id, timestamp DESC)`
- Currently has `idx_token_usage_user_id` but date range not indexed
- Large result sets could be slow

---

## 5. Incomplete Implementations ⚠️

### 5.1 Usage Warning System (70% Complete)
**Files:**
- `UsageWarningBanner.tsx` - UI component works
- `UsageWarningModal.tsx` - Modal component works
- `BillingDashboard.tsx` - Partially integrated

**Missing:**
```typescript
// Lines 207-215 in UsageWarningBanner.tsx
const fetchUsage = async () => {
  try {
    // TODO: Fetch from Supabase token_usage table
    // This is a placeholder - implement actual query
    const mockData: UsageData[] = [
      { provider: 'OpenAI', used: 850000, limit: 1000000 },
      { provider: 'Anthropic', used: 650000, limit: 1000000 },
      { provider: 'Google', used: 200000, limit: 1000000 },
    ];
```

**Issues:**
1. Using mock data instead of real database queries
2. Hardcoded limits instead of user's actual plan limits
3. Per-provider limits not matching configured pricing plans
4. Not integrated with chat interface

### 5.2 Free Tier Token Allowance (0% Complete)
**Issue:** Pricing page mentions "50K tokens/month" for free tier, but:
- No monthly allowance tracking
- No reset mechanism
- No enforcement
- Free users get unlimited tokens

### 5.3 Token Balance Display (0% Complete)
**Missing:**
- Current balance display in chat UI
- Token balance badge/indicator
- "Buy tokens" quick access button
- Warning when nearing zero

---

## 6. Database Schema Review

### 6.1 Tables Present
```
users.token_balance ✅
token_transactions ✅
token_usage ✅
api_usage ✅
```

### 6.2 Missing Tables
```
token_limits (per-user limits based on plan) ❌
token_subscriptions (distinguish sub vs purchase tokens) ❌
token_usage_daily (aggregates for fast queries) ❌
```

### 6.3 RLS Policies
```
token_transactions: SELECT only ✅ (users see own transactions)
token_usage: SELECT only ✅ (users see own usage)
But: No INSERT/UPDATE policies = can only be modified by service role ✅
```

---

## 7. Stripe Integration Review

### 7.1 What Works ✅
- Checkout session creation
- Metadata storage
- Webhook signature verification
- Event deduplication (in-memory)
- Retry logic with exponential backoff (lines 479-530)
- Audit logging

### 7.2 What's Missing ❌
- Webhook persistence (not in database)
- Payment confirmation email notifications
- Refund handling (webhook processes but token not reversed)
- Failed payment handling (webhook handles but no token recovery)
- Subscription cancellation → token removal (NOT implemented)

---

## 8. Recommendations for Fixes

### Priority 1 (CRITICAL - Implement Immediately)

1. **Add Token Deduction Logic**
   - After each API call, deduct tokens from `users.token_balance`
   - Call `update_user_token_balance()` with negative amount
   - Ensure transaction is logged with 'usage' type
   - Handle insufficient balance error

2. **Implement Token Sufficiency Checking**
   - Before any API call, verify balance >= estimated tokens
   - Estimate tokens conservatively (current input + some padding)
   - Return 402 Payment Required if insufficient
   - Suggest "buy tokens" action in error response

3. **Persist Webhook Idempotency State**
   - Create `webhook_events_processed` table
   - Store event ID, timestamp, status
   - Check database instead of in-memory Set
   - Clean up events older than 30 days

4. **Validate Stripe Metadata**
   - Verify tokens value is valid positive integer
   - Verify tokens <= MAX_TOKENS_PER_PACK (e.g., 100M)
   - Verify packId exists in valid pack list
   - Add transaction amount check (matches expected price)

### Priority 2 (HIGH - Implement Next)

5. **Implement Monthly Token Allowances**
   - Add `monthly_allowance` to plan configuration
   - Track usage per calendar month
   - Reset allowance on month boundary
   - Distinguish purchased tokens from subscription tokens

6. **Display Token Balance in UI**
   - Show balance in chat header
   - Update in real-time after each request
   - Show "Buy tokens" prompt when low
   - Integrate with usage warnings

7. **Implement Token Usage Aggregates**
   - Add `token_usage_daily` materialized view
   - Create monthly summary table
   - Index by (user_id, date) for fast queries
   - Regenerate daily via scheduled job

8. **Fix Cost Calculation Discrepancies**
   - Use single source of truth for pricing
   - Export pricing from one service
   - Update all consumers
   - Add unit tests for pricing verification

### Priority 3 (MEDIUM - Implement Soon)

9. **Improve Rate Limiting**
   - Add persistent rate limit storage (Redis)
   - Use user ID + API key instead of IP
   - Implement per-endpoint limits
   - Add exponential backoff for retries

10. **Add Async Token Tracking**
    - Queue token log writes
    - Don't block response on tracking
    - Retry failed tracking jobs
    - Monitor queue length

11. **Handle Subscription Cancellation**
    - When subscription cancels, track remaining allowance
    - Convert unused tokens to one-time purchase tokens
    - OR mark them for expiration
    - Send user notification

12. **Add Refund Handling**
    - Webhook for payment.dispute.created
    - Refund tokens with 'refund' transaction type
    - Notify user of token reversal
    - Audit trail for compliance

---

## 9. Testing Gaps

### What's NOT Tested
- Token deduction under concurrent requests
- Webhook idempotency
- Token balance enforcement
- Rate limiting
- Cost calculation accuracy
- Plan-based allowance resets
- Insufficient balance error handling

### Recommended Tests to Add
```typescript
// Test insufficient balance blocking
test('API call blocked when token balance < estimated tokens', async () => {
  await setUserBalance(userId, 1000);
  await expect(callAPI(complexPrompt)).rejects
    .toThrow('402: Insufficient tokens');
});

// Test token deduction
test('Token balance decreases after API call', async () => {
  const before = await getBalance(userId);
  await callAPI(prompt, expectedTokens: 500);
  const after = await getBalance(userId);
  expect(before - after).toBe(500);
});

// Test webhook idempotency
test('Same webhook processed only once', async () => {
  await processWebhook(event);
  const balance1 = await getBalance(userId);
  await processWebhook(event);
  const balance2 = await getBalance(userId);
  expect(balance1).toBe(balance2);
});
```

---

## 10. Conclusion

### Status Summary

| Component | Status | Severity |
|-----------|--------|----------|
| Token Purchase Flow | ✅ Working | - |
| Token Balance Storage | ✅ Working | - |
| Stripe Webhook | ⚠️ Mostly Working | HIGH |
| Token Usage Tracking | ✅ Working | - |
| Token Deduction | ❌ Missing | CRITICAL |
| Token Limit Enforcement | ❌ Missing | CRITICAL |
| Plan Allowances | ❌ Missing | CRITICAL |
| Usage Warnings | ⚠️ Incomplete | MEDIUM |
| Rate Limiting | ⚠️ Weak | HIGH |
| Webhook Idempotency | ❌ Not Persistent | HIGH |

### Key Takeaway

**The token system is ~40% implemented.** While the infrastructure (database, APIs, Stripe integration) is solid, the core business logic is missing. Users can currently purchase tokens but:

1. Tokens never get used (no deduction)
2. Users can make unlimited API calls without enforcement
3. There's no way to enforce plan-based limits
4. Monthly allowances aren't tracked

**Estimated effort to complete:** 2-3 weeks for a single developer:
- Week 1: Add deduction logic, sufficiency checks, tests
- Week 2: Add monthly allowances, persistence, remaining edge cases
- Week 3: Add UI improvements, monitoring, documentation

The good news: The database foundation is solid and will handle the additional logic without changes.

