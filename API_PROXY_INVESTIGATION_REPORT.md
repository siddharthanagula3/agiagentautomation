# API Proxy Configuration Investigation Report

## Executive Summary

The API proxy configuration has **3 critical issues** and **2 warnings**:

1. **CRITICAL**: Import path mismatch in multiple files
2. **CRITICAL**: Missing Perplexity API proxy function
3. **CRITICAL**: Direct API key exposure in development mode
4. **WARNING**: Inconsistent API integration patterns
5. **WARNING**: Duplicate LLM service configurations

---

## 1. NETLIFY FUNCTIONS - Proxy Configuration

### Status: 3 of 4 Proxy Functions Implemented

#### Implemented Proxies ✅

- **anthropic-proxy.ts** (5.5 KB)
- **openai-proxy.ts** (5.4 KB)
- **google-proxy.ts** (7.7 KB)

#### Missing Proxy ❌

- **perplexity-proxy.ts** (NOT IMPLEMENTED)

### Proxy Function Features (All 3)

```
✅ Request validation (max 1MB payload, max 100 messages)
✅ Token usage tracking and billing integration
✅ Rate limiting via Upstash Redis (10 req/min per user)
✅ Authentication middleware (JWT verification)
✅ CORS headers properly configured
✅ Error handling with standardized responses
✅ Token cost calculation and database storage
```

### Environment Variables Required

All three proxies require environment variables in Netlify:

- `VITE_ANTHROPIC_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_GOOGLE_API_KEY`
- `VITE_PERPLEXITY_API_KEY` (not yet used)

---

## 2. LLM SERVICE ARCHITECTURE

### Unified LLM Service

**Location**: `src/core/ai/llm/unified-language-model.ts` (21.3 KB)

```
UnifiedLLMService
├── Providers
│   ├── AnthropicProvider
│   ├── OpenAIProvider
│   ├── GoogleProvider
│   └── PerplexityProvider
├── Message Conversion
├── Response Normalization
├── Security Layers (3)
│   ├── Prompt Injection Detection
│   ├── API Abuse Prevention
│   └── Request Size Validation
└── Token Tracking
```

### Security Implementation

**Layer 1: Prompt Injection Detection**

- Checks user input against injection patterns
- Sanitizes malicious content
- Logs injection attempts with risk levels

**Layer 2: API Abuse Prevention**

- Tracks concurrent requests per user
- Enforces rate limits
- Checks token sufficiency before API calls

**Layer 3: Request Size Validation**

- Max conversation length: enforced
- Max messages: 100 per request
- Max individual message length: validated

---

## CRITICAL ISSUE #1: Import Path Mismatch

### Problem

Files import from `unified-llm-service` but the file is named `unified-language-model.ts`

### Affected Files

```
❌ src/services/enhanced-ai-chat-service-v2.ts
   Import: 'import { unifiedLLMService } from '@core/ai/llm/unified-llm-service'
   Should be: '@core/ai/llm/unified-language-model'

❌ src/core/integrations/chat-completion-handler.ts
   Import: 'import { unifiedLLMService } from '@core/ai/llm/unified-llm-service'
   Should be: '@core/ai/llm/unified-language-model'

❌ src/core/integrations/token-usage-tracker.ts
   Import: 'import type { LLMProvider } from './llm/unified-llm-service'
   Should be: './llm/unified-language-model'
```

### Impact

- These modules will NOT compile (import failures)
- Chat completion handler will fail to initialize
- Token usage tracking will fail

### Files Correct ✅

```
✅ src/features/chat/services/streaming-response-handler.ts
✅ src/features/vibe/services/vibe-execution-coordinator.ts
✅ src/features/vibe/services/vibe-complexity-analyzer.ts
✅ src/features/vibe/services/vibe-agent-router.ts
✅ src/core/ai/orchestration/workforce-orchestrator.ts
✅ src/core/ai/orchestration/agent-conversation-protocol.ts
```

---

## CRITICAL ISSUE #2: Missing Perplexity Proxy Function

### Problem

The unified LLM service expects `perplexity-proxy` but it doesn't exist

### Evidence

**unified-language-model.ts** (line 29-34):

```typescript
import {
  perplexityProvider,
  PerplexityProvider,
  PerplexityMessage,
  PerplexityResponse,
  PerplexityConfig,
} from './providers/perplexity-ai';
```

**perplexity-ai.ts** (line 98-102):

```typescript
async sendMessage(
  messages: PerplexityMessage[],
  sessionId?: string,
  userId?: string
): Promise<PerplexityResponse> {
  try {
    throw new PerplexityError(
      'Direct Perplexity API calls are disabled for security.
       Use /.netlify/functions/perplexity-proxy instead.',
      'DIRECT_API_DISABLED'
    );
```

### Impact

- Perplexity provider will always throw an error
- Using Perplexity models will fail
- Proxy function not available to route requests

### Solution Required

Create: `netlify/functions/perplexity-proxy.ts`

---

## CRITICAL ISSUE #3: Direct API Key Exposure in Development

### Problem 1: message-streaming.ts

**Location**: `src/features/mission-control/services/message-streaming.ts` (lines 36-47)

```typescript
const OPENAI_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_OPENAI_API_KEY || ''
  : '';
const ANTHROPIC_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_ANTHROPIC_API_KEY || ''
  : '';
const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''
  : '';
const PERPLEXITY_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_PERPLEXITY_API_KEY || ''
  : '';
```

**Implementation** (lines 52-153):

- Checks `if (import.meta.env.PROD)` then uses proxy
- Checks `if (import.meta.env.DEV)` then uses direct API key
- Makes direct API calls to OpenAI, Anthropic, Google in dev mode

**Issue**:

- API keys are accessible in browser dev mode
- Stream implementation bypasses proxy security
- Development-only code path uses direct APIs

### Problem 2: media-generation-handler.ts

**Location**: `src/core/integrations/media-generation-handler.ts`

```typescript
const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''
  : '';
```

Same issue: direct API key in development mode.

---

## 4. API INTEGRATION PATTERNS

### Chat Interface Flow

```
ChatInterface.tsx
  ↓ (useChat hook)
  → unified-language-model.ts (sendMessage)
    ↓ (converts to provider format)
    → AnthropicProvider / OpenAIProvider / GoogleProvider
      ↓ (fetches)
      → /.netlify/functions/[provider]-proxy
        ↓ (server-side)
        → Actual API Provider (Anthropic, OpenAI, Google)
        ↓ (returns)
        → Token tracking to Supabase
```

### Mission Control Flow

```
MissionControlDashboard.tsx
  ↓ (handleSendMessage)
  → workforceOrchestratorRefactored.processRequest()
    ↓ (orchestrates)
    → workforceOrchestratorRefactored.executeRequest()
      ↓ (calls)
      → unified-language-model.ts (sendMessage)
        ↓ (routes through)
        → Netlify proxy functions
```

### Vibe Feature Flow

```
VibeMessageService.processUserMessage()
  ↓
  → workforceOrchestratorRefactored.processRequest()
    ↓
    → unified-language-model.ts
      ↓
      → Netlify proxy
```

---

## 5. ENVIRONMENT VARIABLES

### Current Configuration

**Client-side (exposed in browser):**

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_OPENAI_API_KEY ⚠️ (exposed in dev)
VITE_ANTHROPIC_API_KEY ⚠️ (exposed in dev)
VITE_GOOGLE_API_KEY ⚠️ (exposed in dev)
VITE_PERPLEXITY_API_KEY ⚠️ (exposed in dev)
```

**Server-side (Netlify Functions only):**

```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### Security Issue ⚠️

API keys with `VITE_` prefix are embedded in client-side JavaScript bundles.

- In production: Keys should NOT be present
- In development: Keys are accessible via DevTools → Sources
- Proper: Always use server-side proxies (currently implemented correctly in providers)

---

## 6. DUPLICATIONS & CONFLICTS

### Duplicate Service Implementations

```
src/core/integrations/chat-completion-handler.ts
├── Uses: unifiedLLMService
├── Pattern: Direct LLM calls
└── Status: Correct implementation

src/services/enhanced-ai-chat-service-v2.ts
├── Uses: unifiedLLMService (wrong import path)
├── Pattern: Provider configuration checks
└── Status: Import error - BROKEN
```

### Token Tracking Duplication

```
netlify/functions/utils/token-tracking.ts
├── calculateTokenCost() - Calculates costs
├── storeTokenUsage() - Stores in Supabase
└── Uses: TOKEN_PRICING constant

src/core/integrations/token-usage-tracker.ts
├── TOKEN_PRICING constant (more recent pricing)
├── Different cost calculations
└── Not integrated with proxy functions
```

---

## 7. MISSING STREAMING SUPPORT

### Current State

```
Proxy Functions: ❌ NO STREAMING
- anthropic-proxy.ts: Non-streaming only
- openai-proxy.ts: Non-streaming only
- google-proxy.ts: Non-streaming only

Provider Implementations: ⚠️ PARTIAL STREAMING
- AnthropicProvider.streamMessage(): Throws error "disabled for security"
- OpenAIProvider.streamMessage(): Throws error "disabled for security"
- GoogleProvider.streamMessage(): Throws error "disabled for security"
- PerplexityProvider.streamMessage(): Throws error "disabled for security"

Mission Control Service: ⚠️ STREAMING IN DEV ONLY
- message-streaming.ts: Implements streaming with direct API keys in DEV mode
```

### Issue

Streaming is either disabled or uses insecure direct API calls in development.

---

## 8. CONFIGURATION ISSUES

### Issue 1: Rate Limiter Configuration

**File**: `netlify/functions/utils/rate-limiter.ts`

```typescript
if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.warn('[Rate Limiter] Redis not configured...');
  return null; // Rate limiting DISABLED
}
```

**Status**:

- If Redis not configured: Rate limiting passes through all requests
- Production deployment might be running without rate limits
- Falls back to in-memory limiting (doesn't work in serverless)

### Issue 2: Auth Middleware Configuration

**File**: `netlify/functions/utils/auth-middleware.ts`

```typescript
if (!authHeader) {
  return { statusCode: 401, ... }; // Blocks requests
}
```

**Status**: All proxy endpoints require authentication

- Good for security
- May break unauthenticated API access in development

---

## 9. PROVIDER CONFIGURATION STATUS

### Anthropic Claude ✅

- Direct calls: DISABLED ✅
- Proxy: ENABLED ✅
- Models: 5 models supported
- Default: claude-3-5-sonnet-20241022
- Token tracking: Implemented

### OpenAI GPT ✅

- Direct calls: DISABLED ✅
- Proxy: ENABLED ✅
- Models: 4 models supported
- Default: gpt-4o-mini
- Token tracking: Implemented

### Google Gemini ✅

- Direct calls: DISABLED ✅
- Proxy: ENABLED ✅
- Models: 4 models supported
- Default: gemini-2.0-flash-exp
- Token tracking: Implemented

### Perplexity AI ❌

- Direct calls: DISABLED ✅
- Proxy: NOT IMPLEMENTED ❌
- Throws error: "Use proxy instead"
- Models: 3 models defined
- Default: llama-3.1-sonar-large-128k-online
- Token tracking: Implemented in proxy utils

---

## SUMMARY OF FINDINGS

### Critical Issues (Must Fix)

1. **Import Path Mismatch** - 3 files using wrong import path
2. **Missing Perplexity Proxy** - Function not implemented
3. **API Key Exposure** - Direct API calls in development mode

### Warnings (Should Review)

4. **Duplicate Implementations** - Two chat service versions
5. **Incomplete Streaming** - Streaming disabled for all providers

### Working Well ✅

- Proxy architecture is sound
- Auth/Rate limiting middleware configured
- Token tracking integration
- Security layers (injection detection, abuse prevention)
- CORS properly configured
- Error handling comprehensive

---

## RECOMMENDATIONS

### Immediate Fixes

1. Fix import paths: `unified-llm-service` → `unified-language-model`
2. Create `perplexity-proxy.ts` following the pattern of other proxies
3. Remove dev-mode direct API key usage in message-streaming.ts
4. Remove dev-mode direct API key usage in media-generation-handler.ts

### Configuration

5. Ensure Upstash Redis is configured in Netlify environment
6. Verify authentication is optional for development (or use test tokens)
7. Update TOKEN_PRICING in token-tracking to match token-usage-tracker

### Future Improvements

8. Implement streaming through proxy functions
9. Consolidate duplicate service implementations
10. Add comprehensive API error recovery
11. Implement circuit breaker pattern for API failures
