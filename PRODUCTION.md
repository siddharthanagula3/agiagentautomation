# Production Deployment Guide

## 🚀 Production Environment

This document outlines the production deployment configuration and requirements for AGI Agent Automation.

---

## 📋 Environment Variables

### Required Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
VITE_OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Google
VITE_GOOGLE_API_KEY=your-google-api-key

# Perplexity
VITE_PERPLEXITY_API_KEY=pplx-your-perplexity-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Application
VITE_APP_URL=https://agiagentautomation.com
URL=https://agiagentautomation.com
NODE_ENV=production

# Sentry (Optional - Error Tracking)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 🔧 Netlify Configuration

### Build Settings

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### Environment Variables in Netlify

Set all environment variables in Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add all variables from `.env.production`
3. Ensure `NODE_ENV=production` is set

---

## 🗄️ Database Setup (Supabase)

### Run Migrations

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Required Tables

- `users` - User accounts and plans
- `purchased_employees` - AI employee purchases
- `agent_sessions` - Chat sessions
- `agent_messages` - Chat messages
- `token_usage` - Token tracking and billing
- `workflows` - Automation workflows

### RLS Policies

All tables have Row Level Security (RLS) enabled. Ensure policies are properly configured for:
- User isolation
- Admin access
- Public read access (where needed)

---

## 💳 Stripe Configuration

### Products & Prices

Create the following products in Stripe:

1. **Pro Plan**
   - Monthly: $20/month
   - Yearly: $200/year
   - Features: 10M tokens (2.5M per LLM)

2. **AI Employees**
   - Normal: $10/month ($120/year)
   - Premium: $20/month ($240/year)

### Coupons

Create the "BETATESTER" coupon:
```bash
stripe coupons create \
  --id=BETATESTER \
  --name="Betatester - 1 Month Free" \
  --percent-off=100 \
  --duration=once
```

### Webhooks

Create a webhook endpoint:
```bash
stripe webhook_endpoints create \
  --url https://agiagentautomation.netlify.app/.netlify/functions/stripe-webhook \
  --enabled-events checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.updated,customer.subscription.deleted
```

Save the webhook secret to `STRIPE_WEBHOOK_SECRET` in Netlify.

---

## 🔐 Security Checklist

- [x] All API keys stored in environment variables
- [x] RLS enabled on all Supabase tables
- [x] CORS properly configured
- [x] HTTPS enforced
- [x] Content Security Policy headers set
- [x] XSS protection enabled
- [x] SQL injection protection via parameterized queries
- [x] Rate limiting on API endpoints
- [x] Authentication required for sensitive routes
- [x] Stripe webhook signature verification
- [x] Input validation on all forms

---

## 🏗️ Build Process

### Production Build

```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build:prod

# Preview production build
npm run preview
```

### Build Optimization

- **Tree Shaking**: Unused code is automatically removed
- **Code Splitting**: Separate chunks for React, Router, UI components
- **Minification**: Terser minifies all JavaScript
- **Console Removal**: console.log/debug/info removed in production
- **Asset Optimization**: Images and assets optimized
- **Gzip Compression**: Enabled via Netlify

---

## 📊 Monitoring & Analytics

### Sentry (Error Tracking)

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.1,
  });
}
```

### Performance Monitoring

- Lighthouse scores monitored
- Core Web Vitals tracked
- API response times logged
- Error rates monitored via Sentry

---

## 🚦 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No linting errors
- [ ] Type checking clean
- [ ] Environment variables configured in Netlify
- [ ] Database migrations applied
- [ ] Stripe products created
- [ ] Stripe webhook configured
- [ ] DNS configured correctly
- [ ] SSL certificate active

### Post-Deployment

- [ ] Test user registration
- [ ] Test user login
- [ ] Test AI employee purchase
- [ ] Test chat functionality
- [ ] Test Pro plan upgrade
- [ ] Test webhook events (Stripe)
- [ ] Verify token tracking
- [ ] Check error logs
- [ ] Monitor performance

---

## 🔄 CI/CD Pipeline

### Automatic Deployment

Netlify automatically deploys when code is pushed to `main` branch:

```bash
git push origin main
```

### Preview Deployments

Pull requests automatically create preview deployments for testing.

---

## 📈 Scaling Considerations

### Database

- Supabase auto-scales
- Connection pooling enabled
- Indexes on frequently queried columns
- Materialized views for analytics

### Functions

- Netlify functions auto-scale
- Cold start optimization via minimal dependencies
- Caching implemented where appropriate

### Frontend

- CDN distribution via Netlify
- Asset caching (1 year for static assets)
- Service worker for offline support (future)

---

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
- Check Node version (should be 20)
- Verify all dependencies installed
- Check for TypeScript errors

**Stripe Webhook Issues**
- Verify webhook secret is correct
- Check endpoint URL
- Ensure signature verification is working

**Database Connection Issues**
- Verify Supabase URL and keys
- Check RLS policies
- Ensure migrations are applied

**Authentication Issues**
- Clear localStorage and cookies
- Verify Supabase auth configuration
- Check redirect URLs

---

## 📞 Support

For production issues:
- Check Netlify build logs
- Review Supabase logs
- Check Sentry for errors
- Contact support: support@agiagentautomation.com

---

## 🔖 Version

**Current Version**: 1.0.0  
**Last Updated**: January 2025  
**Environment**: Production  
**Deployment Platform**: Netlify + Supabase

