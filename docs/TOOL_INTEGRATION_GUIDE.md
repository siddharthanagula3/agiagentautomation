# Unified Tool Integration System - Complete Guide

## Overview

The Unified Tool Integration System automatically detects user intent and routes requests to the appropriate tools (image generation, video generation, document creation, web search, multi-agent collaboration, code generation) in the `/chat` interface.

## Architecture

### 1. Tool Router (`chat-tool-router.ts`)

**Location:** `/src/features/chat/services/chat-tool-router.ts`

**Core Functions:**

#### `analyzeMessage(message: string): ToolDetectionResult`

Analyzes user messages to detect which tools are needed.

```typescript
const detection = analyzeMessage('Generate an image of a sunset');
// Returns: {
//   tools: ['image-generation'],
//   confidence: 100,
//   reasoning: 'Image generation keywords detected',
//   suggestedRoute: undefined
// }
```

**Detection Logic:**

- **Image Generation**: Keywords like "generate image", "create picture", "draw", "visualize"
- **Video Generation**: Keywords like "generate video", "create video", "animate", "video of"
- **Document Creation**: Keywords like "create document", "write report", "generate pdf"
- **Web Search**: Keywords like "search for", "latest", "current", "what happened"
- **Multi-Agent**: Complex tasks with multiple domains or long requirements
- **Code Generation**: Keywords like "write code", "implement", "function", "component"

#### `routeAndExecuteTools(message: string, options): Promise<ToolRouterResult>`

Executes detected tools and returns results.

```typescript
const result = await chatToolRouter.routeAndExecuteTools(
  "Generate an image of a mountain landscape",
  {
    userId: 'user-123',
    sessionId: 'session-456',
    conversationHistory: [...],
    onProgress: (toolType, status, progress) => {
      console.log(`${toolType}: ${status} (${progress}%)`);
    }
  }
);
```

**Returns:**

```typescript
{
  detectedTools: ['image-generation'],
  executionResults: [{
    toolType: 'image-generation',
    status: 'success',
    data: MediaGenerationResult,
    metadata: {
      tokensUsed: 100,
      cost: 0.002
    }
  }],
  reasoning: 'Image generation keywords detected',
  suggestedRoute: undefined,
  shouldContinueToLLM: false,
  enhancedContext: '...'
}
```

### 2. Updated Chat Hook (`use-chat-interface.ts`)

**Integration Flow:**

1. **User sends message** → Create user message
2. **Tool Router Analysis** → Detect required tools
3. **Tool Execution** → Execute tools in parallel with progress tracking
4. **Display Results** → Show images, videos, documents, search results
5. **LLM Processing** → If needed, enhance with tool context
6. **Final Response** → Display AI response with tool results

**New State:**

```typescript
const {
  messages,
  isLoading,
  activeTools, // NEW: Currently executing tools
  toolProgress, // NEW: Progress for each tool
  sendMessage,
  // ... other methods
} = useChat(sessionId);
```

### 3. Message Display (`MessageBubble.tsx`)

**Tool Result Display:**

#### Image Generation Results

```tsx
{
  message.metadata?.toolType === 'image-generation' && (
    <div className="rounded-lg border bg-card p-4">
      <img src={imageUrl} alt="Generated image" />
      <Button onClick={downloadImage}>Download</Button>
    </div>
  );
}
```

#### Video Generation Results

```tsx
{
  message.metadata?.toolType === 'video-generation' && (
    <div className="rounded-lg border bg-card p-4">
      <video src={videoUrl} controls poster={thumbnailUrl} />
      <Button onClick={downloadVideo}>Download</Button>
    </div>
  );
}
```

#### Document Generation Results

- Already handled by existing `isDocument` logic
- Displays markdown content with export options

#### Web Search Results

- Already handled by existing `SearchResults` component
- Shows search results with AI-generated summary

### 4. Tool Progress Indicator (`ToolProgressIndicator.tsx`)

**Real-time feedback component:**

```tsx
<ToolProgressIndicator
  activeTools={['image-generation', 'web-search']}
  toolProgress={{
    'image-generation': { status: 'Generating image...', progress: 75 },
    'web-search': { status: 'Searching the web...', progress: undefined },
  }}
/>
```

**Features:**

- Shows active tools with icons
- Displays progress bars for supported tools (image/video generation)
- Updates in real-time during execution

## Usage Examples

### Example 1: Image Generation

**User Input:**

```
Generate a realistic image of a sunset over mountains in 16:9 aspect ratio
```

**System Behavior:**

1. Tool Router detects `image-generation`
2. Parses aspect ratio from message (16:9)
3. Calls Google Imagen API
4. Displays generated image with download option
5. Does NOT continue to LLM (no additional response needed)

### Example 2: Video Generation

**User Input:**

```
Create a 10 second cinematic video of waves crashing on a beach
```

**System Behavior:**

1. Tool Router detects `video-generation`
2. Parses duration (10s) and style (cinematic)
3. Calls Google Veo API
4. Shows progress bar during generation
5. Displays video player with download option

### Example 3: Document Creation

**User Input:**

```
Write a comprehensive report on AI safety with sections on ethics, risks, and regulations
```

**System Behavior:**

1. Tool Router detects `document-creation`
2. Parses document type (report) and sections
3. Uses Claude to generate structured document
4. Displays formatted markdown with export option
5. Does NOT continue to LLM

### Example 4: Web Search + Analysis

**User Input:**

```
What are the latest developments in quantum computing this week?
```

**System Behavior:**

1. Tool Router detects `web-search` (keyword: "latest")
2. Performs web search
3. Displays search results
4. CONTINUES to LLM with enhanced context
5. AI synthesizes search results into comprehensive answer

### Example 5: Multi-Tool Request

**User Input:**

```
Search for the latest AI art trends and generate an image based on what you find
```

**System Behavior:**

1. Tool Router detects `web-search` + `image-generation`
2. Executes web search first
3. Uses search results to enhance image prompt
4. Generates image based on trends
5. Displays both search results and generated image
6. LLM provides contextual explanation

### Example 6: Code Generation (Suggestion)

**User Input:**

```
Write a React component for a user profile card
```

**System Behavior:**

1. Tool Router detects `code-generation`
2. Shows toast suggestion: "For better code generation experience, try /vibe"
3. CONTINUES to LLM (can still handle in chat)
4. AI generates code with syntax highlighting

### Example 7: Complex Multi-Agent Task

**User Input:**

```
Build a complete authentication system with frontend, backend, database schema, and security best practices
```

**System Behavior:**

1. Tool Router detects `multi-agent` (complex, multiple domains)
2. Shows toast suggestion: "For complex multi-step tasks, try Mission Control"
3. CONTINUES to multi-agent collaboration service
4. Multiple AI employees collaborate
5. Shows collaboration messages
6. Supervisor synthesizes final comprehensive answer

## Configuration

### Enable/Disable Tools

Check tool availability:

```typescript
import { chatToolRouter } from '@features/chat/services/chat-tool-router';

const status = chatToolRouter.getToolStatus();
// Returns: {
//   'image-generation': true,
//   'video-generation': true,
//   'document-creation': true,
//   'web-search': true,
//   'multi-agent': true,
//   'code-generation': true,
//   'general-chat': true
// }
```

### Environment Variables

**Required for Image/Video Generation:**

```bash
VITE_GOOGLE_API_KEY=your_google_api_key
```

**Optional for Enhanced Web Search:**

```bash
VITE_PERPLEXITY_API_KEY=your_perplexity_key
VITE_GOOGLE_CX=your_google_custom_search_engine_id
```

**Server-Side LLM Proxies (Netlify Functions):**

```bash
# Primary Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...

# Additional Providers
GROK_API_KEY=xai-...
DEEPSEEK_API_KEY=...
QWEN_API_KEY=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Authentication
SUPABASE_SERVICE_ROLE_KEY=...
```

**Demo Mode (No API Keys):**

```bash
VITE_DEMO_MODE=true
```

## Tool Customization

### Adding a New Tool

1. **Update ToolType:**

```typescript
// chat-tool-router.ts
export type ToolType = 'image-generation' | 'video-generation' | 'new-tool'; // Add here
```

2. **Add Detection Logic:**

```typescript
// In analyzeMessage()
const newToolKeywords = ['keyword1', 'keyword2'];
const hasNewToolRequest = newToolKeywords.some((k) => messageLower.includes(k));
if (hasNewToolRequest) {
  detectedTools.push('new-tool');
  confidence += 20;
  reasons.push('New tool detected');
}
```

3. **Add Execution Logic:**

```typescript
// In routeAndExecuteTools()
case 'new-tool':
  const result = await executeNewTool(message, options);
  executionResults.push(result);
  break;
```

4. **Add UI Display:**

```typescript
// In MessageBubble.tsx
{message.metadata?.toolType === 'new-tool' && (
  <div className="mt-3 w-full">
    <NewToolResultDisplay data={message.metadata.newToolData} />
  </div>
)}
```

### Customizing Detection Keywords

Edit keyword lists in `analyzeMessage()`:

```typescript
const imageKeywords = [
  'generate image',
  'create picture',
  'my custom keyword', // Add custom keywords
];
```

### Adjusting Confidence Thresholds

```typescript
// Higher confidence = more specific detection
if (hasImageRequest) {
  detectedTools.push('image-generation');
  confidence += 50; // Increase for higher priority
}
```

## Error Handling

### Tool Execution Failures

Tools handle errors gracefully:

```typescript
try {
  const result = await executeImageGeneration(message);
  return { toolType: 'image-generation', status: 'success', data: result };
} catch (error) {
  return {
    toolType: 'image-generation',
    status: 'failed',
    error: error.message,
  };
}
```

**User Experience:**

- Failed tools show error toast
- Chat continues to LLM for fallback response
- User can retry or rephrase request

### API Key Missing

If API keys are not configured:

```typescript
throw new Error(
  'Google Imagen service not configured.\n\n' +
    '✅ Get a FREE key at: https://aistudio.google.com/app/apikey\n' +
    '📝 Add to .env file: VITE_GOOGLE_API_KEY=your_key_here\n' +
    '💡 Or enable demo mode: VITE_DEMO_MODE=true'
);
```

## Performance Optimization

### Parallel Tool Execution

Tools execute in parallel when multiple are detected:

```typescript
const results = await Promise.all([
  executeImageGeneration(message),
  executeWebSearch(message),
]);
```

### Progress Callbacks

Real-time progress updates:

```typescript
onProgress: (toolType, status, progress) => {
  // Update UI immediately
  setToolProgress((prev) => ({
    ...prev,
    [toolType]: { status, progress },
  }));
};
```

### Caching

- Search results cached for 15 minutes
- Employee prompts cached for 1 hour
- Image/video results stored in generation history

## Testing

### Test Tool Detection

```typescript
import { analyzeMessage } from '@features/chat/services/chat-tool-router';

describe('Tool Router', () => {
  it('detects image generation', () => {
    const result = analyzeMessage('Generate an image of a cat');
    expect(result.tools).toContain('image-generation');
  });

  it('detects multiple tools', () => {
    const result = analyzeMessage(
      'Search for AI art trends and generate an image'
    );
    expect(result.tools).toContain('web-search');
    expect(result.tools).toContain('image-generation');
  });
});
```

### Test Tool Execution

```typescript
import { routeAndExecuteTools } from '@features/chat/services/chat-tool-router';

describe('Tool Execution', () => {
  it('executes image generation', async () => {
    const result = await routeAndExecuteTools('Generate an image of a sunset', {
      userId: 'test-user',
      sessionId: 'test-session',
    });

    expect(result.executionResults[0].status).toBe('success');
    expect(result.executionResults[0].toolType).toBe('image-generation');
  });
});
```

## Debugging

### Enable Debug Logging

Tool router logs to console:

```typescript
console.log('[ToolRouter] Execution completed', {
  detectedTools: detection.tools,
  executedTools: executionResults.length,
  successful: successfulResults.length,
});
```

### Browser DevTools

Monitor tool execution in real-time:

1. Open DevTools Console
2. Look for `[ToolRouter]` prefix
3. Check execution times and results

### Common Issues

**Issue:** Tool not detected

- **Solution:** Check keyword matching in `analyzeMessage()`
- **Debug:** Log `detection.tools` and `detection.reasoning`

**Issue:** Tool execution fails

- **Solution:** Check API keys in `.env`
- **Debug:** Check error message in execution result

**Issue:** UI not updating

- **Solution:** Check `toolProgress` state updates
- **Debug:** Log `activeTools` and `toolProgress` in ChatInterface

## Best Practices

1. **Always provide user feedback**: Use progress indicators for long-running tools
2. **Handle errors gracefully**: Show clear error messages and fallback options
3. **Optimize for speed**: Execute tools in parallel when possible
4. **Cache results**: Avoid redundant API calls
5. **Test thoroughly**: Test all tool combinations and edge cases
6. **Monitor usage**: Track token usage and costs per tool
7. **Update regularly**: Keep detection keywords current with user patterns

## API Reference

### `chatToolRouter.analyzeMessage(message: string)`

Analyzes a message and returns detected tools.

### `chatToolRouter.routeAndExecuteTools(message, options)`

Executes detected tools and returns results.

### `chatToolRouter.isToolAvailable(toolType)`

Checks if a specific tool is available.

### `chatToolRouter.getToolStatus()`

Returns availability status for all tools.

## Support

For issues or questions:

1. Check console logs for errors
2. Verify API keys are configured
3. Test with simple requests first
4. Review this guide for examples

## Changelog

**v1.1.0 (Jan 2026)**

- Added DeepSeek and Qwen LLM provider support
- Enhanced CORS validation with origin whitelist (no wildcard)
- JWT verification via Supabase `auth.getUser()` in rate limiter
- Token enforcement with pre-flight balance checks
- Employee memory system integration for context-aware responses
- Improved security headers in Netlify functions

**v1.0.0 (Jan 2026)**

- Initial unified tool integration system
- Support for 7 tool types
- Real-time progress indicators
- Multi-tool request handling
- Automatic route suggestions
