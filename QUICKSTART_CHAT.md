# 🚀 QUICK START - Get Chat Working in 5 Minutes

## Problem Fixed ✅
- **Issue**: Click on Software Architect does nothing
- **Cause**: Missing AI API keys
- **Solution**: Add API keys (see below)

---

## Fastest Way to Test (FREE)

### 1. Get Google Gemini API Key (FREE, no credit card)
```
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with AIzaSy...)
```

### 2. Add to .env file
```env
VITE_GOOGLE_API_KEY=AIzaSy-your-key-here
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Test It!
```
1. Open http://localhost:5173
2. Go to Marketplace
3. Hire a "Gemini" employee
4. Go to Chat page
5. Click "New Chat"
6. Select your employee
7. Start chatting! 🎉
```

---

## For Production (Netlify)

### Add Environment Variable in Netlify:

1. **Netlify Dashboard** → Your Site → **Site settings**
2. **Environment variables** → **Add a variable**
3. Add:
   - Key: `VITE_GOOGLE_API_KEY`
   - Value: `AIzaSy-your-key-here`
4. **Save**
5. **Trigger redeploy**

Done! Your chat will work in production.

---

## All Provider API Keys (Optional)

Add to `.env` for local OR Netlify env vars for production:

```env
# FREE - Start here
VITE_GOOGLE_API_KEY=AIzaSy...

# $5 minimum - Very cheap per message
VITE_OPENAI_API_KEY=sk-proj...

# $5 minimum - Best quality
VITE_ANTHROPIC_API_KEY=sk-ant-api03...

# $20/month subscription
VITE_PERPLEXITY_API_KEY=pplx...
```

### Where to Get Keys:

| Provider | URL | Free? |
|----------|-----|-------|
| Google Gemini | https://aistudio.google.com/app/apikey | ✅ YES |
| OpenAI | https://platform.openai.com/api-keys | ❌ $5 min |
| Anthropic | https://console.anthropic.com/settings/keys | ❌ $5 min |
| Perplexity | https://www.perplexity.ai/settings/api | ❌ $20/mo |

---

## What Changed in the Code

### ✅ NEW: AI Chat Service
- File: `src/services/ai-chat-service.ts`
- Handles real API calls to OpenAI, Anthropic, Google, Perplexity
- Automatic error handling
- Checks if API keys are configured

### ✅ UPDATED: Chat Page
- File: `src/pages/chat/ChatPage.tsx`
- Better error handling with try-catch
- Console logging for debugging
- Shows which providers are configured
- Real AI responses instead of mocks
- Loading states
- API configuration warnings

---

## Troubleshooting

### Still says "not configured"?
```bash
# 1. Check .env file exists and has the key
cat .env | grep VITE_GOOGLE_API_KEY

# 2. Restart dev server (IMPORTANT!)
npm run dev

# 3. Check browser console for errors
# Open DevTools → Console tab
```

### For Netlify:
```
1. Double-check environment variable name is exact: VITE_GOOGLE_API_KEY
2. No spaces or quotes in the value
3. After adding, trigger a new deploy
4. Check build logs for errors
```

### Chat opens but errors when sending?
- Check API key is valid
- Check you have billing set up (OpenAI, Anthropic)
- Check you're within rate limits (Google free tier: 15/min)
- Check browser console for error details

---

## Cost Summary

### Recommended for Testing:
**Google Gemini (FREE)** 
- 15 requests/min
- 1500 requests/day
- No credit card needed
- Great quality

### Recommended for Production:
**OpenAI GPT-3.5-turbo ($5 gets you far)**
- ~$0.002 per message
- $5 = ~2500 messages
- Fast and reliable

OR

**Claude 3.5 Sonnet (Best quality)**
- ~$0.02-0.05 per message  
- Best reasoning
- Great for complex tasks

---

## Files Modified

```
✅ Created: src/services/ai-chat-service.ts
✅ Updated: src/pages/chat/ChatPage.tsx
✅ Created: API_SETUP_GUIDE.md (detailed guide)
✅ Created: QUICKSTART_CHAT.md (this file)
```

---

## Next Steps

1. **Add at least one API key** (recommend Google Gemini - it's free!)
2. **Restart your dev server**
3. **Hire an employee from marketplace**
4. **Test the chat**
5. **Add to Netlify** for production
6. **Hire more employees** with different providers
7. **Enjoy your AI workforce!** 🎉

---

## Need Help?

Check the browser console (F12 → Console tab) for detailed error messages.
All API calls now log to console for easy debugging.

Read `API_SETUP_GUIDE.md` for complete details on:
- How to get each API key
- Pricing details
- Security best practices
- Troubleshooting guide
