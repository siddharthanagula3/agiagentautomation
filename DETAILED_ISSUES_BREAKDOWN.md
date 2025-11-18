# Detailed Issues Breakdown with Code Examples

## CRITICAL ISSUE #1: Import Path Mismatch

### File 1: src/services/enhanced-ai-chat-service-v2.ts
```typescript
Line 6:
❌ import { unifiedLLMService } from '@core/ai/llm/unified-llm-service';

Solution: Change to:
✅ import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

Impact: testProviderConnection() function will fail
```

### File 2: src/core/integrations/chat-completion-handler.ts
```typescript
Line 6:
❌ import { unifiedLLMService } from '@core/ai/llm/unified-llm-service';

Solution: Change to:
✅ import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

Impact: sendAIMessage() function will fail
```

### File 3: src/core/integrations/token-usage-tracker.ts
```typescript
Line 7:
❌ import type { LLMProvider } from './llm/unified-llm-service';

Solution: Change to:
✅ import type { LLMProvider } from './llm/unified-language-model';

Impact: Type definitions missing, TokenLogEntry interface fails
```

---

## CRITICAL ISSUE #2: Missing Perplexity Proxy

### Current Problem
The perplexity-ai provider is imported and initialized but immediately throws an error:

```typescript
// src/core/ai/llm/providers/perplexity-ai.ts lines 98-102
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

### What's Expected
The unified LLM service initializes it:

```typescript
// src/core/ai/llm/unified-language-model.ts lines 169-170
// Initialize providers
this.providers.set('perplexity', perplexityProvider);
```

### What's Missing
`netlify/functions/perplexity-proxy.ts` does NOT exist

### Files That Need It
- Any code using `provider: 'perplexity'` in sendMessage calls
- Models: 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'

### Required Template
Follow the pattern from google-proxy.ts:
1. Extract messages and model from request body
2. Call Perplexity API endpoint
3. Format response for UI consumption
4. Track token usage
5. Add CORS headers
6. Handle authentication

---

## CRITICAL ISSUE #3: Direct API Key Usage in Development

### Problem Location 1: message-streaming.ts
```typescript
// src/features/mission-control/services/message-streaming.ts lines 36-48

// ⚠️ SECURITY ISSUE: API keys exposed in development mode
const OPENAI_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_OPENAI_API_KEY || ''  // Exposed in dev!
  : '';
const ANTHROPIC_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_ANTHROPIC_API_KEY || ''  // Exposed in dev!
  : '';
const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''  // Exposed in dev!
  : '';
const PERPLEXITY_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_PERPLEXITY_API_KEY || ''  // Exposed in dev!
  : '';

// Then later in streamOpenAI function:
if (import.meta.env.PROD) {
  // Use proxy in production
  const response = await fetch('/.netlify/functions/openai-proxy', {
    // ...
  });
} else {
  // Direct API call in development - SECURITY RISK
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,  // Key exposed
    },
    // ...
  });
}
```

**Why This Is Bad:**
- Vite's dev bundle includes the secret keys
- Chrome DevTools → Sources shows the API keys in plaintext
- Anyone with access to dev machine can extract keys
- Different security model vs production

**Affected Functions:**
- streamOpenAI() - lines 52-153
- streamAnthropic() - lines 158-220+ (similar pattern)
- streamGoogle() - similar pattern

### Problem Location 2: media-generation-handler.ts
```typescript
// src/core/integrations/media-generation-handler.ts

const GOOGLE_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_GOOGLE_API_KEY || ''  // Exposed
  : '';

// Used in image generation - direct API call bypasses proxy
```

---

## ARCHITECTURE COMPARISON

### Current Implementation (Mostly Correct)

```
Correct Flow (Most Services):
┌─ ChatInterface.tsx
├─ useChat hook
├─ sendMessage()
├─ unifiedLLMService.sendMessage()
├─ AnthropicProvider.sendMessage()
├─ fetch('/.netlify/functions/anthropic-proxy') ✅
├─ Netlify Function validates & routes
├─ Anthropic API receives request
├─ Response tracked & returned
└─ Token usage stored in Supabase ✅

Incorrect Flow (Message Streaming):
┌─ MissionControlDashboard
├─ message-streaming.ts
├─ streamAnthropic()
├─ if (PROD) → use proxy ✅
├─ else → direct API call ⚠️ SECURITY ISSUE
├─ fetch('https://api.anthropic.com/v1/messages')
├─ API keys in browser bundle
└─ Response NOT tracked in Supabase
```

---

## TOKEN TRACKING INCONSISTENCY

### Source 1: Proxy Function Token Tracking
**File**: `netlify/functions/utils/token-tracking.ts`

```typescript
// Token pricing (prices per 1M tokens):
const TOKEN_PRICING = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    // ...
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    // ...
  },
  // ... etc
};

// Stored in: token_usage table via Supabase
// Called by: All three proxy functions
```

### Source 2: Integration Token Tracker
**File**: `src/core/integrations/token-usage-tracker.ts`

```typescript
// Token pricing (different format, different prices):
const TOKEN_PRICING: Record<string, ...> = {
  'gpt-5-thinking': { input: 15.0, output: 45.0, provider: 'openai' },
  'gpt-4o': { input: 5.0, output: 15.0, provider: 'openai' },  // Different from proxy!
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  // ... more models with different prices
};

// NOT integrated with proxy functions
// NOT used in actual token tracking
// Appears to be dead code or future implementation
```

### Issue
- Two different pricing tables
- Different prices for same models (gpt-4o: 2.5 vs 5.0)
- Inconsistent billing calculations

---

## ENVIRONMENT VARIABLE SECURITY

### Problem: VITE_ prefix means public
```
VITE_* variables are embedded in the JavaScript bundle
In production build, these should be EMPTY/MISSING

Current setup:
├── Production:
│   ├── VITE_OPENAI_API_KEY: NOT SET ✅
│   ├── VITE_ANTHROPIC_API_KEY: NOT SET ✅
│   ├── Uses proxy functions with server-side keys ✅
│   └── Safe
│
└── Development (npm run dev):
    ├── VITE_OPENAI_API_KEY: sk-... (visible in DevTools) ⚠️
    ├── VITE_ANTHROPIC_API_KEY: sk-ant-... (visible) ⚠️
    ├── Some code uses them directly ⚠️
    └── Potentially compromised
```

### Ideal Solution
- Remove all VITE_ API keys from .env
- Use environment-specific configuration
- Always use proxies, never direct API calls
- Keys only in Netlify server-side environment

---

## AUTHENTICATION FLOW

### Current Implementation (auth-middleware.ts)
```typescript
export function withAuth(handler: AuthenticatedHandler): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      // 1. Extract token from Authorization header
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader) {
        return { statusCode: 401, ... }; // Reject
      }
      
      // 2. Remove 'Bearer ' prefix
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      // 3. Verify with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return { statusCode: 401, ... }; // Reject
      }
      
      // 4. Attach user to event
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user: { id: user.id, email: user.email },
      };
      
      // 5. Call handler with authenticated event
      return await handler(authenticatedEvent, context);
    } catch (error) {
      return { statusCode: 500, ... };
    }
  };
}
```

### Applied To:
- ✅ anthropic-proxy.ts
- ✅ openai-proxy.ts
- ✅ google-proxy.ts
- ❌ perplexity-proxy.ts (doesn't exist yet)

### Issue
Development mode may require auth tokens that aren't available,
blocking legitimate development requests.

---

## RATE LIMITING CONFIGURATION

### Current Logic (rate-limiter.ts)
```typescript
function initializeRateLimiter() {
  if (ratelimit) return ratelimit;

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Redis not configured:
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Rate Limiter] Redis not configured...');
    return null;  // Returns null, no rate limiting!
  }

  // Creates rate limiter with 10 requests per 1 minute
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'agi-agent',
  });

  return ratelimit;
}
```

### Middleware Usage
```typescript
export function withRateLimit(handler) {
  return async (event: HandlerEvent) => {
    const rateLimitResult = await checkRateLimit(event);

    if (!rateLimitResult.success) {
      return { statusCode: 429, ... }; // Rate limited
    }

    // Continues to handler...
  };
}
```

### Configuration Dependency
If Netlify environment doesn't have:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Then rate limiting is completely disabled. All requests pass through.

---

## FINAL CHECKLIST

### Deployment Readiness

**Environment Variables** - Production Netlify
- [ ] VITE_ANTHROPIC_API_KEY = (UNSET/EMPTY)
- [ ] VITE_OPENAI_API_KEY = (UNSET/EMPTY)
- [ ] VITE_GOOGLE_API_KEY = (UNSET/EMPTY)
- [ ] VITE_PERPLEXITY_API_KEY = (UNSET/EMPTY)
- [ ] VITE_SUPABASE_URL = configured
- [ ] VITE_SUPABASE_ANON_KEY = configured
- [ ] VITE_STRIPE_PUBLISHABLE_KEY = configured
- [ ] SUPABASE_SERVICE_ROLE_KEY = configured
- [ ] STRIPE_SECRET_KEY = configured
- [ ] STRIPE_WEBHOOK_SECRET = configured
- [ ] UPSTASH_REDIS_REST_URL = configured (for rate limiting)
- [ ] UPSTASH_REDIS_REST_TOKEN = configured (for rate limiting)

**Code Fixes Required**
- [ ] Fix import paths (3 files)
- [ ] Create perplexity-proxy.ts
- [ ] Remove direct API calls from message-streaming.ts
- [ ] Remove direct API calls from media-generation-handler.ts
- [ ] Consolidate token pricing tables

**Testing**
- [ ] Test all three proxy functions with auth token
- [ ] Test rate limiting with Redis
- [ ] Test token tracking and billing
- [ ] Test streaming responses
- [ ] Test error handling and recovery

