# Chat Interface Integration Guide

This guide explains the comprehensive chat interface implementation with context management, system prompts, and persistence.

## 🚀 Features Implemented

### 1. Context Management Service
- **Token Counting**: Accurate token estimation for each provider
- **Context Window Management**: Automatic summarization when limits are reached
- **Sliding Window**: Keeps most recent messages within token limits
- **Provider-Specific Limits**: Different limits for OpenAI, Anthropic, Google, Perplexity

### 2. System Prompts Service
- **Role-Specific Prompts**: Optimized prompts for different AI roles
- **Provider Optimization**: Tailored prompts for each LLM provider
- **Caching**: Intelligent caching of prompts for performance
- **Guidelines**: Best practices for each provider

### 3. Chat Persistence Service
- **Session Management**: Persistent chat sessions across navigation
- **Message History**: Complete conversation history
- **Offline Support**: Local storage with server sync
- **Context Preservation**: Maintains context when switching between chats

### 4. Enhanced AI Service
- **Integrated Services**: All services work together seamlessly
- **Error Handling**: Comprehensive error handling and retry logic
- **Provider Support**: Full support for all major LLM providers
- **Performance Optimization**: Efficient context and prompt management

## 📊 Context Window Limits

| Provider | Model | Context Window | Recommended Usage |
|----------|-------|----------------|-------------------|
| OpenAI | GPT-4o-mini | 128,000 tokens | 100,000 tokens |
| OpenAI | GPT-4o | 128,000 tokens | 100,000 tokens |
| OpenAI | GPT-4 | 8,192 tokens | 6,000 tokens |
| Anthropic | Claude 3.5 Sonnet | 200,000 tokens | 150,000 tokens |
| Google | Gemini 2.0 Flash | 1,000,000 tokens | 800,000 tokens |
| Perplexity | Llama 3.1 Sonar | 128,000 tokens | 100,000 tokens |

## 🔧 System Prompt Guidelines

### OpenAI/ChatGPT
- **Max Length**: 2,000 characters
- **Recommended**: 500 characters
- **Key Elements**: Role definition, behavior guidelines, response format
- **Optimization**: Be concise, specific, include examples

### Anthropic/Claude
- **Max Length**: 4,000 characters
- **Recommended**: 800 characters
- **Key Elements**: Role and identity, capabilities, ethical guidelines
- **Optimization**: Be detailed about capabilities, include ethical considerations

### Google/Gemini
- **Max Length**: 3,000 characters
- **Recommended**: 600 characters
- **Key Elements**: Assistant identity, safety measures, multimodal capabilities
- **Optimization**: Include safety instructions, specify multimodal capabilities

### Perplexity
- **Max Length**: 1,500 characters
- **Recommended**: 400 characters
- **Key Elements**: Research focus, citation requirements, accuracy standards
- **Optimization**: Emphasize accuracy, request citations

## 🛠️ Implementation Details

### Context Management
```typescript
// Add message to context
contextManagementService.addMessage(sessionId, {
  role: 'user',
  content: 'Hello!',
  timestamp: new Date()
});

// Get optimized context for API call
const optimizedMessages = contextManagementService.getOptimizedContext(
  sessionId, 
  'openai', 
  'gpt-4o-mini'
);
```

### System Prompts
```typescript
// Get role-specific prompt
const prompt = systemPromptsService.createRolePrompt(
  'Product Manager',
  'openai',
  'Focus on product strategy and roadmap planning.'
);

// Optimize for specific use case
const optimizedPrompt = systemPromptsService.optimizePrompt(
  prompt,
  'technical'
);
```

### Chat Persistence
```typescript
// Create new session
const session = await chatPersistenceService.createSession(
  userId,
  employeeId,
  role,
  provider
);

// Add message
await chatPersistenceService.addMessage(
  sessionId,
  'user',
  'Hello!',
  { metadata: 'additional data' }
);
```

## 🔄 Integration Flow

1. **User sends message**
2. **Context Management**: Add message to context window
3. **System Prompts**: Get optimized prompt for role and provider
4. **AI Service**: Send optimized context to AI provider
5. **Persistence**: Save response to database and local storage
6. **Context Update**: Update context window with response

## 📈 Performance Optimizations

### Token Management
- Automatic summarization when approaching limits
- Sliding window for recent messages
- Provider-specific token counting

### Caching
- System prompt caching (1 hour TTL)
- Context window caching
- Session data caching

### Persistence
- Local storage for offline support
- Server sync every 30 seconds
- Automatic recovery on reconnection

## 🧪 Testing

### Unit Tests
- Context management functions
- System prompt generation
- Persistence operations
- Error handling

### Integration Tests
- Full chat flow
- Provider switching
- Context preservation
- Offline/online transitions

### Performance Tests
- Token counting accuracy
- Memory usage
- Response times
- Cache efficiency

## 🚨 Error Handling

### Context Errors
- Token limit exceeded
- Context corruption
- Memory issues

### Persistence Errors
- Database connection failures
- Local storage quota exceeded
- Sync conflicts

### Provider Errors
- API rate limits
- Authentication failures
- Network issues

## 🔧 Configuration

### Environment Variables
```env
# AI Provider API Keys
VITE_OPENAI_API_KEY=your_key_here
VITE_ANTHROPIC_API_KEY=your_key_here
VITE_GOOGLE_API_KEY=your_key_here
VITE_PERPLEXITY_API_KEY=your_key_here

# Demo Mode
VITE_DEMO_MODE=true

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Service Configuration
```typescript
// Context management settings
const contextConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

// Persistence settings
const persistenceConfig = {
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  cacheSize: 100
};
```

## 📚 Best Practices

### Context Management
1. Monitor token usage regularly
2. Implement proper summarization
3. Use sliding window for efficiency
4. Handle edge cases gracefully

### System Prompts
1. Keep prompts concise and clear
2. Test with different scenarios
3. Optimize for each provider
4. Include safety guidelines

### Persistence
1. Implement offline support
2. Handle sync conflicts
3. Provide user feedback
4. Monitor performance

## 🎯 Next Steps

1. **Monitor Performance**: Track token usage and response times
2. **Optimize Prompts**: Fine-tune prompts based on usage
3. **Add Features**: Implement additional tools and capabilities
4. **Scale**: Handle increased usage and data volume

## 🔍 Troubleshooting

### Common Issues
1. **Context Loss**: Check token limits and summarization
2. **Slow Responses**: Optimize prompts and context
3. **Sync Issues**: Check network and database connection
4. **Memory Issues**: Monitor cache size and cleanup

### Debug Tools
- Context statistics
- Token usage tracking
- Performance metrics
- Error logging

This implementation provides a robust, scalable, and efficient chat interface with comprehensive context management, optimized system prompts, and reliable persistence.
