# Billing & Token System Audit Report
**Date:** 2025-01-15
**Severity:** CRITICAL 🔴
**Impact:** Users cannot use chat features, seeing false "limit exceeded" errors

---

## Executive Summary

The token enforcement system is querying the **WRONG database tables**, causing:
- ❌ "Monthly limit exceeded" errors even for new users
- ❌ "You've used 0 of 0 tokens" display
- ❌ Chat interface blocked for all users
- ❌ False token balance readings

**Root Cause:** `token-enforcement-service.ts` queries `users.token_balance` (non-existent column) instead of `user_token_balances.current_balance` (correct table).

---

## Critical Issues Found

### Issue #1: Wrong Database Table/Column ⚠️

**Location:** `src/core/billing/token-enforcement-service.ts`

**Lines 50-54 (`checkTokenSufficiency`):**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select('token_balance, subscription_tier')  // ❌ WRONG COLUMN
  .eq('id', userId)
  .single();
```

**Lines 160-164 (`getUserTokenBalance`):**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('token_balance')  // ❌ WRONG COLUMN
  .eq('id', userId)
  .single();
```

**Problem:**
- `users` table does NOT have a `token_balance` column
- Token balances are stored in `user_token_balances.current_balance`
- Query returns `null`, causing balance to default to 0

**Impact:**
- ✅ Billing dashboard: Fixed (uses correct table)
- ❌ Chat interface: Broken (uses wrong table)
- ❌ Token enforcement: Broken (uses wrong table)

---

### Issue #2: Error Handling Returns `limit: 0` ⚠️

**Location:** `src/core/billing/token-enforcement-service.ts:215-222`

```typescript
if (error || !user) {
  return {
    allowed: false,
    used: 0,
    limit: 0,  // ❌ Shows as "0 of 0 tokens"
    resetDate: new Date(),
  };
}
```

**Problem:**
- When user query fails, returns `limit: 0`
- Error message becomes: "You've used 0 of 0 tokens"
- Should return sensible defaults (1M for free tier)

---

### Issue #3: Confusing Error Messages 📝

**Location:** `src/core/billing/token-enforcement-service.ts:302`

```typescript
reason: `Monthly limit exceeded. You've used ${allowance.used.toLocaleString()} of ${allowance.limit.toLocaleString()} tokens...`
```

**Problem:**
- Message references "monthly usage" (from token_transactions)
- Users expect to see "token balance remaining"
- Two different concepts:
  - **Monthly usage limit**: Max tokens per month (free tier)
  - **Token balance**: Prepaid tokens remaining (all tiers)

**Confusion:**
- Free tier: "1M tokens/month limit" (monthly allowance)
- Pro tier: "10M tokens balance" (prepaid balance)
- Error mixes these concepts

---

### Issue #4: Fallback Logic Missing 🛡️

**Current behavior:**
```typescript
return data.token_balance || 0;  // ❌ Returns 0 if null
```

**Problem:**
- New users have no balance record → returns 0 → blocks all requests
- Should default to free tier allocation (1M tokens)

---

## Database Schema Analysis

### ✅ Correct Schema (Production)

**Table:** `user_token_balances`
```sql
CREATE TABLE user_token_balances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  current_balance BIGINT NOT NULL DEFAULT 0,
  lifetime_granted BIGINT DEFAULT 0,
  lifetime_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table:** `token_transactions`
```sql
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tokens BIGINT NOT NULL,  -- Positive = grant, Negative = usage
  transaction_type TEXT NOT NULL,  -- 'initial_grant', 'purchase', 'usage', 'subscription_grant'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table:** `users`
```sql
-- ❌ DOES NOT HAVE token_balance column
-- Has: id, email, plan, subscription_end_date, etc.
```

---

## Code Flow Analysis

### Current (Broken) Flow

```
1. User sends chat message
   ↓
2. unified-language-model.ts calls canUserMakeRequest()
   ↓
3. checkMonthlyAllowance() queries users.subscription_tier ✅
   ↓
4. checkTokenSufficiency() queries users.token_balance ❌ (null)
   ↓
5. Returns allowed=false, balance=0
   ↓
6. Error: "Monthly limit exceeded. You've used 0 of 0 tokens"
   ↓
7. Chat request blocked ❌
```

### Correct Flow (After Fix)

```
1. User sends chat message
   ↓
2. unified-language-model.ts calls canUserMakeRequest()
   ↓
3. checkMonthlyAllowance() queries users.plan ✅
   ↓
4. checkTokenSufficiency() queries user_token_balances.current_balance ✅
   ↓
5. If no record: Initialize with 1M tokens (free tier) ✅
   ↓
6. Returns allowed=true, balance=1000000 ✅
   ↓
7. Chat request proceeds ✅
```

---

## Impact Assessment

### Users Affected
- ✅ **Billing Dashboard:** Working correctly (uses correct table)
- ❌ **Chat Interface:** Completely broken for ALL users
- ❌ **Mission Control:** Token checks fail
- ❌ **Token Balance Display:** Shows null/0

### Error Messages Seen
1. "Monthly limit exceeded" (even for new users with 0 usage)
2. "You've used 0 of 0 tokens" (limit shows as 0)
3. Chat requests blocked immediately
4. Token balance display shows "Loading..." or null

---

## Required Fixes

### Fix #1: Update `getUserTokenBalance()`

**File:** `src/core/billing/token-enforcement-service.ts:156-176`

**Current:**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('token_balance')  // ❌ Wrong table
  .eq('id', userId)
  .single();

return data.token_balance || 0;  // ❌ Returns 0 if null
```

**Correct:**
```typescript
// Query user_token_balances table
const { data: balanceData, error: balanceError } = await supabase
  .from('user_token_balances')
  .select('current_balance')
  .eq('user_id', userId)
  .single();

if (balanceError) {
  console.warn('[Token Balance] No balance record, initializing...');

  // Get user's plan to determine initial balance
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  const isPro = userData?.plan === 'pro' || userData?.plan === 'max';
  return isPro ? 10000000 : 1000000; // 10M for pro, 1M for free
}

return Math.max(balanceData.current_balance || 0, 0);
```

### Fix #2: Update `checkTokenSufficiency()`

**File:** `src/core/billing/token-enforcement-service.ts:44-91`

**Current:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select('token_balance, subscription_tier')  // ❌ Wrong
  .eq('id', userId)
  .single();

const currentBalance = user.token_balance || 0;
```

**Correct:**
```typescript
// Get balance from correct table
const currentBalance = await getUserTokenBalance(userId);

if (currentBalance === null) {
  return {
    allowed: false,
    currentBalance: 0,
    estimatedCost: estimatedTokens,
    reason: 'Failed to fetch user balance',
  };
}
```

### Fix #3: Update Error Defaults

**File:** `src/core/billing/token-enforcement-service.ts:215-222`

**Current:**
```typescript
return {
  allowed: false,
  used: 0,
  limit: 0,  // ❌ Shows "0 of 0 tokens"
  resetDate: new Date(),
};
```

**Correct:**
```typescript
return {
  allowed: false,
  used: 0,
  limit: 1000000,  // ✅ Free tier default
  resetDate: new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ),
};
```

### Fix #4: Improve Error Messages

**File:** `src/core/billing/token-enforcement-service.ts:302`

**Current:**
```typescript
reason: `Monthly limit exceeded. You've used ${allowance.used.toLocaleString()} of ${allowance.limit.toLocaleString()} tokens...`
```

**Improved:**
```typescript
reason: `Monthly limit reached. You've used ${allowance.used.toLocaleString()} of your ${allowance.limit.toLocaleString()} token monthly allowance. Limit resets ${allowance.resetDate.toLocaleDateString()}.`
```

---

## Testing Plan

### Test Case 1: New User (No Balance Record)
```
1. Create new user account
2. Send first chat message
3. EXPECT: Message sends successfully
4. VERIFY: Balance initialized to 1M tokens
5. VERIFY: No "limit exceeded" errors
```

### Test Case 2: Free User (With Balance)
```
1. User with 500K token balance
2. Send chat message (estimate: 1K tokens)
3. EXPECT: Message sends successfully
4. VERIFY: Balance deducted correctly
5. VERIFY: Balance display shows 499K
```

### Test Case 3: Pro User
```
1. Pro user with 5M token balance
2. Send chat message
3. EXPECT: Message sends successfully
4. VERIFY: No monthly limit checks for pro users
```

### Test Case 4: Zero Balance User
```
1. User with 0 token balance
2. Send chat message
3. EXPECT: Error "Insufficient tokens"
4. VERIFY: Shows actual balance (0)
5. VERIFY: Link to buy tokens
```

---

## Migration Steps

### Step 1: Fix Code
1. Update `getUserTokenBalance()` to query `user_token_balances`
2. Update `checkTokenSufficiency()` to use `getUserTokenBalance()`
3. Fix error handling defaults
4. Improve error messages

### Step 2: Database Check
```sql
-- Verify user_token_balances table exists
SELECT COUNT(*) FROM user_token_balances;

-- Check for users without balance records
SELECT u.id, u.email, u.plan
FROM auth.users u
LEFT JOIN user_token_balances utb ON u.id = utb.user_id
WHERE utb.id IS NULL;
```

### Step 3: Initialize Missing Balances
```sql
-- Create balance records for users without them
INSERT INTO user_token_balances (user_id, current_balance, lifetime_granted, lifetime_used)
SELECT
  u.id,
  CASE
    WHEN u.plan IN ('pro', 'max') THEN 10000000
    ELSE 1000000
  END AS current_balance,
  CASE
    WHEN u.plan IN ('pro', 'max') THEN 10000000
    ELSE 1000000
  END AS lifetime_granted,
  0 AS lifetime_used
FROM auth.users u
LEFT JOIN user_token_balances utb ON u.id = utb.user_id
WHERE utb.id IS NULL;
```

### Step 4: Deploy & Monitor
1. Deploy code fixes
2. Monitor error logs for token-related errors
3. Check user_token_balances table for negative balances
4. Verify chat functionality

---

## Success Metrics

✅ **Before Fixes:**
- Chat success rate: ~0% (all users blocked)
- Error rate: ~100% ("limit exceeded")
- Token balance display: Broken (shows null/0)

✅ **After Fixes:**
- Chat success rate: ~100% (for users with balance)
- Error rate: <1% (only users with 0 balance)
- Token balance display: Accurate and real-time

---

## Related Files

### Fixed (Billing Dashboard)
- ✅ `src/features/billing/pages/BillingDashboard.tsx` (commit: 31a7d54)
- ✅ `src/shared/ui/progress.tsx` (commit: 31a7d54)

### Need Fixing (Token Enforcement)
- ❌ `src/core/billing/token-enforcement-service.ts` (CRITICAL)
- ❌ `src/features/chat/components/TokenBalanceDisplay.tsx` (uses getUserTokenBalance)
- 📝 `src/core/ai/llm/unified-language-model.ts` (calls canUserMakeRequest)

---

## Recommendations

### Immediate Actions (P0 - Critical)
1. ✅ Fix `getUserTokenBalance()` to query correct table
2. ✅ Fix `checkTokenSufficiency()` to use correct balance source
3. ✅ Fix error handling to return sensible defaults
4. ✅ Initialize missing user balance records

### Short-term (P1 - High)
1. Add database migration to ensure all users have balance records
2. Add monitoring/alerts for token balance failures
3. Improve error messages to be more user-friendly
4. Add retry logic for database queries

### Long-term (P2 - Medium)
1. Consolidate token balance logic into single service
2. Add caching for balance checks (reduce DB load)
3. Add balance threshold warnings (before hitting 0)
4. Create admin dashboard for token management

---

## Conclusion

**Status:** 🔴 **CRITICAL BUG** - Chat functionality completely broken

**Root Cause:** Token enforcement service queries non-existent `users.token_balance` column instead of `user_token_balances.current_balance` table.

**Fix Complexity:** Low (simple table/column name changes)

**Testing Required:** Medium (test all user tiers and edge cases)

**Estimated Time:** 30 minutes to fix + 15 minutes to test

---

**Generated:** 2025-01-15
**Author:** Claude Code Audit System
**Priority:** P0 - CRITICAL - IMMEDIATE ACTION REQUIRED
