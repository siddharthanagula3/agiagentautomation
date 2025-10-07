# AI API Setup Guide

This guide will help you configure API keys for all supported AI providers in your AGI Workforce application.

## 🚀 Quick Setup

### 1. Create Local Environment File

Create a `.env` file in your project root:

```env
# AI Provider API Keys
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_GOOGLE_API_KEY=your_google_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_key_here

# Demo Mode (optional - enables mock responses when keys are missing)
VITE_DEMO_MODE=true
```

### 2. Get API Keys

#### OpenAI (ChatGPT)
1. Visit: https://platform.openai.com/api-keys
2. Sign up/Login to OpenAI
3. Click "Create new secret key"
4. Copy the key and add to `.env` as `VITE_OPENAI_API_KEY`

#### Anthropic (Claude)
1. Visit: https://console.anthropic.com/
2. Sign up/Login to Anthropic
3. Go to API Keys section
4. Create a new key
5. Copy the key and add to `.env` as `VITE_ANTHROPIC_API_KEY`

#### Google (Gemini)
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key and add to `.env` as `VITE_GOOGLE_API_KEY`

#### Perplexity
1. Visit: https://www.perplexity.ai/settings/api
2. Sign up/Login to Perplexity
3. Generate API key
4. Copy the key and add to `.env` as `VITE_PERPLEXITY_API_KEY`

## 🔧 Production Setup (Netlify)

### For Netlify Deployment:

1. Go to your Netlify dashboard
2. Navigate to your site → Site settings → Environment variables
3. Add each API key as an environment variable:
   - `VITE_OPENAI_API_KEY` = your_openai_key
   - `VITE_ANTHROPIC_API_KEY` = your_anthropic_key
   - `VITE_GOOGLE_API_KEY` = your_google_key
   - `VITE_PERPLEXITY_API_KEY` = your_perplexity_key

## 🛠️ Features

### Enhanced Error Handling
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Rate Limit Handling**: Graceful handling of rate limits with retry
- **Network Error Recovery**: Automatic retry for network issues
- **Detailed Error Messages**: Clear error messages with setup instructions

### Demo Mode
When `VITE_DEMO_MODE=true` and API keys are missing, the app will:
- Show mock responses instead of errors
- Display helpful setup instructions
- Allow users to test the interface without API keys

### Provider-Specific Features

#### OpenAI
- Models: `gpt-4o-mini` (default), `gpt-4`, `gpt-3.5-turbo`
- Features: Chat completions, function calling, image analysis
- Error handling: Rate limits, billing issues, authentication

#### Anthropic (Claude)
- Models: `claude-3-5-sonnet-20241022` (default), `claude-3-haiku`, `claude-3-opus`
- Features: Long context, system instructions, safety controls
- Error handling: Rate limits, billing, authentication

#### Google (Gemini)
- Models: `gemini-2.0-flash` (default), `gemini-1.5-pro`, `gemini-1.5-flash`
- Features: Multimodal (text + images), safety settings, system instructions
- Error handling: Rate limits, permissions, model availability

#### Perplexity
- Models: `llama-3.1-sonar-large-128k-online` (default)
- Features: Real-time web search, up-to-date information
- Error handling: Rate limits, authentication

## 🧪 Testing

### Test API Keys
```bash
# Test OpenAI
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}'

# Test Anthropic
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 100, "messages": [{"role": "user", "content": "Hello"}]}'
```

### Test in Application
1. Start the development server: `npm run dev`
2. Navigate to the chat interface
3. Try sending a message with each AI provider
4. Check browser console for any errors

## 🔍 Troubleshooting

### Common Issues

#### "Invalid API key" Error
- ✅ Check if the key is correctly copied (no extra spaces)
- ✅ Verify the key is active in the provider's dashboard
- ✅ Ensure the key has the correct permissions

#### "Rate limit exceeded" Error
- ✅ Wait a few minutes and try again
- ✅ Check your usage limits in the provider's dashboard
- ✅ Consider upgrading your plan if needed

#### "Network error" Error
- ✅ Check your internet connection
- ✅ Verify firewall settings aren't blocking requests
- ✅ Try again in a few minutes

#### "Insufficient funds" Error
- ✅ Add credits to your OpenAI/Anthropic account
- ✅ Check billing information is up to date

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
VITE_DEBUG_AI=true
```

## 📊 Usage Monitoring

### OpenAI
- Dashboard: https://platform.openai.com/usage
- Monitor: Token usage, costs, rate limits

### Anthropic
- Dashboard: https://console.anthropic.com/
- Monitor: Usage, billing, rate limits

### Google
- Dashboard: https://console.cloud.google.com/
- Monitor: API usage, quotas, billing

### Perplexity
- Dashboard: https://www.perplexity.ai/settings/api
- Monitor: Usage, rate limits

## 🔒 Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for all keys**
3. **Rotate keys regularly**
4. **Monitor usage for unusual activity**
5. **Use least-privilege access**
6. **Set up billing alerts**

## 📞 Support

If you encounter issues:

1. **Check this guide first**
2. **Verify API keys are correct**
3. **Test with demo mode enabled**
4. **Check provider status pages**
5. **Contact support if needed**

### Provider Status Pages
- OpenAI: https://status.openai.com/
- Anthropic: https://status.anthropic.com/
- Google: https://status.cloud.google.com/
- Perplexity: https://status.perplexity.ai/

## 🎯 Next Steps

1. **Configure at least one API key** to get started
2. **Test the chat interface** with your configured providers
3. **Add more providers** as needed for redundancy
4. **Monitor usage** to optimize costs
5. **Set up billing alerts** to avoid surprises

Happy AI chatting! 🚀