# AI API Setup Guide

This guide will help you configure the AI APIs for the AGI Workforce application.

## Quick Setup (Demo Mode)

If you want to test the application without setting up API keys, you can enable demo mode:

1. Create a `.env` file in the root directory
2. Add this line: `VITE_DEMO_MODE=true`
3. Restart the development server

## Full API Setup

### 1. Create Environment File

Create a `.env` file in the root directory with the following structure:

```env
# AI API Keys Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Demo Mode (set to true to use mock responses when API keys are not configured)
VITE_DEMO_MODE=false

# Gemini Model Override (optional)
VITE_GEMINI_MODEL=gemini-2.0-flash
```

### 2. Get API Keys

#### OpenAI (ChatGPT)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file as `VITE_OPENAI_API_KEY`

#### Anthropic (Claude)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file as `VITE_ANTHROPIC_API_KEY`

#### Google (Gemini)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file as `VITE_GOOGLE_API_KEY`

#### Perplexity (Optional)
1. Go to [Perplexity Settings](https://www.perplexity.ai/settings/api)
2. Sign up or log in
3. Generate an API key
4. Copy the key and add it to your `.env` file as `VITE_PERPLEXITY_API_KEY`

### 3. Restart Development Server

After adding your API keys:

```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **"API key not configured" errors**
   - Make sure your `.env` file is in the root directory
   - Check that the variable names match exactly (including VITE_ prefix)
   - Restart the development server after making changes

2. **"Failed to fetch" errors**
   - Check your internet connection
   - Verify your API keys are valid
   - Check if you have sufficient credits/quota

3. **Rate limit errors**
   - Wait a few minutes and try again
   - Consider upgrading your API plan

### Demo Mode

If you don't want to set up API keys immediately, you can enable demo mode:

```env
VITE_DEMO_MODE=true
```

This will show mock responses instead of making real API calls.

## Cost Information

- **OpenAI**: Pay-per-use, typically $0.01-0.06 per 1K tokens
- **Anthropic**: Pay-per-use, typically $0.003-0.015 per 1K tokens  
- **Google**: Free tier available, then pay-per-use
- **Perplexity**: Pay-per-use, typically $0.20 per 1M tokens

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure
- Monitor your usage to avoid unexpected charges
- Consider setting usage limits in your API provider dashboards
