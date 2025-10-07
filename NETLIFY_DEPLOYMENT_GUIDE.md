# Netlify Deployment Guide - Environment Variables Setup

## ⚠️ Critical: Environment Variables Must Be Set in Netlify Dashboard

The "Failed to fetch" error in the chat interface is caused by missing environment variables in the Netlify deployment. Environment variables in your local `.env` file are **NOT** automatically transferred to Netlify.

## 🔧 How to Fix the Chat API Errors

### Step 1: Access Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site: **agiagentautomation**
3. Click on **Site settings**
4. Navigate to **Environment variables** (under Build & deploy)

### Step 2: Add Required API Keys

Add the following environment variables in Netlify:

#### **Required Variables:**

```bash
# OpenAI (ChatGPT)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Claude)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google (Gemini)
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Demo Mode (optional)
VITE_DEMO_MODE=false
```

#### **Optional Variables:**

```bash
# Perplexity (if you have a key)
VITE_PERPLEXITY_API_KEY=your_key_here
```

### Step 3: Redeploy Your Site

After adding the environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the deployment to complete
4. Test the chat interface

## 🔍 Troubleshooting

### Issue: Chat still not working after adding variables

**Solution:**
1. Verify all variables are added correctly (no typos)
2. Make sure you clicked **Save** after adding each variable
3. Trigger a **new deployment** (environment variables only take effect on new builds)
4. Clear your browser cache and reload the page

### Issue: "Invalid API key" errors

**Solution:**
1. Double-check the API keys are correct
2. Test the API keys locally first with `npm run dev`
3. Verify the keys haven't expired
4. Check the API provider's dashboard for key status

### Issue: CORS errors in production

**Solution:**
- CORS errors usually don't occur in production
- If they do, check that:
  - Your site domain is allowed in the API provider's settings
  - You're using HTTPS (required by most API providers)

## 📝 Verification Steps

### After Deployment:

1. **Open Browser Console** (F12 → Console tab)
2. Navigate to `/chat` on your deployed site
3. Try sending a message
4. Check for these logs:
   - `[AI Service] Environment status` - Shows if keys are loaded
   - `[OpenAI/Anthropic/Google] Sending request` - Shows API calls
   - Look for any error messages

### Expected Behavior:

- ✅ No "Failed to fetch" errors
- ✅ AI responses appear in chat
- ✅ No console errors about missing API keys

## 🚀 Quick Fix Commands

### If you need to update keys:

1. Update in Netlify Dashboard
2. Trigger new deployment
3. No code changes needed

### To add new environment variables in the future:

1. Add to local `.env` file (for development)
2. Add to Netlify Dashboard (for production)
3. Commit any code changes that use the new variables
4. Deploy

## 📚 Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/environment-variables/overview/)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Anthropic API Keys](https://console.anthropic.com/)
- [Google AI Studio](https://aistudio.google.com/apikey)

## ⚡ Important Notes

1. **Never commit API keys to Git** - They should only be in:
   - Local `.env` file (in `.gitignore`)
   - Netlify Dashboard environment variables

2. **Environment variables are case-sensitive** - Use exact names:
   - ✅ `VITE_OPENAI_API_KEY`
   - ❌ `VITE_openai_api_key`

3. **All Vite environment variables must start with `VITE_`** - This is required by Vite to expose them to the browser

4. **Changes require redeployment** - Environment variable updates don't auto-deploy

## 🎯 Next Steps

After fixing the environment variables:

1. ✅ Test the chat with all three AI providers (ChatGPT, Claude, Gemini)
2. ✅ Verify purchased employees work correctly
3. ✅ Check that token tracking is working
4. ✅ Test media generation features
5. ✅ Monitor for any errors in production

---

**Status:** 🔴 Environment variables need to be set in Netlify Dashboard
**Priority:** 🚨 Critical - Chat functionality is broken without these
**ETA:** ~5 minutes to add variables + 2-3 minutes deployment time

