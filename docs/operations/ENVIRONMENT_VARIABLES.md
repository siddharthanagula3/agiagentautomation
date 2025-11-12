# Environment Variables Configuration Guide

## Production Environment Variables

All environment variables should be configured in **Netlify Dashboard** → **Site Settings** → **Environment Variables**.

### Required Variables

#### Supabase (Required)
- `VITE_SUPABASE_URL` - Production Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

#### Stripe (Required)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (e.g., `pk_live_...`)
- `STRIPE_SECRET_KEY` - Stripe secret key (e.g., `sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (e.g., `whsec_...`)

#### LLM Provider (At least one required)
- `VITE_OPENAI_API_KEY` - OpenAI API key (optional)
- `VITE_ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `VITE_GOOGLE_API_KEY` - Google API key (optional)
- `VITE_PERPLEXITY_API_KEY` - Perplexity API key (optional)

### Optional Variables

- `NODE_ENV` - Set to `production` for production builds
- `VITE_DEMO_MODE` - Set to `false` for production

## Getting Your Keys

### Supabase Keys:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **AGI Automation LLC**
3. Settings → API
4. Copy Project URL, anon key, and service_role key

### Stripe Keys:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API keys
3. Copy Publishable key and Secret key
4. Webhooks → Your endpoint → Copy Signing secret

### LLM Provider Keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google**: https://console.cloud.google.com/apis/credentials
- **Perplexity**: https://www.perplexity.ai/settings/api

## Security Notes

- **Never commit** `.env` files to version control
- **Service role keys** should only be used in server-side Netlify Functions
- **Client-side keys** (VITE_*) are safe to expose in the browser
- **Server-side keys** (without VITE_ prefix) must be kept secret

## Verification

After setting environment variables:
1. Deploy to Netlify
2. Check build logs for any missing variable warnings
3. Test application functionality
4. Monitor Netlify function logs for errors

