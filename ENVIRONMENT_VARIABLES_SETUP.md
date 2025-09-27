# 🚀 Environment Variables Setup Guide

## Where to Set Environment Variables

### 1️⃣ LOCAL DEVELOPMENT (.env file)

**Location:** `C:\Users\SIDDHARTHA NAGULA\Desktop\agi\agiagentautomation\.env`

**Steps:**
1. Open the `.env` file in your project root
2. Replace placeholder values with real Supabase credentials:

```bash
# BEFORE (Demo Mode - causes timeouts)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AFTER (Production Mode - no timeouts)
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ NETLIFY DEPLOYMENT (Environment Variables)

**Location:** Netlify Dashboard → Site Settings → Environment Variables

**Steps:**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `agiagentautomation.com`
3. Navigate to: **Site Settings** → **Environment Variables**
4. Click **"Edit variables"**
5. Update each variable:

| Variable Name | Current Value | Should Be |
|--------------|---------------|-----------|
| `VITE_SUPABASE_URL` | `your_supabase_url_here` | `https://[your-project].supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | `eyJ...` (your actual key) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `your_stripe_publishable_key_here` | `pk_live_...` or `pk_test_...` |
| `VITE_JWT_SECRET` | `your_jwt_secret_here` | Random 32+ character string |

6. Click **"Save"**
7. **Redeploy** your site for changes to take effect

### 3️⃣ GET YOUR SUPABASE CREDENTIALS

**Where to find them:**

1. **Create Supabase Account** (if you haven't)
   - Go to: https://supabase.com
   - Click "Start your project"
   - Sign up for free

2. **Create a New Project**
   - Click "New project"
   - Choose organization
   - Set project name
   - Generate database password (save it!)
   - Select region closest to you
   - Click "Create new project"

3. **Get Your Credentials**
   - Go to: **Settings** → **API**
   - You'll find:
     - **Project URL**: `https://xyzabc123.supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Copy these values

### 4️⃣ VERCEL DEPLOYMENT (Alternative to Netlify)

**Location:** Vercel Dashboard → Project Settings → Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with production values

### 5️⃣ GITHUB SECRETS (For CI/CD)

**Location:** GitHub → Settings → Secrets and variables → Actions

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://[your-project].supabase.co`

## 📝 Complete .env Example

```bash
# ============================================
# PRODUCTION CONFIGURATION
# ============================================

# Supabase (REQUIRED - Get from supabase.com)
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ2MjM5MDIyLCJleHAiOjE5NjE4MTUwMjJ9.AbCdEfGhIjKlMnOpQrStUvWxYz

# Stripe (OPTIONAL - For payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop

# JWT Secret (OPTIONAL - For extra security)
VITE_JWT_SECRET=my-super-secret-jwt-key-change-this-in-production

# Server-only (Don't expose to client)
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
```

## 🔍 How to Verify Configuration

### Test Locally:
```bash
# 1. Check configuration
npm run test:supabase

# 2. If it shows "Demo Mode Active", update .env file

# 3. Restart dev server
npm run dev

# 4. Check again
npm run verify:login
```

### Test on Netlify:
1. After updating environment variables
2. Trigger a redeploy:
   - **Option A:** Push a commit to GitHub
   - **Option B:** Click "Trigger deploy" in Netlify
3. Wait for deployment (2-3 minutes)
4. Visit your site and check if demo banner is gone

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T DO THIS:
```bash
# Wrong - Still has placeholder text
VITE_SUPABASE_URL=your_supabase_url_here

# Wrong - Missing quotes (sometimes needed)
VITE_SUPABASE_URL = https://xyz.supabase.co

# Wrong - Extra spaces
VITE_SUPABASE_URL= https://xyz.supabase.co 

# Wrong - Using private key instead of anon key
VITE_SUPABASE_ANON_KEY=service_role_key_xxxxx
```

### ✅ DO THIS:
```bash
# Correct - Real URL, no quotes, no spaces
VITE_SUPABASE_URL=https://xyzabc123.supabase.co

# Correct - Real anon/public key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚨 Security Notes

### Public Variables (Safe to expose):
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅  
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅

### Private Variables (NEVER expose):
- `SUPABASE_SERVICE_ROLE_KEY` ❌
- `STRIPE_SECRET_KEY` ❌
- Database passwords ❌

## 📊 Expected Results After Setup

### Before (Demo Mode):
- 🟡 Yellow "Demo Mode Active" banner
- 🔒 Only demo@example.com / demo123 works
- ⏱️ Possible timeouts
- ❌ No data persistence

### After (Production Mode):
- ✅ No demo banner
- 🔓 Any email/password works
- ⚡ Fast authentication
- 💾 Data persists in database

## 🆘 Still Having Issues?

### Quick Checklist:
- [ ] Created Supabase account
- [ ] Created Supabase project
- [ ] Copied correct credentials
- [ ] Updated .env file locally
- [ ] Restarted dev server
- [ ] Updated Netlify variables
- [ ] Redeployed Netlify site
- [ ] Cleared browser cache

### Debug Commands:
```bash
# Check local setup
npm run test:supabase

# Verify login system
npm run verify:login

# Check environment variables are loaded
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

## 📞 Need More Help?

1. **Supabase Documentation**: https://supabase.com/docs
2. **Netlify Environment Variables**: https://docs.netlify.com/environment-variables/
3. **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html

---

**Remember:** After setting real environment variables, the login timeout issues will disappear completely!
