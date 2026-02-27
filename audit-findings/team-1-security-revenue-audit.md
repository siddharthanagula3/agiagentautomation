# Security & Revenue Critical Audit Findings

**Audit Date:** February 16, 2026
**Auditor:** Team 1 - Security & Revenue Critical Audit
**Scope:** Rate Limiting, Token Deduction, 2FA Enforcement, API Abuse Prevention, JWT Validation, Account Lockout

---

## 1. Token Deduction Non-Fatal (CRITICAL - Revenue Leakage)

### Severity: CRITICAL

### Description:
All LLM and media proxy functions return HTTP 200 OK to clients even when token deduction fails. This allows users to receive AI responses without their tokens being deducted, resulting in direct revenue loss.

### Affected Files:

#### LLM Proxies:
- `netlify/functions/llm-proxies/openai-proxy.ts:246-254`
- `netlify/functions/llm-proxies/anthropic-proxy.ts:241-250`
- `netlify/functions/llm-proxies/google-proxy.ts:295-303`
- `netlify/functions/llm-proxies/perplexity-proxy.ts:237-245`
- `netlify/functions/llm-proxies/grok-proxy.ts` (same pattern)
- `netlify/functions/llm-proxies/deepseek-proxy.ts` (same pattern)
- `netlify/functions/llm-proxies/qwen-proxy.ts` (same pattern)

#### Media Proxies:
- `netlify/functions/media-proxies/openai-image-proxy.ts:293-300`
- `netlify/functions/media-proxies/google-imagen-proxy.ts:306-315`
- `netlify/functions/media-proxies/google-veo-proxy.ts:458-465`

### Evidence:

```typescript
// openai-proxy.ts:246-254
if (deductError) {
  console.error('[OpenAI Proxy] Token deduction failed:', deductError);
  data.tokenTracking.deductionFailed = true;
  data.tokenTracking.deductionError = deductError.message;
} else {
  console.log('[OpenAI Proxy] Token deduction successful. New balance:', newBalance);
  data.tokenTracking.newBalance = newBalance;
  data.tokenTracking.deducted = true;
}

// Function returns 200 OK regardless of deduction success
return {
  statusCode: 200,  // <-- Returns success even when deduction fails!
  headers: { ... },
  body: JSON.stringify(normalized),
};
```

### Impact:
- **Revenue Leakage**: Users receive AI services without payment
- **Silent Failure**: Errors are only logged, not surfaced to the user
- **No Retry Logic**: Failed deductions are not retried

### Recommendation:
Return 500 Internal Server Error when token deduction fails, or implement a background job to reconcile failed deductions.

---

## 2. Rate Limiting Serverless Issues (HIGH)

### Severity: HIGH

### Description:
The Netlify Functions rate limiter (`netlify/functions/utils/rate-limiter.ts`) has an in-memory fallback that doesn't work in serverless environments. When Redis is unavailable or not configured, rate limiting is completely bypassed.

### Affected Files:
- `netlify/functions/utils/rate-limiter.ts:179-182`

### Evidence:

```typescript
// netlify/functions/utils/rate-limiter.ts:179-182
// If rate limiter is not configured, allow all requests (local dev)
if (!limiter) {
  return { success: true };  // <-- BYPASSES ALL RATE LIMITING
}
```

The warning message at lines 48-54 correctly identifies this as a security issue, but the code still allows all requests through:

```typescript
// netlify/functions/utils/rate-limiter.ts:48-54
console.warn(
  '[Rate Limiter] Redis not configured. Rate limiting is DISABLED. ' +
    'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production. ' +
    'WARNING: In-memory rate limiting does not work in serverless environments ' +
    'as each function invocation is stateless. Use Redis for production.'
);
```

### Impact:
- **No Rate Limiting in Production**: When Redis fails or isn't configured, attackers can make unlimited requests
- **Serverless Statelessness**: In-memory Map doesn't persist across function invocations

### Recommendation:
Fail closed (deny requests) when rate limiter is unavailable, or ensure Redis is always configured.

---

## 3. 2FA Enforcement Gaps (HIGH)

### Severity: HIGH

### Description:
The database schema for 2FA exists (`two_factor_enabled`, `totp_secret`, `backup_codes` columns in `user_settings` table via migration `20260129000001_add_totp_2fa_support.sql`), but 2FA is NOT enforced during login. Users can login without providing a TOTP code even if 2FA is enabled.

### Affected Files:
- `src/features/auth/components/LoginForm.tsx` - No 2FA verification step
- `src/core/auth/` - No 2FA verification in login flow

### Evidence:

The LoginForm (`src/features/auth/components/LoginForm.tsx:25-43`) only calls basic login:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    const result = await login({
      email: formData.email,
      password: formData.password,
    });
    if (result.success) {
      navigate(from, { replace: true });  // <-- No 2FA check!
    } else {
      setError(result.error || 'Login failed');
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  }
};
```

The 2FA columns exist in the database schema but are never checked:
- `user_settings.two_factor_enabled` (boolean)
- `user_settings.totp_secret` (text)
- `user_settings.totp_enabled_at` (timestamp)

### Impact:
- **2FA Bypass**: Users with 2FA enabled can still login without 2FA
- **Compliance Risk**: Failed security compliance audits
- **Credential Theft**: Even with 2FA enabled, account compromise is possible with just password

### Recommendation:
Implement a two-step login flow:
1. First step: Verify email/password
2. Second step: If `two_factor_enabled=true`, prompt for TOTP code

---

## 4. API Abuse Prevention In-Memory Tracking (MEDIUM)

### Severity: MEDIUM

### Description:
`src/core/security/api-abuse-prevention.ts` uses in-memory Map (`userMetrics`) for tracking API usage, which doesn't work in serverless environments where each invocation has a fresh memory state.

### Affected Files:
- `src/core/security/api-abuse-prevention.ts:84-90`

### Evidence:

```typescript
// src/core/security/api-abuse-prevention.ts:84-90
/**
 * In-memory tracking (replace with Redis in production)
 */
const userMetrics = new Map<
  string,
  {
    requests: Array<{ timestamp: number; cost: number; model: string }>;
    concurrentRequests: number;
  }
>();
```

The code itself contains a comment acknowledging this limitation: "In-memory tracking (replace with Redis in production)"

### Impact:
- **No Abuse Prevention**: Usage tracking doesn't persist across requests
- **Bypass Attack**: Attackers can make unlimited requests since tracking resets each invocation
- **Concurrent Request Limits Ineffective**: `concurrentRequests` counter resets on each call

### Recommendation:
Replace in-memory tracking with Redis for production serverless deployments.

---

## 5. Account Lockout Service In-Memory Fallback (MEDIUM)

### Severity: MEDIUM

### Description:
`src/core/auth/account-lockout-service.ts` uses in-memory fallback when the database is unavailable. This doesn't work in serverless environments where each function invocation has isolated memory.

### Affected Files:
- `src/core/auth/account-lockout-service.ts:93-98` (In-memory store definition)
- `src/core/auth/account-lockout-service.ts:108` (Map initialization)

### Evidence:

```typescript
// src/core/auth/account-lockout-service.ts:93-98
/**
 * In-memory lockout tracking (fallback when DB unavailable)
 */
interface InMemoryLockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastFailedAt: number;
}
```

```typescript
// src/core/auth/account-lockout-service.ts:108
private inMemoryStore: Map<string, InMemoryLockoutEntry> = new Map();
```

### Impact:
- **Account Lockout Bypass**: Failed login attempts aren't tracked across invocations
- **Brute Force Vulnerable**: Attackers can retry passwords unlimited times
- **No Persistent Lockout**: Locked accounts can still attempt login

### Recommendation:
Ensure database is always available, or use Redis for distributed lockout tracking.

---

## 6. JWT Validation (PASS)

### Severity: N/A

### Description:
The JWT validation in `netlify/functions/utils/auth-middleware.ts` properly verifies tokens using Supabase's `getUser()` method.

### Evidence:

```typescript
// netlify/functions/utils/auth-middleware.ts:99
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  console.warn('[Auth Middleware] Invalid token:', error?.message);
  return {
    statusCode: 401,
    // ...
  };
}
```

The rate limiter also properly verifies JWTs (lines 113-129).

### Status: SECURE

---

## Summary

| Issue | Severity | Revenue Impact |
|-------|----------|----------------|
| Token Deduction Non-Fatal | CRITICAL | Direct Revenue Loss |
| Rate Limiting Serverless Bypass | HIGH | DoS Vulnerability |
| 2FA Not Enforced | HIGH | Security Compliance |
| API Abuse In-Memory | MEDIUM | Abuse Vulnerability |
| Account Lockout In-Memory | MEDIUM | Brute Force Risk |
| JWT Validation | PASS | N/A |

---

## Recommendations Priority

1. **IMMEDIATE**: Fix token deduction to fail closed (return 500 on failure)
2. **IMMEDIATE**: Implement 2FA verification in login flow
3. **HIGH**: Make rate limiter fail closed when Redis unavailable
4. **MEDIUM**: Replace in-memory tracking with Redis in serverless environment
5. **MEDIUM**: Ensure account lockout uses database consistently
