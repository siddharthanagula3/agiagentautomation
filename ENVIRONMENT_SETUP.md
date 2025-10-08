# Environment Setup Guide

## Required Environment Variables

### For OpenAI Agents Chat (/chat-agent)

Create a `.env.local` file in the project root with the following variables:

```bash
# OpenAI API Key (REQUIRED for /chat-agent page)
VITE_OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe (REQUIRED for billing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
```

### Optional AI Provider Keys

```bash
# Anthropic Claude
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here

# Google AI (Gemini)
VITE_GOOGLE_AI_API_KEY=your-google-ai-key-here

# Perplexity AI
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

### Development Settings

```bash
# Environment
VITE_ENV=development

# App URL
VITE_APP_URL=http://localhost:5173

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## Production Environment (Netlify)

Add these to your Netlify environment variables:

1. Go to **Site Settings** → **Environment Variables**
2. Add each variable with its production value
3. Important: Set `VITE_ENV=production`
4. Redeploy your site after adding variables

## Getting API Keys

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Add to your `.env.local` as `VITE_OPENAI_API_KEY`

### Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon public** key
4. Add to your `.env.local`

### Stripe
1. Visit https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_test_...`)
3. Add to your `.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY`

## Verification

After setting up your environment variables:

```bash
# Verify build works
npm run build

# Start development server
npm run dev

# Test the agent chat page
# Navigate to: http://localhost:5173/chat-agent
```

## Security Notes

- ⚠️ Never commit `.env.local` or `.env` files to Git
- ✅ Only use test/development keys in `.env.local`
- ✅ Use production keys in Netlify environment variables
- ✅ Rotate API keys periodically
- ✅ Set spending limits on OpenAI dashboard

## Troubleshooting

### "OpenAI API key not found"
- Check that `VITE_OPENAI_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key
- Verify the key starts with `sk-proj-` or `sk-`

### "No response from agent"
- Verify your OpenAI account has credits
- Check the browser console for detailed error messages
- Ensure the API key has the correct permissions

### "Database connection failed"
- Verify Supabase URL and key are correct
- Check that the database migrations have been applied
- Ensure RLS policies are properly configured

