# Deployment Guide

## Overview

The AGI Agent Automation Platform is deployed on Netlify with Supabase as the backend. This guide covers both development and production deployment processes.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify CDN   │    │  Netlify        │    │   Supabase      │
│   (Frontend)    │◄──►│  Functions      │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Accounts

- Netlify account
- Supabase account
- Stripe account (for payments)
- LLM provider accounts (OpenAI, Anthropic, Google, Perplexity)

### Required Tools

- Node.js 18+
- Git
- Netlify CLI
- Supabase CLI

## Environment Setup

### 1. Supabase Setup

**Create Supabase Project:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project
supabase projects create my-agi-platform
```

**Apply Database Migrations:**

```bash
# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

**Set up RLS Policies:**

```bash
# Apply RLS policies
supabase db push
```

### 2. Netlify Setup

**Install Netlify CLI:**

```bash
npm install -g netlify-cli
```

**Login to Netlify:**

```bash
netlify login
```

## Environment Variables

### Required Variables

**Frontend (.env.production):**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# LLM Providers (optional - can be proxied)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=...
VITE_PERPLEXITY_API_KEY=...
```

**Netlify Functions (.env):**

```bash
# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...
```

## Deployment Process

### 1. Development Deployment

**Local Development:**

```bash
# Start Supabase locally
supabase start

# Start development server
npm run dev

# Start Netlify Functions locally
netlify dev
```

**Preview Deployment:**

```bash
# Build the project
npm run build

# Deploy to Netlify preview
netlify deploy --dir=dist
```

### 2. Production Deployment

**Automatic Deployment (Recommended):**

1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

**Manual Deployment:**

```bash
# Build for production
npm run build:prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Configuration Files

### Netlify Configuration

**netlify.toml:**

```toml
[build]
  command = "npm ci && npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Build Configuration

**vite.config.ts:**

```typescript
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog'],
          supabase: ['@supabase/supabase-js'],
          ai: ['@anthropic-ai/sdk'],
        },
      },
    },
  },
});
```

## Database Deployment

### Migration Strategy

**Development:**

```bash
# Create new migration
supabase migration new add_new_feature

# Apply locally
supabase db reset
```

**Production:**

```bash
# Apply migrations to production
supabase db push
```

### RLS Policy Deployment

**Verify RLS Policies:**

```bash
# Check RLS status
supabase db diff

# Apply RLS policies
supabase db push
```

## Function Deployment

### Netlify Functions

**Structure:**

```
netlify/functions/
├── anthropic-proxy.ts
├── openai-proxy.ts
├── google-proxy.ts
├── stripe-webhook.ts
└── create-pro-subscription.ts
```

**Function Configuration:**

```typescript
// netlify/functions/example.ts
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
};
```

## Monitoring and Observability

### Application Monitoring

**Netlify Analytics:**

- Page views and performance
- Function execution metrics
- Error rates and logs

**Supabase Monitoring:**

- Database performance
- API usage and limits
- Real-time connection metrics

### Error Tracking

**Sentry Integration:**

```typescript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

## Security Considerations

### API Security

**Rate Limiting:**

- Implement rate limiting on API endpoints
- Use Supabase RLS for data access control
- Validate all inputs

**Authentication:**

- Use JWT tokens for authentication
- Implement proper session management
- Use secure cookie settings

### Data Protection

**Encryption:**

- All data encrypted in transit (HTTPS)
- Sensitive data encrypted at rest
- API keys stored securely

**Privacy:**

- Implement GDPR compliance
- User data deletion capabilities
- Audit logging for sensitive operations

## Performance Optimization

### Frontend Optimization

**Bundle Optimization:**

- Code splitting by route
- Lazy loading of components
- Tree shaking unused code
- Image optimization

**Caching Strategy:**

- Static assets cached on CDN
- API responses cached appropriately
- Service worker for offline support

### Backend Optimization

**Database Optimization:**

- Proper indexing
- Query optimization
- Connection pooling
- Read replicas for scaling

**Function Optimization:**

- Cold start minimization
- Memory usage optimization
- Timeout configuration
- Error handling

## Backup and Recovery

### Database Backups

**Automatic Backups:**

- Supabase provides automatic daily backups
- Point-in-time recovery available
- Cross-region replication

**Manual Backups:**

```bash
# Export database
supabase db dump --data-only > backup.sql

# Import database
supabase db reset --db-url postgresql://...
```

### Code Backups

**Git Repository:**

- All code in version control
- Automated deployments from main branch
- Rollback capabilities

## Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Check build logs
netlify logs

# Local build test
npm run build
```

**Function Errors:**

```bash
# Check function logs
netlify functions:list
netlify functions:invoke function-name
```

**Database Issues:**

```bash
# Check database status
supabase status

# View logs
supabase logs
```

### Performance Issues

**Frontend Performance:**

- Check bundle size
- Optimize images
- Review network requests
- Use performance monitoring

**Backend Performance:**

- Monitor database queries
- Check function execution time
- Review API response times
- Optimize database indexes

## Scaling Considerations

### Horizontal Scaling

**Frontend:**

- CDN distribution
- Multiple regions
- Edge functions

**Backend:**

- Database read replicas
- Function concurrency limits
- Caching layers

### Vertical Scaling

**Database:**

- Upgrade Supabase plan
- Optimize queries
- Add indexes

**Functions:**

- Increase timeout limits
- Optimize memory usage
- Use connection pooling

## Maintenance

### Regular Tasks

**Weekly:**

- Review error logs
- Check performance metrics
- Update dependencies
- Security audit

**Monthly:**

- Database maintenance
- Backup verification
- Security updates
- Performance review

**Quarterly:**

- Architecture review
- Scaling assessment
- Cost optimization
- Feature planning
