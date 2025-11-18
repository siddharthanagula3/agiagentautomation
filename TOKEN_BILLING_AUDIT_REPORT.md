# Token Counting and Billing System - Comprehensive Audit Report

**Date:** November 18, 2025
**Auditor:** Claude Code
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## Executive Summary

A comprehensive audit of the token counting and billing system revealed **7 critical issues** that need immediate attention:

1. ❌ **Pricing Inconsistencies** - Two different pricing tables with conflicting values
2. ❌ **Missing Token Tracking** - Legacy streaming functions don't track tokens
3. ❌ **Database Query Mismatches** - Billing dashboard queries wrong table
4. ❌ **Provider-Level Tracking Gap** - Individual providers don't track tokens
5. ⚠️ **Incomplete Token Metadata** - Some calls don't pass session/user IDs
6. ⚠️ **Outdated Pricing** - Some model prices may not reflect current API rates
7. ✅ **Partial Success** - Unified LLM service tracks correctly, but only when properly configured

---

## System Architecture Overview

### Current Token Tracking Flow

```
User Request
    ↓
Unified LLM Service (unified-language-model.ts)
    ↓
Provider (anthropic-claude.ts, openai-gpt.ts, etc.)
    ↓
Netlify Proxy Function
    ↓
External API (OpenAI, Anthropic, etc.)
    ↓
Response with usage data
    ↓
Unified LLM Service → deductTokens() → tokenLogger
    ↓
Database (api_usage table)
```

### Token Tracking Components

1. **Token Usage Tracker** (`/src/core/integrations/token-usage-tracker.ts`)
   - Main token logging service
   - Pricing table with per-million token costs
   - Database integration via UsageTracker

2. **Credit Tracking Service** (`/src/features/billing/services/credit-tracking.ts`)
   - Secondary token statistics service
   - Alternative pricing table (CONFLICTING with tracker)

3. **Usage Monitor** (`/src/features/billing/services/usage-monitor.ts`)
   - Database persistence layer
   - Writes to `api_usage` table

4. **Unified LLM Service** (`/src/core/ai/llm/unified-language-model.ts`)
   - Central orchestration point
   - Calls `deductTokens()` after successful API calls

---

## Critical Issues

### 🔴 ISSUE #1: Pricing Inconsistencies

**Severity:** CRITICAL
**Impact:** Incorrect billing, revenue loss or overcharging

**Problem:**
Two different pricing tables exist with conflicting values:

**File 1:** `/src/core/integrations/token-usage-tracker.ts` (Lines 48-118)

```typescript
const TOKEN_PRICING = {
  'gpt-4o': { input: 5.0, output: 15.0, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
    provider: 'anthropic',
  },
  'gemini-1.5-pro': { input: 3.5, output: 10.5, provider: 'google' },
  // ... more models
};
```

**File 2:** `/src/features/billing/services/credit-tracking.ts` (Lines 52-73)

```typescript
const PRICING = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10 }, // ❌ DIFFERENT!
    'gpt-4o-mini': { input: 0.15, output: 0.6 }, // ✅ Same
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 }, // ✅ Same
  },
  google: {
    'gemini-1.5-pro': { input: 1.25, output: 10 }, // ❌ DIFFERENT!
  },
};
```

**Discrepancies:**

- `gpt-4o`: Input cost differs by **2x** (5.0 vs 2.5)
- `gemini-1.5-pro`: Input cost differs by **2.8x** (3.5 vs 1.25)

**Recommendation:**

1. Use a SINGLE source of truth for pricing
2. Verify all prices against official API documentation (as of Nov 2025):
   - OpenAI: https://openai.com/pricing
   - Anthropic: https://www.anthropic.com/pricing
   - Google: https://ai.google.dev/pricing

---

### 🔴 ISSUE #2: Missing Token Tracking in Legacy Streaming

**Severity:** CRITICAL
**Impact:** Lost billing data for all streaming requests

**Problem:**
The legacy streaming functions in `/src/features/mission-control/services/message-streaming.ts` do NOT track tokens:

```typescript
// Line 52-153: streamOpenAI() - NO token tracking
export async function streamOpenAI(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  tools?: unknown[],
  model: string = 'gpt-4-turbo-preview'
) {
  // ... streams response ...
  // ❌ NO tokenLogger.logTokenUsage() call
}

// Lines 158-254: streamAnthropic() - NO token tracking
// Lines 260-357: streamGoogle() - NO token tracking
// Lines 362-449: streamPerplexity() - NO token tracking
```

**Impact:**

- All tokens used via these streaming functions are NOT billed
- Potential revenue loss if these functions are actively used
- Incomplete usage analytics

**Recommendation:**

1. Add token tracking to each streaming function
2. Extract usage data from streaming responses
3. Call `tokenLogger.logTokenUsage()` after stream completes
4. **OR** deprecate these functions and use `chatStreamingService` instead (which DOES track tokens)

---

### 🔴 ISSUE #3: Database Query Mismatches

**Severity:** HIGH
**Impact:** Billing dashboard shows incorrect or no data

**Problem:**
The Billing Dashboard queries the wrong table with wrong column names:

**File:** `/src/features/billing/pages/BillingDashboard.tsx` (Lines 209-250)

```typescript
// ❌ WRONG TABLE NAME
const { data: usageData, error: usageError } = await supabase
  .from('token_usage') // ❌ Should be 'api_usage'
  .select(
    'provider, input_tokens, output_tokens, total_tokens, total_cost' // ❌ Wrong columns
  )
  .eq('user_id', user.id);
```

**Actual Database Schema** (`api_usage` table):

```sql
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER NOT NULL,      -- NOT 'total_tokens'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost NUMERIC NOT NULL,              -- NOT 'total_cost'
  agent_type TEXT,
  session_id TEXT,
  task_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL
);
```

**Fix Required:**

```typescript
const { data: usageData, error: usageError } = await supabase
  .from('api_usage') // ✅ Correct table
  .select('provider, input_tokens, output_tokens, tokens_used, cost') // ✅ Correct columns
  .eq('user_id', user.id);
```

---

### 🔴 ISSUE #4: Provider-Level Tracking Gap

**Severity:** MEDIUM
**Impact:** Redundant tracking could be missing if unified service fails

**Problem:**
Individual provider files (`anthropic-claude.ts`, `openai-gpt.ts`, etc.) don't explicitly track tokens. They only return usage data and save messages to database.

**Current Flow:**

```
Provider → Returns usage → Unified Service → Tracks tokens
```

**Risk:**
If the unified service fails to track (e.g., exception thrown), tokens are lost.

**Recommendation:**

- Add defensive token tracking at provider level as backup
- Implement idempotency checks to prevent double-billing

---

### ⚠️ ISSUE #5: Incomplete Token Metadata

**Severity:** MEDIUM
**Impact:** Harder to debug and analyze token usage

**Problem:**
Some LLM calls don't pass `sessionId`, `userId`, or `taskDescription`:

**Examples:**

1. **Workforce Orchestrator** - Planning stage (Line 225-230):

```typescript
const response = await unifiedLLMService.sendMessage({
  provider: 'anthropic',
  messages: [{ role: 'user', content: plannerPrompt }],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  // ❌ No sessionId or userId passed
});
```

2. **Agent Conversation Protocol** - Supervisor analysis (Line 270-278):

```typescript
const response = await unifiedLLMService.sendMessage(
  [
    { role: 'system', content: supervisor.systemPrompt },
    { role: 'user', content: prompt },
  ],
  state.id, // ✅ sessionId passed
  userId, // ✅ userId passed
  'anthropic'
);
```

**Recommendation:**

- Ensure ALL LLM calls include sessionId and userId
- Add task descriptions for better analytics

---

### ⚠️ ISSUE #6: Potentially Outdated Pricing

**Severity:** LOW
**Impact:** Minor billing inaccuracies if API providers changed prices

**Problem:**
Pricing data in `token-usage-tracker.ts` claims to be "as of 2025" but should be verified against current rates.

**Models to Verify:**

- `gpt-5-thinking`: Listed as $15 input / $45 output (is this model even available?)
- `claude-sonnet-4-5-thinking`: Listed as $4 input / $20 output
- `gemini-2-5-pro`: Listed as $5 input / $15 output

**Recommendation:**

- Verify all pricing against official documentation
- Add "last updated" date to pricing table
- Implement automated pricing updates or alerts when providers change prices

---

## What's Working Well ✅

### 1. Unified LLM Service Token Tracking

**File:** `/src/core/ai/llm/unified-language-model.ts` (Lines 404-424)

```typescript
// CRITICAL: Deduct tokens AFTER successful API call
if (actualUserId && unifiedResponse.usage) {
  const deductionResult = await deductTokens(actualUserId, {
    provider: targetProvider,
    model: unifiedResponse.model,
    inputTokens: unifiedResponse.usage.promptTokens,
    outputTokens: unifiedResponse.usage.completionTokens,
    totalTokens: unifiedResponse.usage.totalTokens,
    sessionId: actualSessionId,
    feature: 'chat',
  });

  if (!deductionResult.success) {
    console.error(
      '[Unified LLM Service] Token deduction failed:',
      deductionResult.error
    );
  }
}
```

✅ Tracks tokens correctly
✅ Only deducts after successful API response
✅ Logs errors without throwing

---

### 2. Streaming Response Handler

**File:** `/src/features/chat/services/streaming-response-handler.ts` (Lines 239-271)

```typescript
// Extract token usage from response (CRITICAL FOR BILLING!)
const tokensUsed = response.usage?.totalTokens || 0;
const inputTokens = response.usage?.promptTokens || 0;
const outputTokens = response.usage?.completionTokens || 0;
const model = response.model || options.model || 'gpt-4o';

// Log token usage to database immediately
if (tokensUsed > 0 && userId) {
  try {
    await tokenLogger.logTokenUsage(
      model,
      tokensUsed,
      userId,
      sessionId,
      agentId || 'chat-assistant',
      agentId ? `Agent: ${agentId}` : 'Chat Assistant',
      inputTokens,
      outputTokens,
      'Chat conversation'
    );
  } catch (error) {
    console.error('[TokenTracking] ❌ Failed to log token usage:', error);
    metrics.errors++;
  }
}
```

✅ Comprehensive token tracking
✅ Includes all metadata
✅ Error handling doesn't break the flow

---

### 3. Database Schema

**File:** `/supabase/migrations/20250113000001_add_api_usage_table.sql`

```sql
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  operation_type TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  agent_type TEXT,
  execution_id UUID,
  session_id TEXT,
  task_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

✅ Comprehensive columns
✅ Proper indexes
✅ RLS policies
✅ Foreign key constraints

---

## Recommendations & Action Items

### Immediate Actions (Priority 1)

1. **Fix Pricing Inconsistencies**
   - [ ] Consolidate pricing into single source of truth
   - [ ] Verify all prices against official API docs (Nov 2025)
   - [ ] Remove duplicate pricing from `credit-tracking.ts`
   - [ ] Add "last updated" timestamp to pricing

2. **Fix Database Query in Billing Dashboard**
   - [ ] Change `token_usage` → `api_usage`
   - [ ] Update column names (`total_tokens` → `tokens_used`, `total_cost` → `cost`)
   - [ ] Test billing dashboard displays correct data

3. **Fix or Deprecate Legacy Streaming Functions**
   - [ ] Add token tracking to `message-streaming.ts` functions
   - [ ] OR mark as deprecated and migrate to `chatStreamingService`
   - [ ] Add migration guide if deprecating

### Short-Term Actions (Priority 2)

4. **Add Missing Metadata to LLM Calls**
   - [ ] Update workforce orchestrator planning stage to include sessionId/userId
   - [ ] Audit all `unifiedLLMService.sendMessage()` calls
   - [ ] Add task descriptions to all calls for better analytics

5. **Add Provider-Level Defensive Tracking**
   - [ ] Implement backup token tracking in provider classes
   - [ ] Add idempotency checks (prevent double-billing)
   - [ ] Add tracking verification tests

### Long-Term Actions (Priority 3)

6. **Implement Pricing Automation**
   - [ ] Create automated pricing verification script
   - [ ] Add alerts for price changes
   - [ ] Consider dynamic pricing from API provider metadata

7. **Add Comprehensive Testing**
   - [ ] Unit tests for token calculation
   - [ ] Integration tests for end-to-end tracking
   - [ ] Test scenarios:
     - Successful API call
     - Failed API call (no token deduction)
     - Streaming vs non-streaming
     - Multiple providers
     - Edge cases (zero tokens, very large token counts)

8. **Add Monitoring & Alerting**
   - [ ] Track token tracking failures
   - [ ] Alert on unusual token usage patterns
   - [ ] Dashboard for token tracking health

---

## Testing Checklist

Before deploying fixes, verify:

- [ ] Send message in /chat interface
  - [ ] Tokens tracked in database
  - [ ] Correct provider recorded
  - [ ] Correct model recorded
  - [ ] Cost calculated correctly
  - [ ] Billing dashboard updated

- [ ] Start mission in /mission-control
  - [ ] All employee executions tracked
  - [ ] Planning stage tracked
  - [ ] Execution stage tracked
  - [ ] Total cost accurate

- [ ] Multi-agent conversation
  - [ ] Each agent's tokens tracked separately
  - [ ] Supervisor tokens tracked
  - [ ] Aggregated correctly

- [ ] Streaming responses
  - [ ] Tokens tracked after stream completes
  - [ ] Metadata includes stream ID
  - [ ] Cost accurate

- [ ] Edge cases
  - [ ] Very large requests (> 100k tokens)
  - [ ] Failed API calls (no deduction)
  - [ ] Concurrent requests
  - [ ] Missing userId/sessionId

---

## Files Requiring Changes

### Must Fix (Critical)

1. `/src/features/billing/pages/BillingDashboard.tsx`
   - Lines 210-215: Change table name and columns

2. `/src/features/billing/services/credit-tracking.ts`
   - Remove entire file OR update pricing to match tracker

3. `/src/features/mission-control/services/message-streaming.ts`
   - Lines 52-479: Add token tracking to all stream functions

4. `/src/core/integrations/token-usage-tracker.ts`
   - Lines 48-118: Verify and update all prices

### Should Fix (High Priority)

5. `/src/core/ai/orchestration/workforce-orchestrator.ts`
   - Line 225: Add sessionId/userId to planning call

6. `/src/core/ai/llm/providers/anthropic-claude.ts`
   - Add defensive token tracking

7. `/src/core/ai/llm/providers/openai-gpt.ts`
   - Add defensive token tracking

8. `/src/core/ai/llm/providers/google-gemini.ts`
   - Add defensive token tracking

9. `/src/core/ai/llm/providers/perplexity-ai.ts`
   - Add defensive token tracking

---

## Official Pricing Reference (November 2025)

### OpenAI Pricing (per 1M tokens)

- GPT-4o: $2.50 input / $10.00 output
- GPT-4o-mini: $0.15 input / $0.60 output
- GPT-4-turbo: $10.00 input / $30.00 output
- GPT-3.5-turbo: $0.50 input / $1.50 output

Source: https://openai.com/pricing (verify current)

### Anthropic Pricing (per 1M tokens)

- Claude 3.5 Sonnet: $3.00 input / $15.00 output
- Claude 3 Opus: $15.00 input / $75.00 output
- Claude 3.5 Haiku: $1.00 input / $5.00 output
- Claude 3 Haiku: $0.25 input / $1.25 output

Source: https://www.anthropic.com/pricing (verify current)

### Google Pricing (per 1M tokens)

- Gemini 1.5 Pro: $1.25 input / $5.00 output (≤128k), $2.50/$10.00 (>128k)
- Gemini 1.5 Flash: $0.075 input / $0.30 output (≤128k), $0.15/$0.60 (>128k)

Source: https://ai.google.dev/pricing (verify current)

### Perplexity Pricing (per 1M tokens)

- Sonar Small: $0.20 input / $0.20 output
- Sonar Large: $1.00 input / $1.00 output
- Sonar Huge: $5.00 input / $5.00 output

Source: https://docs.perplexity.ai/docs/pricing (verify current)

---

## Conclusion

The token tracking system has a **solid foundation** with the unified LLM service correctly tracking tokens for most operations. However, **7 critical issues** need immediate attention:

1. ❌ Pricing inconsistencies between two services
2. ❌ Legacy streaming functions missing token tracking
3. ❌ Billing dashboard querying wrong database table
4. ⚠️ Missing defensive tracking in providers
5. ⚠️ Incomplete metadata in some LLM calls
6. ⚠️ Potentially outdated pricing
7. ✅ Core tracking works when properly configured

**Estimated Fix Time:** 4-6 hours for Priority 1 items

**Risk Level:** HIGH - Revenue loss or incorrect billing possible

**Recommendation:** Address Priority 1 items immediately before next deployment.

---

**Report Generated:** November 18, 2025
**Next Review:** After implementing fixes
