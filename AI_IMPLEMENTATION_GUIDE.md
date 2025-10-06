# 🤖 Enhanced AI Implementation Guide

## Overview

This guide covers the comprehensive AI implementation for all major providers: **OpenAI (ChatGPT)**, **Anthropic (Claude)**, **Google (Gemini)**, and **Perplexity**. The implementation includes advanced system prompts, streaming support, error handling, and configuration management.

## 🚀 Features Implemented

### ✅ **Core AI Providers**
- **OpenAI (ChatGPT)** - GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- **Anthropic (Claude)** - Claude-3.5-Sonnet, Claude-3.5-Haiku, Claude-3-Opus
- **Google (Gemini)** - Gemini-2.0-Flash, Gemini-2.5-Flash, Gemini-1.5-Pro
- **Perplexity** - Llama-3.1-Sonar models with web search

### ✅ **Advanced Features**
- **Streaming Support** - Real-time response streaming for 3/4 providers
- **System Prompts** - Advanced prompt engineering with role-based templates
- **Error Handling** - Comprehensive retry logic and fallback mechanisms
- **Configuration Management** - Centralized settings and API key management
- **Cost Tracking** - Token usage and cost estimation
- **Demo Mode** - Test without API keys

## 📁 File Structure

```
src/
├── services/
│   ├── enhanced-ai-chat-service-v2.ts    # Main AI service with all providers
│   ├── enhanced-streaming-service.ts     # Streaming implementation
│   └── ai-chat-service.ts                # Legacy service (kept for compatibility)
├── components/
│   └── chat/
│       └── AdvancedChatInterface.tsx     # Enhanced chat UI component
└── pages/
    └── settings/
        └── AIConfigurationPage.tsx        # AI configuration management
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# OpenAI (ChatGPT)
VITE_OPENAI_API_KEY=sk-proj-your_key_here

# Anthropic (Claude)  
VITE_ANTHROPIC_API_KEY=sk-ant-your_key_here

# Google (Gemini)
VITE_GOOGLE_API_KEY=AIzaSy-your_key_here

# Perplexity
VITE_PERPLEXITY_API_KEY=pplx-your_key_here

# Demo Mode (optional)
VITE_DEMO_MODE=true
```

### API Key Setup

#### 1. **OpenAI (ChatGPT)** - Recommended for most use cases
- **Get API Key**: https://platform.openai.com/api-keys
- **Cost**: ~$0.002 per message (GPT-4o-mini)
- **Features**: Streaming, Function Calling, Vision, Code Generation

#### 2. **Google (Gemini)** - Best for free tier
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Cost**: FREE tier available (15 req/min, 1500/day)
- **Features**: Streaming, Vision, Multimodal, Free Tier

#### 3. **Anthropic (Claude)** - Best for analysis and reasoning
- **Get API Key**: https://console.anthropic.com/
- **Cost**: ~$0.003 per message
- **Features**: Streaming, Long Context, Analysis, Safety

#### 4. **Perplexity** - Best for real-time information
- **Get API Key**: https://www.perplexity.ai/settings/api
- **Cost**: ~$0.005 per message
- **Features**: Web Search, Real-time Data, Research, Citations

## 🎯 Usage Examples

### Basic Usage

```typescript
import { sendAIMessage } from '@/services/enhanced-ai-chat-service-v2';

// Simple message
const response = await sendAIMessage(
  'ChatGPT',
  [{ role: 'user', content: 'Hello, how are you?' }]
);

console.log(response.content);
```

### Advanced Configuration

```typescript
import { sendAIMessage } from '@/services/enhanced-ai-chat-service-v2';

// With custom configuration
const response = await sendAIMessage(
  'Claude',
  messages,
  'Senior Developer', // Employee role
  attachments, // Image attachments
  {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are an expert software developer...',
    enableWebSearch: true,
    enableTools: true
  }
);
```

### Streaming Implementation

```typescript
import { streamAIResponse } from '@/services/enhanced-streaming-service';

await streamAIResponse(
  'Gemini',
  messages,
  (chunk) => {
    if (chunk.isComplete) {
      console.log('Stream complete');
    } else {
      console.log('New chunk:', chunk.content);
    }
  },
  {
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    systemPrompt: 'You are a helpful assistant...'
  }
);
```

## 🛠️ System Prompts

### Built-in Templates

The service includes several system prompt templates:

```typescript
import { getSystemPromptTemplates, createCustomSystemPrompt } from '@/services/enhanced-ai-chat-service-v2';

// Get available templates
const templates = getSystemPromptTemplates();

// Create custom prompt
const customPrompt = createCustomSystemPrompt(
  'Data Scientist',
  ['Machine Learning', 'Python', 'Statistics'],
  'analytical'
);
```

### Available Templates

1. **Default** - General-purpose assistant
2. **Employee** - Role-specific expertise
3. **Creative** - Imaginative and innovative solutions
4. **Analytical** - Data-driven insights and logical reasoning

## 🔄 Error Handling & Fallbacks

### Automatic Fallback

The service automatically tries other configured providers if the primary one fails:

```typescript
// If ChatGPT fails, automatically tries Claude, then Gemini
const response = await sendAIMessage('ChatGPT', messages);
```

### Retry Logic

- **Max Retries**: 3 attempts
- **Exponential Backoff**: 1s, 2s, 4s delays
- **Timeout**: 30 seconds per request
- **Rate Limit Handling**: Automatic retry with backoff

### Error Messages

The service provides clear, actionable error messages:

```
❌ OpenAI API key not configured.

✅ Get a FREE key at: https://platform.openai.com/api-keys
📝 Add to .env file: VITE_OPENAI_API_KEY=your_key_here
💡 Or enable demo mode: VITE_DEMO_MODE=true
```

## 📊 Cost Tracking

### Token Usage

Each response includes detailed usage information:

```typescript
const response = await sendAIMessage('ChatGPT', messages);

console.log('Tokens used:', response.usage.totalTokens);
console.log('Estimated cost: $', response.usage.totalTokens * 0.000002);
```

### Cost Estimation

| Provider | Model | Cost per 1K tokens |
|----------|-------|-------------------|
| OpenAI | GPT-4o-mini | $0.002 |
| Anthropic | Claude-3.5-Sonnet | $0.003 |
| Google | Gemini-2.0-Flash | $0.001 |
| Perplexity | Llama-3.1-Sonar | $0.005 |

## 🎭 Demo Mode

Enable demo mode for testing without API keys:

```env
VITE_DEMO_MODE=true
```

Demo mode provides:
- Simulated responses with setup instructions
- All features work without API keys
- Clear guidance on how to configure real APIs

## 🔧 Advanced Configuration

### Model Selection

```typescript
// Get available models for a provider
import { getAvailableModels } from '@/services/enhanced-ai-chat-service-v2';

const openaiModels = getAvailableModels('OpenAI');
// ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
```

### Provider Status

```typescript
// Check if provider is configured
import { isProviderConfigured, getConfiguredProviders } from '@/services/enhanced-ai-chat-service-v2';

const isOpenAIConfigured = isProviderConfigured('OpenAI');
const configuredProviders = getConfiguredProviders();
// ['ChatGPT', 'Claude', 'Gemini']
```

## 🚀 Getting Started

### 1. **Quick Start (Demo Mode)**
```bash
# Add to .env
VITE_DEMO_MODE=true

# Start the app
npm run dev
```

### 2. **Real API Setup**
```bash
# Get a free Google API key
# Visit: https://aistudio.google.com/app/apikey

# Add to .env
VITE_GOOGLE_API_KEY=AIzaSy-your_key_here

# Start the app
npm run dev
```

### 3. **Test the Implementation**
```bash
# Navigate to the chat interface
# Go to /chat or /marketplace
# Start chatting with AI employees
```

## 🔍 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check your `.env` file
   - Ensure the key is correct
   - Restart the development server

2. **"Rate limit exceeded"**
   - Wait a few minutes
   - Check your API usage limits
   - Consider upgrading your plan

3. **"Network error"**
   - Check your internet connection
   - Verify the API endpoint is accessible
   - Check for firewall restrictions

### Debug Mode

Enable detailed logging:

```typescript
// The service automatically logs detailed information
console.log('[AI Service] Attempting to send message via ChatGPT...');
console.log('[AI Service] ✅ Success');
```

## 📈 Performance Optimization

### Streaming Benefits
- **Real-time responses** - Users see text as it's generated
- **Better UX** - No waiting for complete responses
- **Lower perceived latency** - Immediate feedback

### Caching
- **Response caching** - Avoid duplicate API calls
- **Model selection** - Choose optimal models for tasks
- **Fallback chains** - Automatic provider switching

## 🔒 Security Considerations

### API Key Security
- **Never commit API keys** to version control
- **Use environment variables** for all keys
- **Rotate keys regularly** for security
- **Monitor usage** for unusual activity

### Data Privacy
- **No data storage** - Messages aren't permanently stored
- **Secure transmission** - All API calls use HTTPS
- **User consent** - Clear privacy policies

## 🎯 Best Practices

### 1. **System Prompt Design**
- Be specific about the AI's role
- Include context and constraints
- Test different prompt variations
- Use role-based templates

### 2. **Error Handling**
- Always handle API errors gracefully
- Provide fallback options
- Show clear error messages
- Log errors for debugging

### 3. **Cost Management**
- Monitor token usage
- Set usage limits
- Use appropriate models for tasks
- Implement cost alerts

### 4. **User Experience**
- Enable streaming for better UX
- Show loading states
- Provide clear feedback
- Handle edge cases gracefully

## 🚀 Future Enhancements

### Planned Features
- **Usage Analytics** - Detailed usage tracking and insights
- **Custom Models** - Support for fine-tuned models
- **Batch Processing** - Handle multiple requests efficiently
- **Advanced Caching** - Intelligent response caching
- **A/B Testing** - Compare different AI providers
- **Cost Optimization** - Automatic model selection based on cost

### Integration Opportunities
- **Webhook Support** - Real-time notifications
- **API Rate Limiting** - Advanced rate limiting strategies
- **Multi-tenant Support** - Isolated configurations per user
- **Audit Logging** - Comprehensive activity tracking

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the API documentation for each provider
3. Enable demo mode for testing
4. Check the browser console for detailed error messages

**Happy coding with AI! 🤖✨**
