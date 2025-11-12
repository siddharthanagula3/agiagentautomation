# Final Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] All Supabase migrations applied
- [x] All database tables, columns, and functions verified
- [x] Stripe webhook handler implemented
- [x] All code quality checks pass (tests, lint, type-check, build)
- [x] Production configuration updated (removed local/sandbox references)
- [x] Documentation created

## 📋 Pre-Deployment Steps (Manual)

### 1. Configure Environment Variables in Netlify

Go to **Netlify Dashboard** → **Site Settings** → **Environment Variables** and set:

**Supabase:**
- [ ] `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJxxx...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJxxx...` (server-side only)

**Stripe:**
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_xxx`
- [ ] `STRIPE_SECRET_KEY` = `sk_live_xxx`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_xxx` (get after creating webhook)

**LLM Provider (at least one):**
- [ ] `VITE_OPENAI_API_KEY` = `sk-xxx` OR
- [ ] `VITE_ANTHROPIC_API_KEY` = `sk-ant-xxx` OR
- [ ] `VITE_GOOGLE_API_KEY` = `xxx` OR
- [ ] `VITE_PERPLEXITY_API_KEY` = `xxx`

### 2. Create Stripe Webhook Endpoint

**Option A: Using Script (Recommended)**
```bash
export PRODUCTION_URL=https://your-site.netlify.app
export STRIPE_SECRET_KEY=sk_live_...
npx tsx scripts/setup-stripe-webhook.ts
```

**Option B: Manual Setup**
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy signing secret and set as `STRIPE_WEBHOOK_SECRET` in Netlify

## 🚀 Deployment

### 3. Commit and Push to Production

```bash
git add .
git commit -m "Complete Stripe & Supabase production setup

- Applied all database migrations
- Configured Stripe webhook handler
- Updated configuration for production (removed local/sandbox)
- Added comprehensive documentation
- All tests and builds passing"

git push origin main
```

### 4. Verify Netlify Deployment

- [ ] Check Netlify build logs for success
- [ ] Verify site is accessible
- [ ] Check for any build errors

## 🧪 Post-Deployment Testing

### 5. Test Core Functionality

- [ ] Application loads correctly
- [ ] Authentication works (login/register)
- [ ] Dashboard displays correctly
- [ ] Navigation works

### 6. Test Token System

- [ ] Navigate to `/billing`
- [ ] Click "Buy" on a token pack
- [ ] Complete test purchase with Stripe test card
- [ ] Verify tokens added to balance
- [ ] Check transaction logged in database

### 7. Test Custom Shortcuts

- [ ] Log in to application
- [ ] Go to chat interface
- [ ] Create a custom shortcut
- [ ] Use the shortcut
- [ ] Delete the shortcut

### 8. Test Artifact Gallery

- [ ] Navigate to `/gallery`
- [ ] Verify artifacts display
- [ ] Test search functionality
- [ ] Test filters
- [ ] Test artifact preview

## 📊 Monitoring

### 9. Monitor Systems

- [ ] Check Netlify function logs for errors
- [ ] Monitor Stripe webhook events in Dashboard
- [ ] Check Supabase database logs
- [ ] Verify user token balances updating correctly
- [ ] Monitor application performance

## ✅ Success Criteria

All of the following should be true:
- ✅ Application deployed and accessible
- ✅ All environment variables configured
- ✅ Stripe webhook receiving events
- ✅ Database queries working
- ✅ Authentication functional
- ✅ Token purchases working
- ✅ Custom shortcuts working
- ✅ Artifact gallery working
- ✅ No critical errors in logs

## 📚 Documentation Reference

- **Stripe Setup**: `docs/operations/STRIPE_WEBHOOK_QUICK_SETUP.md`
- **Supabase Setup**: `docs/operations/SUPABASE_PRODUCTION_SETUP.md`
- **Environment Variables**: `docs/operations/ENVIRONMENT_VARIABLES.md`
- **Complete Summary**: `docs/operations/COMPLETE_SETUP_SUMMARY.md`

## 🆘 Troubleshooting

If something doesn't work:

1. **Check Environment Variables**: Verify all are set correctly in Netlify
2. **Check Build Logs**: Look for errors in Netlify build
3. **Check Function Logs**: Review Netlify function execution logs
4. **Check Stripe Dashboard**: Verify webhook events are being received
5. **Check Supabase Dashboard**: Verify database queries are working
6. **Check Browser Console**: Look for client-side errors

## 🎉 Ready for Production!

Once all checklist items are complete, your application is fully deployed and ready for users!

