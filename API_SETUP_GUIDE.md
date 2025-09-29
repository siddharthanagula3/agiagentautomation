# 🔑 API Keys Setup Guide

## Where to Add API Keys

### For Local Development (.env file)

Add these variables to your `.env` file:

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=https://lywdzvfibhzbljrgovwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEMO_MODE=false

# AI Provider API Keys (Add these)
VITE_OPENAI_API_KEY=sk-proj-your-openai-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key-here
VITE_GOOGLE_API_KEY=AIzaSy-your-google-key-here
VITE_PERPLEXITY_API_KEY=pplx-your-perplexity-key-here
```

### For Production (Netlify Environment Variables)

Since you're deploying to Netlify, add API keys in **Netlify Dashboard**:

1. **Go to Netlify Dashboard**
   - Open your site in Netlify
   - Go to **Site settings** → **Environment variables**

2. **Add Environment Variables**

   Click **Add a variable** and add each one:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `VITE_SUPABASE_URL` | `https://lywdzvfibhzbljrgovwr.supabase.co` | ✅ Already set |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Already set |
   | `VITE_OPENAI_API_KEY` | `sk-proj-...` | Get from OpenAI |
   | `VITE_ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Get from Anthropic |
   | `VITE_GOOGLE_API_KEY` | `AIzaSy...` | Get from Google Cloud |
   | `VITE_PERPLEXITY_API_KEY` | `pplx-...` | Get from Perplexity |
   | `VITE_DEMO_MODE` | `false` | Optional |

3. **Deploy Context** (Optional)
   - Set these for "All" or specifically for "Production"
   - Can also set different keys for "Deploy previews" for testing

4. **Trigger Redeploy**
   - After adding keys, redeploy your site
   - Netlify will automatically inject these into your build

---

## 🔐 How to Get API Keys

### 1. OpenAI (ChatGPT) - $5/month minimum

1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-proj-...`)
5. **Important**: Add billing info and credits

**Recommended Models:**
- `gpt-4` - Most capable, slower, more expensive
- `gpt-3.5-turbo` - Fast, cheaper, good for most tasks

**Pricing (as of 2024):**
- GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
- GPT-3.5-turbo: $0.0005/1K input tokens, $0.0015/1K output tokens

---

### 2. Anthropic (Claude) - $5/month minimum

1. Go to https://console.anthropic.com/settings/keys
2. Sign in or create account
3. Click **"Create Key"**
4. Copy the key (starts with `sk-ant-api03-...`)
5. **Important**: Add billing info and credits

**Recommended Models:**
- `claude-3-5-sonnet-20241022` - Best balance of speed/quality
- `claude-3-opus-20240229` - Most capable, slower
- `claude-3-haiku-20240307` - Fastest, cheapest

**Pricing:**
- Claude 3.5 Sonnet: $3/MTok input, $15/MTok output
- Claude 3 Opus: $15/MTok input, $75/MTok output
- Claude 3 Haiku: $0.25/MTok input, $1.25/MTok output

---

### 3. Google AI (Gemini) - FREE tier available!

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the key (starts with `AIzaSy...`)

**FREE Tier:**
- 15 requests per minute
- 1500 requests per day
- Perfect for testing!

**Recommended Models:**
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Faster, still very good

**Pricing (if you exceed free tier):**
- Gemini 1.5 Pro: $1.25/1M input tokens, $5/1M output tokens
- Gemini 1.5 Flash: $0.075/1M input tokens, $0.30/1M output tokens

---

### 4. Perplexity - $20/month subscription

1. Go to https://www.perplexity.ai/settings/api
2. Sign in or create account
3. Subscribe to Pro ($20/month)
4. Click **"Generate"** under API Keys
5. Copy the key (starts with `pplx-...`)

**Recommended Models:**
- `llama-3.1-sonar-large-128k-online` - With web search
- `llama-3.1-sonar-large-128k-chat` - Without web search

**Pricing:**
- Included in $20/month Pro subscription
- Rate limits apply (check their docs)

---

## 💡 Recommendations

### **Start With (Cheapest Option):**

1. **Google Gemini** (FREE)
   - Best for testing and development
   - No credit card required
   - Good quality responses

2. **OpenAI GPT-3.5-turbo** ($5 minimum)
   - Add $5 credits to your OpenAI account
   - Very cheap per request
   - Fast and reliable

### **For Production (Best Quality):**

1. **Claude 3.5 Sonnet** (Anthropic)
   - Best reasoning and coding abilities
   - Great for complex tasks
   - Good balance of cost/quality

2. **GPT-4** (OpenAI)
   - Most widely tested
   - Excellent for general tasks
   - Higher cost but very capable

---

## 🚀 Quick Start Steps

### Option 1: Free Testing (Google Gemini only)

```bash
# Add to .env
VITE_GOOGLE_API_KEY=AIzaSy-your-key-here

# Test it works
npm run dev
# Open http://localhost:5173
# Go to Chat page
# Hire a Gemini employee from marketplace
# Start chatting!
```

### Option 2: Full Setup (All Providers)

```bash
# Add all keys to .env
VITE_OPENAI_API_KEY=sk-proj-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_GOOGLE_API_KEY=AIzaSy...
VITE_PERPLEXITY_API_KEY=pplx-...

# Test locally
npm run dev

# Deploy to Netlify
# 1. Add same keys to Netlify env variables
# 2. Trigger redeploy
# 3. Done!
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep API keys in `.env` file (never commit to Git)
- ✅ Add `.env` to `.gitignore`
- ✅ Use Netlify environment variables for production
- ✅ Rotate keys periodically
- ✅ Monitor API usage and costs
- ✅ Set spending limits on provider dashboards

### ❌ DON'T:
- ❌ Never commit API keys to Git
- ❌ Never expose keys in client-side code
- ❌ Never share keys publicly
- ❌ Don't use production keys for testing

---

## 📊 Cost Estimation

### Typical Usage Per Month:

**Light Use (10 chats/day, ~100 messages):**
- Google Gemini: **FREE** ✅
- OpenAI GPT-3.5: **~$0.50**
- Claude Sonnet: **~$2-3**
- OpenAI GPT-4: **~$5-10**

**Medium Use (50 chats/day, ~500 messages):**
- Google Gemini: **FREE** (if under limits) ✅
- OpenAI GPT-3.5: **~$2-3**
- Claude Sonnet: **~$10-15**
- OpenAI GPT-4: **~$25-40**

**Heavy Use (200 chats/day, ~2000 messages):**
- Google Gemini: **$5-10** (exceeds free tier)
- OpenAI GPT-3.5: **~$8-12**
- Claude Sonnet: **~$40-60**
- OpenAI GPT-4: **~$100-200**

---

## 🐛 Troubleshooting

### "API key not configured" error

**Solution:**
1. Check `.env` file has the key
2. Restart dev server: `npm run dev`
3. For Netlify: Check env variables in dashboard
4. Redeploy after adding keys

### "Invalid API key" error

**Solution:**
1. Verify key is copied correctly (no spaces)
2. Check key hasn't expired
3. Verify billing is set up (OpenAI, Anthropic)
4. Try generating a new key

### "Rate limit exceeded" error

**Solution:**
1. Wait a few minutes
2. Upgrade to paid tier
3. Use different provider temporarily

### Build fails on Netlify

**Solution:**
1. Check env variables are set correctly
2. Variable names must match exactly: `VITE_OPENAI_API_KEY`
3. No spaces or quotes in values
4. Redeploy after changes

---

## 📝 Example .env File

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://lywdzvfibhzbljrgovwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYmh6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODI2MDgsImV4cCI6MjA3NDM1ODYwOH0.pt991Dh770PYQRNX3L9va1D_qupbb_j-JynYo2XcTw

# AI Provider API Keys
# Get from: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Get from: https://console.anthropic.com/settings/keys
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key-here

# Get from: https://aistudio.google.com/app/apikey
VITE_GOOGLE_API_KEY=AIzaSy-your-google-api-key-here

# Get from: https://www.perplexity.ai/settings/api
VITE_PERPLEXITY_API_KEY=pplx-your-perplexity-api-key-here

# Optional
VITE_DEMO_MODE=false
```

---

## ✅ Verification Checklist

- [ ] Added API keys to local `.env` file
- [ ] Restarted dev server
- [ ] Tested chat with at least one provider
- [ ] Added keys to Netlify environment variables
- [ ] Triggered Netlify redeploy
- [ ] Tested production deployment
- [ ] Set up billing/spending limits on provider dashboards
- [ ] Added `.env` to `.gitignore`

---

## 🎉 You're All Set!

Once you've added at least one API key:
1. Go to **Marketplace** and hire an AI employee
2. Go to **Chat** page
3. Click **"New Chat"**
4. Select your hired employee
5. Start chatting!

The chat will now use **real AI** instead of mock responses! 🚀
