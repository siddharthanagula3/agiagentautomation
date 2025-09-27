# 🔧 Environment Variables Setup Guide

## 📍 WHERE TO SET ENVIRONMENT VARIABLES

To prevent login timeouts and infinite loading, you need to set proper Supabase credentials in **TWO places**:

### 1️⃣ LOCAL DEVELOPMENT (Your Computer)

**File Location:**
```
C:\Users\SIDDHARTHA NAGULA\Desktop\agi\agiagentautomation\.env
```

**What to do:**
1. Open the `.env` file in Notepad or VS Code
2. Replace the placeholder values:

```bash
# CHANGE THIS:
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# TO THIS (with your real values):
VITE_SUPABASE_URL=https://abcdef123456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ NETLIFY (Your Live Website)

**Where to go:**
1. Open https://app.netlify.com
2. Click on your site (agiagentautomation)
3. Go to **Site configuration** → **Environment variables**
4. Click **"Edit variables"**
5. Update these variables with real values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **"Save"**
7. **Redeploy your site**

## 🔑 How to Get Supabase Credentials

### Step 1: Sign up at Supabase
1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up (it's free)

### Step 2: Create a project
1. Click **"New project"**
2. Name it (e.g., "agi-agent-automation")
3. Set a database password
4. Choose your region
5. Click **"Create project"**

### Step 3: Get your credentials
1. Go to **Settings** → **API**
2. You'll see:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon/public key**: `eyJ...` (a long string)
3. Copy both values

## ✅ Quick Verification

Run this command to check if your setup is correct:
```bash
npm run check:env
```

**Good output:**
```
✅ Configuration looks good!
The app should connect to Supabase successfully.
```

**Bad output:**
```
⚠️ WARNING: Placeholder values detected!
🔧 DEMO MODE ACTIVE
```

## 🚀 Quick Commands

```bash
# Check your environment setup (Windows)
check-env.bat

# Check your environment setup (Mac/Linux)  
./check-env.sh

# Verify configuration
npm run check:env

# Test login system
npm run verify:login
```

## 📝 Complete Example of Working .env File

```bash
# This is what a properly configured .env looks like:

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://xyzproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjIzOTAyMiwiZXhwIjoxOTYxODE1MDIyfQ.1234567890abcdefghijklmnop

# Stripe Configuration (OPTIONAL)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123DEF456GHI789

# JWT Secret (OPTIONAL)
VITE_JWT_SECRET=my-super-secret-key-32-chars-minimum
```

## ⚠️ Important Notes

- **No quotes** around the values in .env file
- **No spaces** before or after the = sign
- Use the **anon/public key**, not the service role key
- **Restart your dev server** after changing .env
- **Redeploy on Netlify** after changing environment variables

## 🆘 Still Having Issues?

1. **Clear browser cache**: `Ctrl+F5`
2. **Restart dev server**: Stop and run `npm run dev` again
3. **Check console**: Press F12 and look for error messages
4. **Run verification**: `npm run verify:login`

## 🎯 What Happens After Setup

Once you set the real Supabase credentials in both places:

✅ **Login timeout will disappear completely**  
✅ **App switches from Demo Mode to Production Mode automatically**  
✅ **Users can register and login normally**  
✅ **Data persists between sessions**  
✅ **Full authentication system enabled**

## 🔄 Mode Detection

The app automatically detects your configuration:

- **Demo Mode** (yellow banner): Placeholder credentials detected
- **Production Mode** (no banner): Real Supabase credentials configured

## 📊 Status Indicators

| Mode | Banner | Credentials | Functionality |
|------|--------|-------------|---------------|
| Demo | 🟡 Yellow | demo@example.com / demo123 | Limited features |
| Production | ✅ None | Real user accounts | Full features |

---

**Need help?** Run `npm run check:env` to diagnose your setup!
