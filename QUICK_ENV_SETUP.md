# 🎯 QUICK FIX: Environment Variables Setup

## 📍 WHERE TO SET THEM:

### 🖥️ FOR LOCAL DEVELOPMENT
**File:** `.env` (in your project root folder)
```
C:\Users\SIDDHARTHA NAGULA\Desktop\agi\agiagentautomation\.env
```

### 🌐 FOR NETLIFY (Your Live Website)
**Location:** 
1. Go to: https://app.netlify.com
2. Click your site: `agiagentautomation`
3. Go to: **Site Settings** → **Environment Variables**
4. Click **"Edit variables"**

## 🔑 WHAT TO SET:

### Step 1: Get Supabase Credentials
1. Go to: https://supabase.com
2. Sign up → Create project
3. Go to: **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **anon/public key** (starts with: `eyJ...`)

### Step 2: Update Your .env File
Open `.env` file and replace:

```bash
# OLD (Causes timeout)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NEW (No timeout!)
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...YOUR-ACTUAL-KEY-HERE...
```

### Step 3: Update Netlify
Same variables, same values:
- `VITE_SUPABASE_URL` = Your Supabase URL
- `VITE_SUPABASE_ANON_KEY` = Your anon key

### Step 4: Restart/Redeploy
- **Local:** Restart dev server (`npm run dev`)
- **Netlify:** Click "Trigger deploy" or push to GitHub

## ✅ VERIFY IT WORKED:

Run this command:
```bash
npm run test:supabase
```

**If it says:** "Demo Mode Active" ❌ = Still using placeholders
**If it says:** "Configuration looks good!" ✅ = Fixed!

## 🚀 THAT'S IT!

After setting real Supabase credentials:
- ✅ No more login timeouts
- ✅ No more infinite loading
- ✅ No more demo mode restrictions
- ✅ Real user authentication works

---
**Need help?** The credentials are in: Supabase Dashboard → Settings → API
