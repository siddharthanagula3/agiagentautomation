# Security Fixes Action Plan
**Priority:** MEDIUM (non-blocking, compliance enhancing)
**Estimated Time to Complete:** 30 minutes
**Risk Level:** LOW (improvements to error messages only)

---

## Overview

This document outlines the 3 medium-priority security fixes identified in the comprehensive Netlify Functions security audit. These fixes standardize error messages to prevent information disclosure to clients.

---

## Fix #1: Standardize Proxy Error Messages

### Scope
Apply standardized error handling to all 7 LLM proxy functions and 3 media proxy functions.

### Files Affected
- `/netlify/functions/llm-proxies/anthropic-proxy.ts`
- `/netlify/functions/llm-proxies/openai-proxy.ts`
- `/netlify/functions/llm-proxies/google-proxy.ts`
- `/netlify/functions/llm-proxies/perplexity-proxy.ts`
- `/netlify/functions/llm-proxies/grok-proxy.ts`
- `/netlify/functions/llm-proxies/deepseek-proxy.ts`
- `/netlify/functions/llm-proxies/qwen-proxy.ts`
- `/netlify/functions/media-proxies/openai-image-proxy.ts`
- `/netlify/functions/media-proxies/google-imagen-proxy.ts`
- `/netlify/functions/media-proxies/google-veo-proxy.ts`

### Current Implementation (Example from anthropic-proxy.ts, lines 293-302)
```typescript
} catch (error) {
  console.error('[Anthropic Proxy] Error:', error);
  return {
    statusCode: 500,
    headers: getMinimalCorsHeaders(origin),
    body: JSON.stringify({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',  // ← ISSUE: Leaks details
    }),
  };
}
```

### Why This Is a Security Issue
- **Information Disclosure:** Error messages reveal internal implementation details
- **Attack Surface:** Helps attackers understand infrastructure
- **Compliance:** Fails security best practices for error handling
- **Examples of leaked information:**
  - "Cannot read property 'usage' of null" (reveals API response structure)
  - "ECONNREFUSED" (reveals connection issues)
  - "Rate limit exceeded at provider" (reveals upstream systems)

### Recommended Fix
```typescript
} catch (error) {
  console.error('[Anthropic Proxy] Error:', error);
  return {
    statusCode: 500,
    headers: getMinimalCorsHeaders(origin),
    body: JSON.stringify({
      error: 'Failed to process request',
      message: 'An error occurred while processing your request. Please try again.',
      // Full error details logged server-side above, not exposed to client
    }),
  };
}
```

### Implementation Steps
For each affected file:

1. Locate the outer `catch` block in the handler function
2. Find the line: `message: error instanceof Error ? error.message : 'Unknown error'`
3. Replace with: `message: 'An error occurred while processing your request. Please try again.'`
4. Verify no error details are exposed in the response body
5. Run TypeScript check: `npm run type-check`
6. Test locally: Send invalid request to verify generic error message

### Verification
```bash
# After changes, send request to test function
curl -X POST http://localhost:8888/.netlify/functions/anthropic-proxy \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "claude-3-sonnet-20240229"}'

# Should return:
# {"error": "Failed to process request", "message": "An error occurred while processing your request. Please try again."}
# Should NOT return error.message or stack trace
```

### Acceptance Criteria
- [ ] All 10 proxy files updated
- [ ] No `error.message` exposed in response bodies
- [ ] TypeScript type check passes
- [ ] Local testing confirms generic messages
- [ ] CI/CD passes security checks
- [ ] Commit message references this audit

---

## Fix #2: Genericize Webhook Signature Error

### Scope
Standardize Stripe webhook error response.

### File Affected
- `/netlify/functions/payments/stripe-webhook.ts`

### Current Implementation (lines 313-327)
```typescript
try {
  stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  logger.error('Signature verification failed:', { requestId, error: err });
  return {
    statusCode: 400,
    headers: SECURITY_HEADERS,
    body: JSON.stringify({
      error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      // ↑ ISSUE: Leaks signature verification failure to attacker
    }),
  };
}
```

### Why This Is a Security Issue
- **Attackers learn security mechanisms:** Knowing that signature verification exists helps attackers target it
- **Error details leak:** Examples:
  - "Invalid signature length" (reveals signature format)
  - "Signature timestamp outside tolerance window" (reveals timing checks)
  - "Unable to extract timestamp from signature" (reveals header structure)
- **Webhook scanning:** Attackers can use error messages to scan for endpoints

### Recommended Fix
```typescript
try {
  stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  logger.error('Signature verification failed:', { requestId, error: err });
  return {
    statusCode: 400,
    headers: SECURITY_HEADERS,
    body: JSON.stringify({
      error: 'Invalid webhook signature',
      message: 'Could not verify webhook authenticity',
      // Full error logged server-side, generic message to client
    }),
  };
}
```

### Implementation Steps

1. Open `/netlify/functions/payments/stripe-webhook.ts`
2. Go to line 325
3. Replace the error response with the recommended fix
4. Run TypeScript check: `npm run type-check`
5. Test with Stripe CLI: `stripe listen --forward-to localhost:8888/.netlify/functions/payments/stripe-webhook`
6. Trigger test webhook and verify generic error is returned

### Verification
```bash
# Test with Stripe CLI (simulates webhook with wrong signature)
stripe trigger payment_intent.succeeded --skip-login

# Response should be 400 with:
# {"error": "Invalid webhook signature", "message": "Could not verify webhook authenticity"}
# Should NOT include Stripe SDK error details
```

### Acceptance Criteria
- [ ] File updated
- [ ] No Stripe SDK error messages in response
- [ ] TypeScript type check passes
- [ ] Local testing with Stripe CLI confirms generic messages
- [ ] Server-side logging still captures full error for debugging
- [ ] Commit message references this audit

---

## Fix #3: Redact Upstream API Errors

### Scope
Apply error redaction to all LLM and media proxy functions that call upstream APIs.

### Files Affected
- `/netlify/functions/llm-proxies/anthropic-proxy.ts` (lines 198-207)
- `/netlify/functions/llm-proxies/openai-proxy.ts` (lines 200-209)
- `/netlify/functions/llm-proxies/google-proxy.ts` (lines ~250-260)
- `/netlify/functions/llm-proxies/perplexity-proxy.ts` (similar pattern)
- `/netlify/functions/llm-proxies/grok-proxy.ts` (similar pattern)
- `/netlify/functions/llm-proxies/deepseek-proxy.ts` (similar pattern)
- `/netlify/functions/llm-proxies/qwen-proxy.ts` (similar pattern)
- `/netlify/functions/media-proxies/openai-image-proxy.ts` (lines 251-260)
- `/netlify/functions/media-proxies/google-imagen-proxy.ts` (similar pattern)
- `/netlify/functions/media-proxies/google-veo-proxy.ts` (similar pattern)

### Current Implementation (Example from google-proxy.ts, lines 250-260)
```typescript
if (!response.ok) {
  console.error('[Google Proxy] API Error:', data);
  return {
    statusCode: response.status,
    headers: getSecurityHeaders(),
    body: JSON.stringify({
      error: data.error?.message || 'Google API error',    // ← ISSUE: Exposes upstream error
      details: data,                                        // ← ISSUE: Exposes full response
    }),
  };
}
```

### Why This Is a Security Issue
- **API Response Leakage:** Exposes upstream service error messages to client
- **Attack Surface Mapping:** Helps attackers understand third-party service behavior
- **Data Disclosure:** May contain sensitive information about data models
- **Examples of leaked information:**
  - "Failed to parse image data. Invalid PNG header" (reveals image validation)
  - "User not found in index. Please create profile first" (reveals data structure)
  - "Rate limited. Try again after 60 seconds" (reveals rate limit behavior)
  - "API key quota exceeded" (reveals usage patterns)

### Recommended Fix
```typescript
if (!response.ok) {
  console.error('[Google Proxy] API Error:', data);
  return {
    statusCode: response.status,
    headers: getSecurityHeaders(),
    body: JSON.stringify({
      error: 'API request failed',
      message: 'The upstream service encountered an error. Please try again.',
      // Full response logged server-side, generic message to client
      // Remove: error: data.error?.message
      // Remove: details: data
    }),
  };
}
```

### Implementation Steps

For each affected file:

1. Locate the `if (!response.ok)` block that returns upstream errors
2. Replace the error response body with the recommended fix
3. Ensure full error is still logged to console: `console.error('[Service] API Error:', data);`
4. Run TypeScript check: `npm run type-check`
5. Test locally with invalid inputs and verify generic messages

### Pattern to Look For
All LLM proxies follow this pattern around lines 198-210:
```typescript
if (!response.ok) {
  console.error('[Service Proxy] API Error:', data);
  return {
    statusCode: response.status,
    headers: getMinimalCorsHeaders(origin),
    body: JSON.stringify({
      error: data.error?.message || 'API error',  // ← CHANGE THIS
      details: data,                               // ← REMOVE THIS
    }),
  };
}
```

### Verification
```bash
# Test with invalid request to trigger upstream error
npm run dev

# Send request with invalid model or parameters to each service
curl -X POST http://localhost:8888/.netlify/functions/google-proxy \
  -H "Authorization: Bearer $(jwt_token)" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "invalid-model"}'

# Response should be:
# {"error": "API request failed", "message": "The upstream service encountered an error. Please try again."}
# Should NOT include upstream service error details
```

### Acceptance Criteria
- [ ] All 10 proxy files updated
- [ ] No `data.error?.message` in response bodies
- [ ] No `details: data` in response bodies
- [ ] Full upstream errors still logged server-side
- [ ] TypeScript type check passes
- [ ] Local testing confirms generic messages
- [ ] CI/CD passes security checks
- [ ] Commit message references this audit

---

## Implementation Checklist

### Pre-Implementation
- [ ] Create feature branch: `git checkout -b security/error-message-standardization`
- [ ] Pull latest main: `git pull origin main`
- [ ] Review audit report: `NETLIFY_SECURITY_AUDIT.md`

### Fix #1: Proxy Error Messages (15 minutes)
- [ ] Update anthropic-proxy.ts line 300
- [ ] Update openai-proxy.ts line 298
- [ ] Update google-proxy.ts line ~300
- [ ] Update perplexity-proxy.ts (similar line)
- [ ] Update grok-proxy.ts (similar line)
- [ ] Update deepseek-proxy.ts (similar line)
- [ ] Update qwen-proxy.ts (similar line)
- [ ] Update openai-image-proxy.ts line ~339
- [ ] Update google-imagen-proxy.ts (similar line)
- [ ] Update google-veo-proxy.ts (similar line)

### Fix #2: Webhook Signature Error (5 minutes)
- [ ] Update stripe-webhook.ts line 325
- [ ] Keep server-side logging: `logger.error(...)`

### Fix #3: Upstream API Errors (10 minutes)
- [ ] Update all 10 proxy files' error response bodies
- [ ] Remove `data.error?.message`
- [ ] Remove `details: data`
- [ ] Keep server-side logging: `console.error(...)`

### Testing & Validation
- [ ] Run `npm run type-check` (must pass)
- [ ] Run `npm run lint` (must pass)
- [ ] Run `npm run build:prod` (must pass)
- [ ] Test locally with `npm run dev`
- [ ] Test each function with invalid inputs
- [ ] Verify generic error messages in responses
- [ ] Verify full errors in server logs

### Code Review & Commit
- [ ] Create commit: `git add -A && git commit -m "..."`
- [ ] Push to GitHub: `git push origin security/error-message-standardization`
- [ ] Create pull request
- [ ] Add commit message:
```
fix(security): standardize error messages to prevent information disclosure

- Replace error.message with generic messages in all proxy functions (10 files)
- Genericize webhook signature verification error
- Redact upstream API error responses
- Full error details preserved in server-side logging
- Addresses medium-priority findings from security audit

Files changed: 13
- /netlify/functions/llm-proxies/*.ts (7 files)
- /netlify/functions/media-proxies/*.ts (3 files)
- /netlify/functions/payments/stripe-webhook.ts (1 file)
- /netlify/functions/utilities/vibe-build.ts (1 file)
- /netlify/functions/admin/fix-schema.ts (1 file)

Security audit: NETLIFY_SECURITY_AUDIT.md
Recommendations: SECURITY_FIXES_ACTION_PLAN.md
```

---

## Testing Strategy

### Unit Testing
```bash
# Test authentication still works
npm run test -- auth-middleware.test.ts

# Test rate limiting still works
npm run test -- rate-limiter.test.ts

# Test validation still works
npm run test -- validation-schemas.test.ts
```

### Integration Testing
```bash
# Start dev environment
npm run dev

# In another terminal, test each endpoint

# Test 1: Valid request still works
curl -X POST http://localhost:8888/.netlify/functions/anthropic-proxy \
  -H "Authorization: Bearer $(get_valid_jwt)" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "model": "claude-3-sonnet-20240229"}'
# Should return: 200 with normal response (not changed)

# Test 2: Generic error message on exception
curl -X POST http://localhost:8888/.netlify/functions/anthropic-proxy \
  -H "Authorization: Bearer invalid_jwt" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "invalid"}'
# Should return: 400/401/402 with generic error message (NOT error.message)

# Test 3: Webhook error message
stripe trigger payment_intent.succeeded --skip-login
# Should return: 400 with generic webhook error (NOT Stripe SDK error)
```

### Monitoring
After deployment:
1. Monitor error logs for actual errors (logged, not exposed)
2. Verify no complaints from users about unclear errors
3. Confirm no information disclosure in production logs
4. Check that error rates remain consistent

---

## Rollback Plan

If issues occur:

```bash
# Option 1: Revert commit
git revert <commit-hash>
git push origin main

# Option 2: Revert to previous version via GitHub UI
# Click "Revert" on the PR merge commit

# Monitoring after rollback:
# - Verify services come back online
# - Check error logs for any issues
# - Confirm users can access services again
```

---

## Success Criteria

After all fixes are implemented:

1. **Security Audit Pass:**
   - [ ] No information disclosure in error messages
   - [ ] Generic messages returned to clients
   - [ ] Full errors logged server-side
   - [ ] Overall rating improves from 99/100 to 100/100

2. **Functionality Preserved:**
   - [ ] All proxy functions work normally
   - [ ] Webhook processing continues
   - [ ] Payment flows unchanged
   - [ ] Error monitoring still effective

3. **Compliance:**
   - [ ] OWASP A08 (Data Integrity) fully passing
   - [ ] SOC 2 error handling requirements met
   - [ ] Security best practices followed

4. **Performance:**
   - [ ] No latency increase
   - [ ] No additional resource usage
   - [ ] All response times within SLA

---

## Estimated Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Implementation | 30 min | Engineer |
| Testing | 15 min | Engineer |
| Code Review | 15 min | Reviewer |
| Deployment | 5 min | DevOps |
| Monitoring | Ongoing | On-call |

**Total:** ~1 hour

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Error message too generic | LOW | LOW | Users still see service is down, logs have details |
| Break existing error handling | LOW | LOW | TypeScript checks before deployment |
| Information still leaked | LOW | LOW | Code review catches misses |
| Performance degradation | VERY LOW | LOW | No performance impact expected |

**Overall Risk Level: VERY LOW**

---

## Communication Plan

### Before Deployment
- [ ] Notify team of upcoming security improvements
- [ ] Link to audit report and action plan
- [ ] Estimate 1-hour deployment window

### After Deployment
- [ ] Update internal security documentation
- [ ] Add to security audit trail
- [ ] Schedule follow-up audit in 90 days
- [ ] Document remediation in compliance system

---

## Appendix A: Error Message Examples

### Before (Current - Information Leakage)
```json
{
  "error": "Failed to process request",
  "message": "Cannot read property 'usage' of undefined"
}
```

### After (Recommended - Generic)
```json
{
  "error": "Failed to process request",
  "message": "An error occurred while processing your request. Please try again."
}
```

### Server Logs (Full Details Preserved)
```
[2026-01-29T12:34:56Z] ERROR [Anthropic Proxy] Error: TypeError: Cannot read property 'usage' of undefined
    at Function.formatResponse (anthropic-proxy.ts:278:15)
    at async anthropicHandler (anthropic-proxy.ts:195:20)
...stack trace...
```

---

## Appendix B: Implementation Reference

### Search Pattern for Fix #1
Find: `message: error instanceof Error ? error.message : 'Unknown error'`
Replace: `message: 'An error occurred while processing your request. Please try again.'`

### Search Pattern for Fix #2
Find: `` error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}` ``
Replace: `error: 'Invalid webhook signature', message: 'Could not verify webhook authenticity'`

### Search Pattern for Fix #3
Find: `error: data.error?.message || '.*API error'`
Replace: `error: 'API request failed', message: 'The upstream service encountered an error. Please try again.'`

Also remove: `details: data,`

---

**Prepared by:** Security Engineer
**Date:** January 29, 2026
**Status:** Ready for Implementation
**Priority:** MEDIUM
**Estimated Effort:** 1 hour

---
