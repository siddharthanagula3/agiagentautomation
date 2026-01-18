# Environment Variables Configuration Guide

## Production Environment Variables

All environment variables should be configured in **Netlify Dashboard** → **Site Settings** → **Environment Variables**.

## Required Variables

### Supabase (Required)

| Variable                    | Description                                  | Example                     |
| --------------------------- | -------------------------------------------- | --------------------------- |
| `VITE_SUPABASE_URL`         | Production Supabase project URL              | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`    | Supabase anonymous/public key                | `eyJhbGciOiJIUzI1NiIs...`   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | `eyJhbGciOiJIUzI1NiIs...`   |

### Stripe (Required for Billing)

| Variable                      | Description                     | Example       |
| ----------------------------- | ------------------------------- | ------------- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key          | `pk_live_...` |
| `STRIPE_SECRET_KEY`           | Stripe secret key (server-side) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET`       | Stripe webhook signing secret   | `whsec_...`   |

## LLM Provider API Keys

Configure at least one LLM provider. All keys should be server-side only (no `VITE_` prefix).

### Primary Providers

| Variable             | Provider   | Get Key At                                  |
| -------------------- | ---------- | ------------------------------------------- |
| `OPENAI_API_KEY`     | OpenAI     | https://platform.openai.com/api-keys        |
| `ANTHROPIC_API_KEY`  | Anthropic  | https://console.anthropic.com/settings/keys |
| `GOOGLE_API_KEY`     | Google     | https://aistudio.google.com/app/apikey      |
| `PERPLEXITY_API_KEY` | Perplexity | https://www.perplexity.ai/settings/api      |

### Additional Providers

| Variable           | Provider | Get Key At                                  |
| ------------------ | -------- | ------------------------------------------- |
| `GROK_API_KEY`     | xAI Grok | https://console.x.ai/                       |
| `DEEPSEEK_API_KEY` | DeepSeek | https://platform.deepseek.com/api_keys      |
| `QWEN_API_KEY`     | Alibaba  | https://dashscope.console.aliyun.com/apiKey |

### Client-Side Keys (Optional)

These are exposed to the browser and should only be used for client-side features:

| Variable                  | Description                       |
| ------------------------- | --------------------------------- |
| `VITE_OPENAI_API_KEY`     | OpenAI (direct browser calls)     |
| `VITE_ANTHROPIC_API_KEY`  | Anthropic (direct browser calls)  |
| `VITE_GOOGLE_API_KEY`     | Google (direct browser calls)     |
| `VITE_PERPLEXITY_API_KEY` | Perplexity (direct browser calls) |

**Note:** Prefer using server-side proxies via Netlify Functions for security.

## Rate Limiting (Upstash Redis)

Required for API rate limiting protection.

| Variable                   | Description              | Get At                       |
| -------------------------- | ------------------------ | ---------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL   | https://console.upstash.com/ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | https://console.upstash.com/ |

## Optional Variables

| Variable         | Description                         | Default      |
| ---------------- | ----------------------------------- | ------------ |
| `NODE_ENV`       | Environment mode                    | `production` |
| `VITE_DEMO_MODE` | Enable demo login (requires `true`) | `false`      |
| `VITE_GOOGLE_CX` | Google Custom Search Engine ID      | -            |

## Security Notes

### Server-Side vs Client-Side Keys

- **Server-side keys** (without `VITE_` prefix): Only accessible in Netlify Functions, never exposed to browser
- **Client-side keys** (`VITE_` prefix): Bundled into JavaScript, visible in browser DevTools

### Best Practices

1. **Never commit** `.env` files to version control
2. **Service role keys** should only be used in server-side Netlify Functions
3. **API keys** should be proxied through Netlify Functions, not called directly from browser
4. **Webhook secrets** must be kept secret and verified on every webhook call

## Netlify Functions Security

All proxy functions (`anthropic-proxy.ts`, `openai-proxy.ts`, etc.) implement:

- **JWT Authentication**: Requests must include valid Supabase JWT
- **CORS Validation**: Origin whitelist (no wildcard `*`)
- **Rate Limiting**: Upstash Redis with verified user identity
- **Request Size Limit**: 1MB maximum payload
- **Token Enforcement**: Pre-flight balance check before API calls

## Getting Your Keys

### Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy Project URL, anon key, and service_role key

### Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API keys
3. Copy Publishable key and Secret key
4. Webhooks → Your endpoint → Copy Signing secret

### Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy REST URL and REST Token from the database details

## Verification

After setting environment variables:

1. Deploy to Netlify
2. Check build logs for any missing variable warnings
3. Test application functionality:
   - Authentication flow
   - LLM chat responses
   - Payment processing (Stripe)
   - Rate limiting behavior
4. Monitor Netlify function logs for errors

## Troubleshooting

| Issue                        | Solution                                           |
| ---------------------------- | -------------------------------------------------- |
| "API key not configured"     | Check server-side key is set in Netlify            |
| "CORS error"                 | Verify origin is in whitelist (`utils/cors.ts`)    |
| "Rate limit exceeded"        | Check Upstash credentials and rate limit config    |
| "Authentication required"    | Verify JWT is being sent with requests             |
| "Insufficient token balance" | User needs to purchase more tokens or upgrade plan |

## Changelog

**v1.1.0 (Jan 2026)**

- Added DeepSeek and Qwen API key configuration
- Added Grok API key configuration
- Added Upstash Redis configuration for rate limiting
- Added security notes section
- Added troubleshooting section

**v1.0.0 (Jan 2026)**

- Initial environment variables guide
