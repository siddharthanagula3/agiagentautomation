# Infrastructure & Functions Audit Findings

**Audit Date:** February 16, 2026
**Auditor:** Team 4 - Infrastructure & Functions
**Files Audited:** 35+ files across Netlify Functions, integrations, and configuration

---

## Executive Summary

The codebase has **strong security foundations** with proper authentication middleware, rate limiting, input validation, and server-side price validation. However, several inconsistencies and gaps were identified that should be addressed.

---

## 1. Environment Variable Consistency Issues

### Issue 1.1: Missing Server-Side API Keys in .env.example
**Severity:** High
**Files:** `.env.example`

The `.env.example` file is missing non-prefixed (server-side only) environment variables for several LLM providers. Currently it only shows:

```bash
# Client-side keys (VITE_ prefix exposes to browser)
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

**Missing server-side keys:**
- `ANTHROPIC_API_KEY` - Used by `anthropic-proxy.ts:67`
- `OPENAI_API_KEY` - Used by `openai-proxy.ts:66`
- `GOOGLE_API_KEY` - Used by `google-proxy.ts:66`, `google-imagen-proxy.ts:71`
- `PERPLEXITY_API_KEY` - Used by `perplexity-proxy.ts:65`
- `GROK_API_KEY` - Used by `grok-proxy.ts:66`
- `DEEPSEEK_API_KEY` - Used by `deepseek-proxy.ts:66`
- `QWEN_API_KEY` - Used by `qwen-proxy.ts:70`

**Evidence:**
```typescript
// openai-proxy.ts:66
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// anthropic-proxy.ts:67
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
```

**Recommendation:** Add a "Server-side keys (Netlify Functions - never exposed to browser)" section in `.env.example` with all non-VITE_ prefixed API keys.

---

### Issue 1.2: Duplicate/Misleading Key Definitions
**Severity:** Medium
**Files:** `.env.example:21-32`

The `.env.example` shows both `VITE_DEEPSEEK_API_KEY` and `DEEPSEEK_API_KEY`, but it's unclear which should be used:

```bash
# Line 27 (client-side)
VITE_DEEPSEEK_API_KEY=sk-...
# Line 31 (server-side)
DEEPSEEK_API_KEY=sk-...
```

The proxies consistently use non-prefixed versions (`process.env.DEEPSEEK_API_KEY`), so the VITE_ versions are misleading.

**Recommendation:** Remove the VITE_ prefixed versions of server-side only keys from `.env.example`.

---

## 2. Missing CORS Headers in Payment Functions

### Issue 2.1: get-billing-portal.ts Missing CORS Headers
**Severity:** High
**File:** `netlify/functions/payments/get-billing-portal.ts`

The billing portal function does NOT include CORS headers in error responses, which could cause CORS errors for frontend applications.

**Evidence:**
```typescript
// get-billing-portal.ts:24-27 - No CORS headers
if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}
```

Compare with properly implemented functions like `openai-proxy.ts:57-63`:
```typescript
if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    headers: corsHeaders,  // ✅ Has CORS headers
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}
```

**Recommendation:** Add CORS headers to all response objects in `get-billing-portal.ts`.

---

### Issue 2.2: create-pro-subscription.ts Missing CORS Headers
**Severity:** High
**File:** `netlify/functions/payments/create-pro-subscription.ts:34-38, 47-51`

Similar issue - error responses lack CORS headers:

```typescript
// Line 34-38
if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
    // Missing: headers: corsHeaders
  };
}
```

**Recommendation:** Add CORS header imports and include them in all responses.

---

### Issue 2.3: buy-token-pack.ts Missing CORS Headers
**Severity:** High
**File:** `netlify/functions/payments/buy-token-pack.ts:22-28`

Same pattern - missing CORS headers on error responses.

**Recommendation:** Add CORS headers to all response objects.

---

## 3. CORS Configuration Issues

### Issue 3.1: Hardcoded Production Domain
**Severity:** Low
**File:** `netlify/functions/utils/cors.ts:8-18`

The allowed origins list contains hardcoded production domains:

```typescript
const ALLOWED_ORIGINS: string[] = [
  'https://agiagentautomation.netlify.app',
  'https://agiagentautomation.com',
  'https://www.agiagentautomation.com',
  // ...
];
```

**Issue:** If the production domain changes, this code needs to be updated. Consider using an environment variable.

**Recommendation:** Make allowed origins configurable via environment variable with a fallback to the hardcoded list.

---

### Issue 3.2: Missing OPTIONS Method Support in Some Functions
**Severity:** Medium
**File:** `netlify/functions/payments/create-pro-subscription.ts`, `buy-token-pack.ts`

Payment functions don't handle OPTIONS preflight requests, which can cause CORS issues:

```typescript
// These functions don't check for OPTIONS method
if (event.httpMethod === 'OPTIONS') {
  // Return CORS headers for preflight
}
```

**Recommendation:** Add OPTIONS handling similar to LLM proxies.

---

## 4. External API Integration Issues

### Issue 4.1: Incomplete Provider List
**Severity:** Medium
**File:** `src/core/integrations/chat-completion-handler.ts:65-68`

The `getConfiguredProviders()` function returns only 4 providers, but there are 7 LLM proxies:

```typescript
// Current implementation
export function getConfiguredProviders(): AIProvider[] {
  return ['openai', 'anthropic', 'google', 'perplexity'];
}
```

**Available proxies:**
1. OpenAI (`openai-proxy.ts`)
2. Anthropic (`anthropic-proxy.ts`)
3. Google (`google-proxy.ts`)
4. Perplexity (`perplexity-proxy.ts`)
5. Grok (`grok-proxy.ts`)
6. DeepSeek (`deepseek-proxy.ts`)
7. Qwen (`qwen-proxy.ts`)

**Recommendation:** Update to include all available providers or dynamically detect from proxy availability.

---

### Issue 4.2: Web Search Handler Missing Error Context
**Severity:** Low
**File:** `src/core/integrations/web-search-handler.ts:362-368`

When all search providers fail, the error message isn't helpful:

```typescript
throw new Error('All search providers failed');
```

**Recommendation:** Include which providers failed in the error message for debugging.

---

## 5. Rate Limiter Issues

### Issue 5.1: Rate Limiter Fails Closed Without Redis
**Severity:** Medium
**File:** `netlify/functions/utils/rate-limiter.ts:178-182`

When Redis is not configured, rate limiting is completely disabled:

```typescript
if (!limiter) {
  return { success: true };  // Allows all requests
}
```

This is noted in comments but could be a security issue if Redis becomes unavailable in production.

**Current behavior:** Comment at line 48-54 warns about this:
```typescript
console.warn(
  '[Rate Limiter] Redis not configured. Rate limiting is DISABLED. ' +
    'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.'
);
```

**Recommendation:** Document this clearly and consider an environment-specific warning.

---

## 6. Security Observations (Positive)

### ✅ Good Security Practices Found:

1. **JWT Authentication** - All LLM proxies use proper JWT verification via Supabase (`auth-middleware.ts:99`)

2. **Server-Side Price Validation** - Both `buy-token-pack.ts:55-78` and `stripe-webhook.ts:635-668` validate prices server-side to prevent tampering

3. **Idempotency Keys** - Payment functions use idempotency keys to prevent duplicate charges:
   - `create-pro-subscription.ts:112`
   - `buy-token-pack.ts:104`

4. **User ID Verification** - Payment endpoints verify userId matches authenticated user:
   - `create-pro-subscription.ts:55-63`
   - `buy-token-pack.ts:45-53`

5. **CORS Origin Validation** - Proper origin validation in `cors.ts` with strict suffix matching to prevent subdomain spoofing (lines 34-47)

6. **Stripe Signature Verification** - Webhook properly verifies Stripe signatures (`stripe-webhook.ts:312-330`)

7. **Database-Backed Idempotency** - Webhook uses database for event idempotency check (`stripe-webhook.ts:107-127`)

8. **Token Balance Pre-Check** - LLM proxies check token balance before making API calls

9. **Request Size Limits** - All proxies validate request body size (1MB limit)

10. **Error Message Sanitization** - Payment functions sanitize error messages to avoid leaking internal details

---

## 7. Summary of Issues by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 0 | - |
| High | 6 | Missing server-side API keys in .env.example (1), Missing CORS headers in payment functions (3), Duplicate key definitions (1), OPTIONS handling missing (1) |
| Medium | 4 | Hardcoded CORS origins (1), Rate limiter Redis dependency (1), Incomplete provider list (1), OPTIONS handling (1) |
| Low | 2 | Error context in web search (1), Hardcoded production domain (1) |

---

## Recommendations Priority

1. **Immediate (High Priority):**
   - Add missing CORS headers to payment functions
   - Complete the server-side API key documentation in `.env.example`

2. **Short-term (Medium Priority):**
   - Add OPTIONS method handling to payment functions
   - Update provider list in integrations
   - Make CORS origins configurable

3. **Long-term (Low Priority):**
   - Add environment variable support for allowed origins
   - Consider graceful degradation for rate limiting

---

*End of Audit Report*
