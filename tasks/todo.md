# AGI Workforce — Deployment TODO

## Critical (Blocking Deployment)

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (Supabase Dashboard → Settings → API)
- [ ] Connect repo to Vercel project
- [ ] Add all env vars from `.env.example` to Vercel dashboard
- [ ] Add custom domain `agiworkforce.com` in Vercel
- [ ] Update Supabase Auth allowed redirect URLs → add `https://agiworkforce.com`
- [ ] Update Stripe webhook URL → `https://agiworkforce.com/api/payments/stripe-webhook`

## Important (Post-Deploy)

- [ ] Verify desktop auto-updater responds at `https://agiworkforce.com/api/releases/`
- [ ] Apply database migrations to production Supabase (`supabase db push`)
- [ ] Configure Sentry DSN for production error tracking
- [ ] Set up Upstash Redis production instance for rate limiting
- [ ] Add optional LLM API keys (Perplexity, Grok, DeepSeek, Qwen) to Vercel env vars

## Nice to Have

- [ ] Set up Vercel preview deployments for PRs
- [ ] Configure custom error pages (404, 500)
- [ ] Set up monitoring/alerting for API proxy failures
- [ ] Consider build-time sync for supported-models config (netlify/functions/utils/ ↔ src/shared/config/)
