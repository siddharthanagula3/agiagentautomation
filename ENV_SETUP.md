# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# AI PROVIDER KEYS
# ============================================

# OpenAI (Required for ChatGPT models)
VITE_OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic (Required for Claude models)
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Google AI (Required for Gemini models)
VITE_GOOGLE_API_KEY=your-google-api-key

# Perplexity (Required for Perplexity models)
VITE_PERPLEXITY_API_KEY=pplx-your-perplexity-api-key

# ============================================
# STRIPE PAYMENT CONFIGURATION
# ============================================
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# ============================================
# APPLICATION CONFIGURATION
# ============================================
VITE_APP_URL=http://localhost:5173
URL=http://localhost:8888
NODE_ENV=development

# ============================================
# OPTIONAL: ERROR TRACKING
# ============================================
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ============================================
# OPTIONAL: DEVELOPMENT FLAGS
# ============================================
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

---

## Getting Your API Keys

### Supabase

1. Go to https://supabase.com
2. Create a new project or select existing
3. Go to **Settings** → **API**
4. Copy:
   - `URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key → `VITE_OPENAI_API_KEY` and `OPENAI_API_KEY`

### Anthropic

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key → `VITE_ANTHROPIC_API_KEY`

### Google AI

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key → `VITE_GOOGLE_API_KEY`

### Perplexity

1. Go to https://www.perplexity.ai/settings/api
2. Create a new API key
3. Copy the key → `VITE_PERPLEXITY_API_KEY`

### Stripe

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - `Secret key` → `STRIPE_SECRET_KEY`
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`
3. For webhooks:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `http://localhost:8888/.netlify/functions/stripe-webhook`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Environment-Specific Configuration

### Development (.env.local)

```bash
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
URL=http://localhost:8888
VITE_ENABLE_DEBUG=true
```

### Production (.env.production)

```bash
NODE_ENV=production
VITE_APP_URL=https://agiagentautomation.com
URL=https://agiagentautomation.com
VITE_ENABLE_DEBUG=false

# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Security Notes

⚠️ **Never commit `.env` files to git**

- `.env` files are automatically ignored via `.gitignore`
- Never share your API keys publicly
- Rotate keys if accidentally exposed
- Use test keys for development
- Use live keys only in production

---

## Netlify Deployment

When deploying to Netlify, set environment variables in:

**Netlify Dashboard** → **Site settings** → **Environment variables**

Add all variables from your `.env.production` file.

---

## Verification

To verify your environment setup:

```bash
# Start development server
npm run dev

# Check console for any missing env variable warnings
# All services should connect successfully
```

---

## Troubleshooting

### Missing Environment Variables

If you see errors about missing variables:

1. Check `.env` file exists in root directory
2. Verify variable names match exactly (case-sensitive)
3. Restart development server after adding variables
4. Check for typos in variable names

### Supabase Connection Issues

- Verify URL format: `https://[project-ref].supabase.co`
- Check anon key is correct (starts with `eyJ`)
- Ensure RLS policies are configured

### Stripe Webhook Issues

- Use `stripe listen` for local development
- Verify webhook URL is accessible
- Check webhook secret matches

---

## Need Help?

Contact support at: support@agiagentautomation.com

