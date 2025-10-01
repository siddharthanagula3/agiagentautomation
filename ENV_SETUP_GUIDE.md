# 🔐 ENVIRONMENT CONFIGURATION GUIDE

## ⚠️ CRITICAL: Your .env file currently has PLACEHOLDER values!

All API keys are set to placeholders and won't work. You need to replace them with real credentials.

---

## 📋 REQUIRED CREDENTIALS CHECKLIST

### 1. SUPABASE (REQUIRED) ✅ Priority 1

**Current Status**: ❌ Placeholder values

**Where to Get**:
1. Go to https://supabase.com
2. Sign in / Create account
3. Create new project or select existing
4. Go to Settings → API
5. Copy these values:

**What to Copy**:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR-ACTUAL-KEY-HERE
```

**Time**: 5 minutes
**Cost**: Free (up to 500MB database, 2GB bandwidth)

---

### 2. AI API KEYS (At least ONE required) ✅ Priority 2

You need AT LEAST ONE of these for chat to work:

#### Option A: Anthropic Claude (RECOMMENDED)
**Current Status**: ❌ Placeholder

**Where to Get**:
1. Go to https://console.anthropic.com
2. Sign in / Create account
3. Go to API Keys
4. Click "Create Key"
5. Copy the key (starts with sk-ant-)

**What to Copy**:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
```

**Time**: 3 minutes
**Cost**: $5 free credit, then pay-as-you-go

---

#### Option B: Google AI (Gemini)
**Current Status**: ❌ Placeholder

**Where to Get**:
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with AIza)

**What to Copy**:
```env
VITE_GOOGLE_AI_API_KEY=AIzaSy-YOUR-ACTUAL-KEY-HERE
```

**Time**: 2 minutes
**Cost**: Free tier available

---

### 3. OPTIONAL SERVICES (Can skip for now)

#### Brave Search (For web search functionality)
**Current Status**: ❌ Placeholder
**Where to Get**: https://brave.com/search/api/
```env
VITE_BRAVE_SEARCH_API_KEY=BSA-YOUR-ACTUAL-KEY-HERE
```

#### JDoodle (For code execution)
**Current Status**: ❌ Placeholder
**Where to Get**: https://www.jdoodle.com/compiler-api
```env
VITE_JDOODLE_CLIENT_ID=your-client-id
VITE_JDOODLE_CLIENT_SECRET=your-client-secret
```

#### Browserless (For web automation)
**Current Status**: ❌ Placeholder
**Where to Get**: https://www.browserless.io
```env
VITE_BROWSERLESS_API_KEY=your-key-here
```

---

## 🎯 QUICK START: Minimum Required Setup

To get the app working, you ONLY need:

1. **VITE_SUPABASE_URL** ← Database connection
2. **VITE_SUPABASE_ANON_KEY** ← Database authentication
3. **VITE_ANTHROPIC_API_KEY** OR **VITE_GOOGLE_AI_API_KEY** ← AI chat

Total time: **10 minutes**
Total cost: **$0 (free tiers)**

---

## 📝 HOW TO UPDATE YOUR .env FILE

### Method 1: Manual Edit (Recommended)
1. Open `.env` file in your text editor
2. Replace the placeholder values with real keys
3. Save the file
4. Restart dev server: `Ctrl+C` then `npm run dev`

### Method 2: Copy from Template
1. I'll create a clean template below
2. Copy it to your `.env` file
3. Fill in your real values
4. Save and restart server

---

## 📄 CLEAN .env TEMPLATE

Copy this template and fill in your values:

```env
# ===========================================
# SUPABASE CONFIGURATION (REQUIRED)
# ===========================================
# Get from: https://app.supabase.com → Your Project → Settings → API
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# ===========================================
# AI API KEYS (At least ONE required)
# ===========================================

# Anthropic Claude (Recommended)
# Get from: https://console.anthropic.com → API Keys
VITE_ANTHROPIC_API_KEY=

# Google AI (Alternative)
# Get from: https://makersuite.google.com/app/apikey
VITE_GOOGLE_AI_API_KEY=

# ===========================================
# OPTIONAL SERVICES (Can skip for now)
# ===========================================

# Brave Search (For web search)
# Get from: https://brave.com/search/api/
VITE_BRAVE_SEARCH_API_KEY=

# JDoodle (For code execution)
# Get from: https://www.jdoodle.com/compiler-api
VITE_JDOODLE_CLIENT_ID=
VITE_JDOODLE_CLIENT_SECRET=

# Browserless (For web automation)
# Get from: https://www.browserless.io
VITE_BROWSERLESS_API_KEY=
```

---

## ✅ VERIFICATION CHECKLIST

After updating your .env file:

- [ ] No placeholder values remain
- [ ] VITE_SUPABASE_URL starts with https://
- [ ] VITE_SUPABASE_ANON_KEY starts with eyJ
- [ ] At least one AI key is filled in
- [ ] No extra spaces before or after values
- [ ] File saved
- [ ] Dev server restarted

---

## 🧪 TESTING YOUR CONFIGURATION

### Test 1: Check .env is Loaded
```bash
# Run this in your terminal
npm run dev
# Look for any .env errors in output
```

### Test 2: Test Supabase Connection
1. Start dev server
2. Open http://localhost:5173
3. Try to register/login
4. If you see "Failed to fetch" → Supabase config is wrong

### Test 3: Test AI API
1. Go to Chat page
2. Send a message
3. If no response → AI API key is wrong/missing

---

## 🆘 COMMON ISSUES

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution**: 
- Make sure .env file is in project ROOT directory
- Restart dev server after changes
- Check file is named exactly `.env` (not .env.txt)

### Issue: "Invalid API key"
**Solution**:
- Regenerate API key from provider
- Make sure no spaces in .env values
- Check key hasn't expired

### Issue: "Failed to fetch"
**Solution**:
- Check internet connection
- Verify Supabase URL is correct
- Check Supabase project is active

---

## 📞 NEXT STEPS

After updating .env:

1. ✅ Save this guide for reference
2. 🔑 Get your API keys (10 minutes)
3. ✏️ Update .env file
4. 🔄 Restart dev server
5. 🧪 Test the application
6. 📊 Continue with database setup

---

**Last Updated**: September 30, 2025
**Priority**: HIGH - Must complete before continuing
**Estimated Time**: 10-15 minutes
