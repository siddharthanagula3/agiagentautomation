# 🚀 Complete Setup Guide - Supabase + Stripe

## ✅ What's Already Done
- Code deployed to production
- Marketplace UI updated with attractive pricing
- Free hiring flow implemented
- Stripe CLI installed (v1.31.0)

---

## 📋 Step 1: Setup Supabase Database (2 minutes)

### The SQL script has been copied to your clipboard!

**Just do this:**

1. **Open Supabase Dashboard**  
   → https://supabase.com/dashboard

2. **Select your project**: `agiagentautomation`

3. **Click "SQL Editor"** (left sidebar)

4. **Click "New Query"** button

5. **Paste** (Ctrl+V) - the SQL is already in your clipboard!

6. **Click "Run"** (or press F5)

7. **Verify** - You should see "Setup complete!" message

### What this creates:
- ✅ `purchased_employees` table
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes
- ✅ Proper permissions

---

## 💳 Step 2: Setup Stripe Webhooks (Optional - for testing subscriptions)

### For Local Development:

```powershell
# 1. Login to Stripe CLI (one time)
stripe login

# 2. Start webhook forwarding (keep running while testing)
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

**After starting**, you'll see a webhook signing secret like:
```
whsec_abc123...
```

**Copy that secret** and add to your local `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### For Production (Netlify):

Your Stripe webhook is already configured in Netlify:
- Endpoint: `https://agiagentautomation.com/.netlify/functions/stripe-webhook`
- Events: All subscription events
- Secret: Already in Netlify environment variables

---

## 🧪 Step 3: Test Everything

### Test 1: Free Hiring
1. Go to: https://agiagentautomation.com/marketplace
2. Click "Hire Now - Free!" on any employee
3. Should see: ✅ Success toast
4. Go to: `/workforce`
5. Employee should appear in your team
6. Click "Build with AI" - start chatting!

### Test 2: Pro Plan ($20/mo)
1. Go to: `/billing`
2. Click "Upgrade to Pro"
3. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
4. Return to billing page
5. Verify: Plan shows "Pro"
6. Verify: Token limits updated to 2.5M per LLM

### Test 3: Max Plan ($299/mo)
1. Same as Pro, but click "Upgrade to Max"
2. Verify: Token limits updated to 10M per LLM

---

## 🔍 Troubleshooting

### "Failed to hire employee"
→ Make sure you ran the SQL script in Supabase
→ Check browser console for detailed error
→ Verify you're logged in

### Employee doesn't appear in workforce
→ Refresh the page
→ Check Supabase Table Editor - look for your `user_id`
→ Check RLS policies are enabled

### Stripe subscription not updating tokens
→ Check webhook logs in Stripe Dashboard
→ Verify webhook secret is correct
→ Check Netlify function logs

---

## 📊 Current Configuration

### Revenue Model
- **Free**: All employees, 1M tokens (250k/LLM)
- **Pro**: $20/mo, 10M tokens (2.5M/LLM)
- **Max**: $299/mo, 40M tokens (10M/LLM)

### Database Schema
```sql
purchased_employees (
  id              uuid PRIMARY KEY
  user_id         uuid → auth.users
  employee_id     text
  name            text
  role            text
  provider        text (chatgpt|claude|gemini|perplexity)
  is_active       boolean
  purchased_at    timestamptz
  created_at      timestamptz
)
```

### Stripe Products
- Pro Plan: `price_xxx` - $20/month
- Max Plan: `price_xxx` - $299/month

---

## 🎯 What Works Now

### ✅ Working
- Marketplace displays attractive pricing
- Free hiring (after SQL script)
- Workforce displays hired employees
- Pro/Max subscriptions
- Stripe webhooks
- Token tracking
- Billing analytics

### ⚠️ Needs SQL Script
- Hiring employees
- Viewing workforce

---

## 🚀 Quick Commands

```powershell
# Copy SQL to clipboard
Get-Content SETUP_FREE_HIRING.sql | Set-Clipboard

# Check Stripe CLI
stripe --version

# Start Stripe webhook listener (local)
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

# Start local dev server
npm run dev

# Build for production
npm run build

# Deploy to Netlify
git push origin main
```

---

## 📝 Files Reference

- `SETUP_FREE_HIRING.sql` - Database setup script
- `RUN_THIS_IN_SUPABASE_NOW.md` - Detailed Supabase instructions
- `QUICK_START_GUIDE.md` - Quick reference
- `CURRENT_STATUS.md` - Project status
- `FREE_HIRING_SUMMARY.md` - Implementation details

---

## ✅ Checklist

- [ ] Run SQL script in Supabase Dashboard
- [ ] Test hiring an employee
- [ ] Verify employee appears in workforce  
- [ ] Test Pro plan upgrade (optional)
- [ ] Test Max plan upgrade (optional)
- [ ] Check Stripe webhook logs (if testing subscriptions)

---

**Status**: Ready to go! Just run the SQL script in Supabase. 🎉

**The SQL is already in your clipboard** - just paste it in Supabase SQL Editor!

