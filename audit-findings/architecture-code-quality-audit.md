# Architecture & Code Quality Audit Report

**Team 3 - Focus Areas**
- Store Patterns (Global vs Feature-Local)
- localStorage Direct Access
- React Query Error Handling
- VIBE vs Chat Store Decisions
- Import Alias Usage

---

## 1. Store Patterns (Global vs Feature-Local)

### Issue 1.1: Redundant Store Locations
**Severity:** Medium
**Files:**
- `src/shared/stores/chat-store.ts`
- `src/shared/stores/multi-agent-chat-store.ts`
- `src/features/vibe/stores/vibe-chat-store.ts`

**Description:** Multiple chat stores exist across the codebase with overlapping functionality. The global `chat-store.ts` handles chat sessions while VIBE has its own `vibe-chat-store.ts` for similar operations. This creates maintenance overhead and potential inconsistencies.

**Evidence:**
```
src/shared/stores/chat-store.ts       (1200+ lines)
src/shared/stores/multi-agent-chat-store.ts (1100+ lines)
src/features/vibe/stores/vibe-chat-store.ts  (local feature)
```

**Recommendation:** Consider consolidating chat-related state or clearly documenting when feature-local stores should be used vs global stores.

---

## 2. localStorage Direct Access

### Issue 2.1: Critical - API Client Uses localStorage Instead of Auth Store
**Severity:** Critical
**File:** `src/shared/lib/api.ts:49-72`

**Description:** The `APIClient` class directly accesses `localStorage.getItem('auth_token')` instead of using the centralized auth store. This bypasses the authentication abstraction and creates potential synchronization issues.

**Evidence:**
```typescript
// api.ts:49-72
private getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(this.tokenKey);  // Direct localStorage access
}

private setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(this.tokenKey, token);  // Direct localStorage access
}
```

**Contrast with auth store approach in authentication-store.ts:231-246:**
```typescript
// Uses proper cleanup with try-catch in auth store
try {
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('sb-lywdzvfibhzbljrgovwr-auth-token');
} catch (e) {
  logger.debug('Could not clear localStorage');
}
```

**Recommendation:** Refactor `APIClient` to use `useAuthStore.getState().user` or create a proper auth token getter in the auth store that both can use.

### Issue 2.2: High - Multiple Direct localStorage Access Points
**Severity:** High
**Files:**
- `src/shared/lib/cache.ts:92-145`
- `src/shared/lib/security.ts:756-859`
- `src/shared/stores/query-client.ts:365`
- `src/shared/utils/browser-utils.ts:41-102`
- `src/shared/hooks/useSessionTimeout.ts:67-96`
- `src/features/vibe/services/vibe-file-system.ts:812-849`
- `src/core/storage/chat/chat-history-persistence.ts:440-475`

**Description:** At least 12+ files directly access localStorage. This scattered approach makes it difficult to:
1. Track all localStorage usage
2. Implement proper error handling consistently
3. Handle SSR scenarios uniformly
4. Manage cleanup on logout

**Evidence:**
```typescript
// src/shared/lib/cache.ts:92
const item = localStorage.getItem(this.getStorageKey(key));

// src/shared/stores/query-client.ts:365
const token = localStorage.getItem('auth_token');

// src/core/storage/chat/chat-history-persistence.ts:440
localStorage.setItem('chat-persistence-state', JSON.stringify(data));
```

**Recommendation:** Create a centralized localStorage utility with:
- Consistent error handling
- Type safety
- SSR guards
- Unified cleanup methods

### Issue 2.3: Hardcoded localStorage Keys
**Severity:** Medium
**Files:**
- `src/shared/lib/api.ts:41-42` - Hardcoded `'auth_token'`, `'refresh_token'`
- `src/shared/stores/query-client.ts:365` - Uses `'auth_token'`
- `src/shared/stores/chat-store.ts:1004` - Uses custom names like `'agi-chat-store'`

**Description:** No centralized key management for localStorage items leads to potential key collisions and inconsistent naming conventions.

**Recommendation:** Create a constants file for all localStorage keys:
```typescript
// e.g., src/shared/constants/storage-keys.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  CHAT_STORE: 'agi-chat-store',
  // ...
} as const;
```

---

## 3. React Query Error Handling

### Issue 3.1: Inconsistent Toast Notifications on Errors
**Severity:** Medium
**Files:**
- `src/features/chat/hooks/use-chat-queries.ts`
- `src/features/billing/hooks/use-billing-queries.ts`
- `src/features/workforce/hooks/use-workforce-queries.ts`

**Description:** Error handling is inconsistent across React Query hooks:

**Chat hooks** - Most mutations show toasts on error:
```typescript
// use-chat-queries.ts:322-323
onError: (error: Error, _variables, context): void => {
  toast.error('Failed to create chat');
}
```

**Billing hooks** - NO toast on error in most queries:
```typescript
// use-billing-queries.ts:172-179
if (error) {
  logger.error('[BillingQuery] Token balance error:', error);
  // Returns defaults silently - NO toast shown
  return { currentBalance: FREE_TIER_LIMIT, ... };
}
```

**SaveMessage mutation** - Explicitly does NOT show toast:
```typescript
// use-chat-queries.ts:922-925
onError: (error: Error): void => {
  logger.error('Failed to save message:', error);
  // Don't show toast for message saves - they happen in the background
}
```

**Recommendation:** Establish clear error handling patterns:
1. Mutations that fail visibly (user-initiated): Always show toast
2. Background operations: Log only, no toast
3. Critical failures: Show toast AND log

Document these patterns in a style guide or create a wrapper hook.

### Issue 3.2: Inconsistent Error Logging
**Severity:** Low
**Description:** Some hooks use `logger.error()`, some use `console.error`, and some don't log at all.

**Evidence:**
```typescript
// use-chat-queries.ts - uses logger
logger.error('Failed to create session:', error);

// use-billing-queries.ts - uses logger with prefix
logger.error('[BillingQuery] Token balance error:', error);

// Some places - no logging
// use-chat-queries.ts:922 - only logger but no context
logger.error('Failed to save message:', error);
```

**Recommendation:** Standardize on using the `logger` utility and include contextual information in all error logs.

### Issue 3.3: Meta Error Messages Not Always Used
**Severity:** Low
**Description:** Many hooks define `meta.errorMessage` but it's unclear if it's being used by the query client.

```typescript
// use-billing-queries.ts:342-343
meta: {
  errorMessage: 'Failed to load billing information',
},
```

**Recommendation:** Verify the query client actually uses these error messages, or document that they should be used in a global error boundary.

---

## 4. VIBE vs Chat Store Decisions

### Issue 4.1: Unclear Justification for Feature-Local Stores
**Severity:** Low
**Files:**
- `src/features/vibe/stores/vibe-chat-store.ts`
- `src/features/vibe/stores/vibe-file-store.ts`
- `src/features/vibe/stores/vibe-view-store.ts`
- `src/features/vibe/stores/vibe-agent-store.ts`
- `src/shared/stores/chat-store.ts`

**Description:** VIBE has its own feature-local stores while Chat uses global stores. The justification for this separation isn't documented.

**Observation:**
- VIBE stores are tightly coupled to VIBE-specific concepts (files, agents, views)
- Chat store handles generic chat sessions that could be shared
- The separation makes sense architecturally but isn't documented

**Recommendation:** Add documentation explaining why VIBE stores are feature-local:
- VIBE is a standalone feature outside the dashboard layout
- Files and editor state shouldn't persist globally
- Different persistence requirements than chat

### Issue 4.2: Potential Code Duplication
**Severity:** Low
**Files:** Comparing `vibe-chat-store.ts` vs `chat-store.ts`

**Description:** Both stores handle message storage and retrieval. There may be opportunities to share code.

**Evidence:**
- Both have message arrays
- Both handle sending/receiving messages
- Both have persistence logic

**Recommendation:** If the stores diverge significantly, document the differences. If they converge, consider extracting shared utilities.

---

## 5. Import Alias Usage

### Issue 5.1: Widespread Use of Relative Imports in Features
**Severity:** High
**Files:** Extensive use throughout `src/features/*/`

**Description:** Code in feature directories frequently uses relative imports (`../`, `../../`) instead of path aliases (`@features/`, `@shared/`, `@core/`).

**Evidence:**
```typescript
// src/features/chat/pages/ChatInterface.tsx:11-28
import { useChat } from '../hooks/use-chat-interface';
import { useChatHistory } from '../hooks/use-conversation-history';
import { useTools } from '../hooks/use-tool-integration';
// ... many more relative imports

// src/features/chat/components/Main/MessageList.tsx:4-6
import type { ChatMessage } from '../../types';
import { MessageBubble } from '../messages/MessageBubble';

// src/features/vibe/pages/VibeDashboard.tsx:17-26
import { useVibeChatStore } from '../stores/vibe-chat-store';
import { useVibeViewStore } from '../stores/vibe-view-store';
import { VibeLayout } from '../layouts/VibeLayout';
```

**Contrast with proper alias usage:**
```typescript
// src/features/billing/hooks/use-billing-queries.ts:16-20
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from '@shared/stores/authentication-store';
import { logger } from '@shared/lib/logger';
```

**Statistics:**
- ~150+ relative imports found in feature directories
- Most consistent alias usage: billing hooks
- Most inconsistent: chat and vibe features

**Recommendation:**
1. Enforce alias usage via ESLint rule:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["../*", "./../*"]
    }]
  }
}
```
2. Convert existing relative imports to aliases
3. Document when relative imports are acceptable (e.g., within same feature subdirectory)

### Issue 5.2: Mixed Import Styles in Same Files
**Severity:** Low
**Example:** `src/features/workforce/hooks/use-workforce-queries.ts`

```typescript
// Line 16-17 - Using aliases correctly
import { queryKeys } from '@shared/stores/query-client';
import { supabase } from '@shared/lib/supabase-client';

// Line 24 - Using relative import
import {
  listPurchasedEmployees,
  // ...
} from '../services/employee-database';
```

**Recommendation:** When making changes to a file, convert relative imports to aliases as encountered.

---

## Summary

| Issue | Severity | Count |
|-------|----------|-------|
| localStorage direct access bypassing auth store | Critical | 1 |
| Multiple localStorage access points | High | 12+ |
| Inconsistent relative vs alias imports | High | 150+ |
| Inconsistent React Query error handling | Medium | Multiple |
| Hardcoded localStorage keys | Medium | Multiple |
| Unclear store separation justification | Low | - |
| Mixed import styles | Low | - |

---

## Priority Actions

1. **Critical:** Refactor `APIClient` to use auth store instead of direct localStorage
2. **High:** Create centralized localStorage utility
3. **High:** Add ESLint rule to enforce path aliases in features
4. **Medium:** Document React Query error handling patterns
5. **Medium:** Create localStorage key constants
6. **Low:** Document VIBE vs Chat store decisions
