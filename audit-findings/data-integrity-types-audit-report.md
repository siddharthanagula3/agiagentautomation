# Data Integrity & Types Audit Report

**Audit Date:** 2026-02-16
**Audit Team:** Data Integrity & Types Audit Team (Team 2)

---

## Executive Summary

This audit identified **significant issues** across 5 focus areas:
- **Critical:** Token column naming mismatch (runtime failures)
- **High:** Duplicate type definitions across codebase
- **High:** Missing RLS policies (now fixed)
- **Medium:** Store type inconsistencies
- **Medium:** React Query hooks missing return types

---

## 1. Duplicate Type Definitions

### 1.1 MessageRole Type Duplicates

| File | Line | Definition |
|------|------|------------|
| `src/shared/types/common.ts` | 21 | `'user' \| 'assistant' \| 'system' \| 'tool'` |
| `src/shared/types/store-types.ts` | 75 | `StoreMessageRole = 'user' \| 'assistant' \| 'system'` |
| `src/core/ai/llm/unified-language-model.ts` | 123 | `'user' \| 'assistant' \| 'system'` |
| `src/features/vibe/types/vibe-message.ts` | 6 | `'user' \| 'assistant' \| 'system'` |
| `src/shared/stores/chat-store.ts` | 15 | `'user' \| 'assistant' \| 'system'` |

**Severity:** Medium
**Issue:** The canonical `MessageRole` in `common.ts` includes `'tool'` but most other definitions don't include it.

---

### 1.2 ChatMessage Type Duplicates

| File | Lines | Description |
|------|-------|-------------|
| `src/shared/types/common.ts` | 113-154 | `BaseChatMessage` and `ChatMessage` - Full-featured |
| `src/shared/types/common.ts` | 125-132 | `SimpleChatMessage` - Simplified version |
| `src/shared/types/common.ts` | 159-167 | `MissionChatMessage` - Mission Control specific |
| `src/shared/types/common.ts` | 183-190 | `ChatMessageRecord` - Database record format |
| `src/shared/stores/chat-store.ts` | 12-32 | `Message` - Store-specific version |
| `src/features/vibe/types/vibe-message.ts` | 8-20 | `VibeMessage` - Vibe-specific version |

**Severity:** High
**Key Differences:**
- `ChatMessage` (common.ts): Has `deliveryStatus`, `readBy`, `replyTo`, `edited`, `editCount`, `updatedAt`
- `Message` (chat-store.ts): Has `citations`, `toolCalls`, no `deliveryStatus`
- `VibeMessage` (vibe-message.ts): Uses snake_case (`session_id`, `employee_id`)

---

### 1.3 ToolCall Duplicates

| File | Lines | Key Differences |
|------|-------|-----------------|
| `src/shared/types/common.ts` | 195-208 | Has `timestamp`, `executionTime`, `startedAt`, `completedAt` |
| `src/shared/stores/chat-store.ts` | 34-42 | Has `type`, no `timestamp` fields |
| `src/core/ai/tools/types.ts` | 387-410 | More detailed with `callId`, `callType`, `rawArguments` |
| `src/features/vibe/services/vibe-agent-tools.ts` | 60-72 | Vibe-specific version |
| `src/features/mission-control/services/message-streaming.ts` | 37-55 | Mission control version |

---

### 1.4 MessageReaction Types

| File | Lines | Fields |
|------|-------|--------|
| `src/shared/types/common.ts` | 227-241 | Full: `up`, `down`, `helpful`, `creative`, `accurate`, `like`, `unhelpful`, `insightful`, `flag`, `bookmark` |
| `src/shared/stores/chat-store.ts` | 64-68 | Limited: `up`, `down`, `helpful`, `creative`, `accurate` |
| `src/shared/types/multi-agent-chat.ts` | 166-176 | Has database row format fields |
| `src/features/chat/services/message-reactions-service.ts` | 28-34 | Has `emoji` string field instead of type enum |
| `src/shared/types/multi-agent-chat.ts` | 51-57 | `ReactionType` enum: `like`, `helpful`, `unhelpful`, `insightful`, `flag`, `bookmark` |

---

### 1.5 ConversationBranch Duplicates

| File | Lines | Definition |
|------|-------|------------|
| `src/core/storage/conversation-branch-service.ts` | 21-29 | Has `createdBy` field |
| `src/features/chat/services/conversation-branching.ts` | 21-28 | No `createdBy` field |

**Severity:** Medium - Schema inconsistency between two service definitions

---

## 2. Token Column Naming Consistency

### 2.1 Database Schema (Authoritative)

**File:** `supabase/migrations/20260106000002_add_user_token_balances.sql` (Line 9)
```sql
current_balance BIGINT NOT NULL DEFAULT 0,
```

**File:** `supabase/migrations/20260113000002_consolidate_token_system.sql` (Lines 39, 126, 162)
- Uses `current_balance` consistently

**Conclusion:** The authoritative column name in `user_token_balances` table is **`current_balance`**.

---

### 2.2 Code Using CORRECT Column Name (`current_balance`)

| File | Line(s) |
|------|---------|
| `src/core/billing/token-enforcement-service.ts` | 182, 199, 242 |
| `src/features/workforce/hooks/use-workforce-queries.ts` | 364, 368 |
| `src/features/billing/services/token-pack-purchase.ts` | 145, 158, 166, 185, 261, 267, 281 |
| `src/features/billing/hooks/use-billing-queries.ts` | 168, 182 |

---

### 2.3 Code Using INCORRECT Column Name (`token_balance`)

**CRITICAL - These files query for a non-existent column:**

| File | Line(s) | Evidence |
|------|---------|----------|
| `netlify/functions/utils/token-balance-check.ts` | 79, 104, 119, 139 | `.select('token_balance, plan')`, `newBalanceData.token_balance` |
| `netlify/functions/media-proxies/google-veo-proxy.ts` | 116, 125, 129, 133, 141, 147, 151, 159 | `.select('token_balance, plan')` |
| `netlify/functions/media-proxies/google-imagen-proxy.ts` | 145, 154, 158, 162, 170, 176, 180, 188 | `.select('token_balance, plan')` |
| `netlify/functions/media-proxies/openai-image-proxy.ts` | 153, 162, 166, 170, 178, 184, 188, 196 | `.select('token_balance, plan')` |

**Severity:** Critical
**Impact:** All media proxy operations (DALL-E, Imagen, Veo) will fail token validation. Queries return `null` for non-existent column.

---

## 3. Database Migrations

### 3.1 Missing RLS Policies (HISTORICAL - Now Fixed)

**File:** `supabase/migrations/20250110000000_complete_schema.sql`

Tables initially created WITHOUT RLS (fixed in `20260129000005_rls_security_remediation.sql`):

| Table | Original Line | Fixed In |
|-------|--------------|----------|
| `automation_nodes` | 271 | `20260129000005_rls_security_remediation.sql` (line 15) |
| `automation_connections` | 285 | Line 74 |
| `api_rate_limits` | 619 | Line 128 |
| `scheduled_tasks` | 319 | Line 202 |
| `resource_downloads` | 603 | Line 241 |
| `help_articles` | 399 | Line 259 |
| `support_categories` | 384 | Line 278 |
| `contact_submissions` | 462 | Line 299 |
| `sales_leads` | 480 | Line 330 |
| `newsletter_subscribers` | 499 | Line 343 |
| `cache_entries` | 662 | Line 362 |
| `blog_authors` | 530 | Line 375 |

**Severity:** High (now fixed)

---

### 3.2 Duplicate Table Definitions

#### A. `webhook_audit_log` - Created Twice
| File | Line |
|------|------|
| `supabase/migrations/20250110000006_add_webhook_audit_log.sql` | 2 |
| `supabase/migrations/20250110000007_add_webhook_audit_log.sql` | 2 |

**Severity:** Medium - Uses `IF NOT EXISTS` but poor migration hygiene

#### B. `message_reactions` - Created Three Times
| File | Line |
|------|------|
| `supabase/migrations/20250113000002_add_multi_agent_chat_tables.sql` | 178 |
| `supabase/migrations/20260122000001_add_email_notifications_queue.sql` | 115 |
| `supabase/migrations/20260129000002_add_message_reactions.sql` | 6 |

**Severity:** High - Schema drift risk

---

### 3.3 UUID Function Inconsistency

| File | Line | Function Used |
|------|------|---------------|
| `supabase/migrations/20250110000011_create_backup_tables.sql` | 20, 29 | `uuid_generate_v4()` |
| `supabase/migrations/20250110000012_create_privacy_tables.sql` | 19, 30, 45, 57 | `uuid_generate_v4()` |
| `supabase/migrations/20250111000004_add_vibe_agent_actions.sql` | 7 | `uuid_generate_v4()` |

**Standard:** `gen_random_uuid()` (from `pgcrypto`)
**Severity:** Low - Mixed usage

---

## 4. Store Type Definitions

### 4.1 Session Status Types - DUPLICATED

| File | Line | Definition |
|------|------|------------|
| `src/shared/stores/agent-metrics-store.ts` | 78 | `'pending' \| 'in_progress' \| 'completed' \| 'failed'` |
| `src/shared/stores/chat-store.ts` | 24 | Same values, duplicated |
| `src/shared/stores/mission-control-store.ts` | 12-22 | Same values, duplicated |

**Severity:** Medium

---

### 4.2 User Plan/Role - DUPLICATED

| File | Line | Type |
|------|------|------|
| `src/shared/stores/user-profile-store.ts` | 15 | `plan: 'free' \| 'pro' \| 'enterprise'` |
| `src/shared/types/store-types.ts` | 31 | `export type UserPlan = 'free' \| 'pro' \| 'enterprise'` |
| `src/shared/stores/user-profile-store.ts` | 16 | `role: 'user' \| 'admin' \| 'moderator'` |
| `src/shared/types/store-types.ts` | 30 | `export type UserRole = 'user' \| 'admin' \| 'moderator'` |

**Severity:** Medium

---

### 4.3 Employee Status - INCONSISTENT

| File | Line | Definition |
|------|------|------------|
| `src/shared/stores/mission-control-store.ts` | 34 | `'thinking' \| 'using_tool' \| 'idle' \| 'error'` |
| `src/shared/stores/multi-agent-chat-store.ts` | 55, 135 | `'online' \| 'offline' \| 'busy' \| 'idle'` |

**Severity:** Medium

---

### 4.4 Theme Type - TRIPLE DEFINITION

| File | Line |
|------|------|
| `src/shared/stores/global-settings-store.ts` | 12 |
| `src/shared/stores/layout-store.ts` | 26 |
| `src/shared/types/store-types.ts` | 262 |

**Severity:** Low

---

### 4.5 Missing Exports

**WorkforceState not exported in index.ts:**
- `src/shared/stores/index.ts` (Lines 41-50) - Missing `WorkforceState` export
- Should be: `export { type WorkforceState } from './workforce-store';`

**Severity:** Medium

---

## 5. React Query Hook Return Types

### 5.1 Hooks Missing Return Type Annotations

| File | Line Numbers | Hook Count |
|------|--------------|------------|
| `src/features/chat/hooks/use-message-reactions.ts` | 40, 60, 79, 176, 253, 368 | 6 hooks |
| `src/features/chat/hooks/use-search-history.ts` | 48, 76, 103, 135, 169, 207, 273, 321, 369, 395 | 10 hooks |
| `src/features/chat/hooks/use-conversation-branches.ts` | 54, 77, 99, 118, 138, 195, 235, 268, 325, 491, 518, 546, 602 | 13 hooks |

**Severity:** Medium
**Issue:** 29 hooks lack explicit return type annotations

---

### 5.2 Helper Functions Returning `Promise<any>`

| File | Line Number | Function |
|------|-------------|----------|
| `src/features/chat/hooks/use-message-reactions.ts` | 30 | `async function getCurrentUser()` |
| `src/features/chat/hooks/use-search-history.ts` | 26 | `async function getCurrentUser()` |
| `src/features/chat/hooks/use-conversation-history.ts` | 28 | `async function getCurrentUser()` |
| `src/features/workforce/hooks/use-workforce-queries.ts` | 84 | `async function getCurrentUser()` |

**Severity:** Medium
**Issue:** Return `Promise<any>` instead of `Promise<User | null>`

---

## Summary by Severity

### CRITICAL (1 issue)
1. Token column naming mismatch in Netlify proxy functions - Will cause runtime failures

### HIGH (3 issues)
1. Duplicate type definitions (Message, ToolCall, ChatMessage)
2. Duplicate table definitions in migrations (`message_reactions`)
3. Missing RLS policies (historical, now fixed)

### MEDIUM (8 issues)
1. MessageRole inconsistency across 5 files
2. ConversationBranch schema mismatch
3. UUID function inconsistency in migrations
4. SessionStatusType duplicated in 3 stores
5. UserPlan/UserRole duplicated
6. EmployeeStatus inconsistent across stores
7. 29 React Query hooks missing return types
8. 4 helper functions returning `Promise<any>`

### LOW (2 issues)
1. Theme type triple definition
2. NotificationPriority additional value in store-types.ts

---

## Recommendations

### Immediate Actions (Critical)
1. **Fix token column naming** - Replace `token_balance` with `current_balance` in:
   - `netlify/functions/utils/token-balance-check.ts`
   - `netlify/functions/media-proxies/google-veo-proxy.ts`
   - `netlify/functions/media-proxies/google-imagen-proxy.ts`
   - `netlify/functions/media-proxies/openai-image-proxy.ts`

### Short-term (High Priority)
1. **Consolidate type definitions** - Use `common.ts` as single source of truth
2. **Fix duplicate migration tables** - Merge `message_reactions` definitions
3. **Export WorkforceState** - Add to `index.ts`

### Medium-term (Medium Priority)
1. Add return type annotations to 29 hooks
2. Fix `getCurrentUser()` to return `Promise<User | null>`
3. Create shared status types (`SessionStatusType`, `EmployeeStatusType`)
4. Standardize UUID functions to `gen_random_uuid()`

---

*Report generated by Data Integrity & Types Audit Team*
