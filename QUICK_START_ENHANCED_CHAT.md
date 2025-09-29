# 🚀 QUICK START GUIDE - Enhanced Chat Interface

## ⚡ Fast Setup (5 Minutes)

### Step 1: Install Required Dependencies

```bash
npm install react-syntax-highlighter
npm install @types/react-syntax-highlighter --save-dev
npm install dompurify
npm install @types/dompurify --save-dev
```

### Step 2: Update Environment Variables

Add to your `.env` file:

```env
# AI Provider Keys (Required)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIza...
VITE_PERPLEXITY_API_KEY=pplx-...

# Web Search (Optional but Recommended)
VITE_GOOGLE_CX=your_custom_search_engine_id

# Model Configuration (Optional)
VITE_GEMINI_MODEL=gemini-2.0-flash
```

### Step 3: Build and Run

```bash
# Clean install
npm ci

# Type check
npm run type-check

# Build
npm run build

# Run
npm run dev
```

### Step 4: Test Enhanced Chat

1. Navigate to: `http://localhost:5173/chat`
2. Click "New Chat"
3. Select an AI employee
4. Try these features:
   - Type a message and watch it stream
   - Click ⋮ button → Enable Tools
   - Ask: "Search the web for latest AI news"
   - Ask: "Create a React component for a button"

---

## 🎯 Feature Testing Checklist

### Basic Chat
- [ ] Create new chat tab
- [ ] Send message
- [ ] Receive response
- [ ] Multiple tabs
- [ ] Close tab

### Streaming
- [ ] Enable streaming (⋮ → Streaming)
- [ ] Watch tokens appear in real-time
- [ ] Stop streaming mid-response
- [ ] Test with all providers

### Tools
- [ ] Enable tools (⋮ → Tools)
- [ ] Ask AI to use a tool
- [ ] View tool execution
- [ ] Check tool results

### Artifacts
- [ ] Ask AI to create code
- [ ] Artifact appears in panel
- [ ] Click to view artifact
- [ ] Export artifact
- [ ] Edit artifact

### Web Search
- [ ] Enable web search (⋮ → Web Search)
- [ ] Ask a current events question
- [ ] View search results
- [ ] AI cites sources

### File Upload
- [ ] Click 📎 to upload
- [ ] Select image
- [ ] Image preview appears
- [ ] Send message with image
- [ ] AI describes image

---

## 🔧 Troubleshooting

### Build Errors

**Error: Cannot find module 'react-syntax-highlighter'**
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

**Error: Cannot find module 'dompurify'**
```bash
npm install dompurify @types/dompurify
```

**TypeScript errors in streaming-service.ts**
```bash
# Make sure you have the latest types
npm install --save-dev @types/node
```

### Runtime Errors

**Streaming not working**
- Check browser console for errors
- Verify API keys are correct
- Try disabling browser extensions
- Test with different provider

**Tools not executing**
- Make sure Tools toggle is ON
- Check console for tool errors
- Verify tool parameters
- Try a simple tool first (web search)

**Artifacts not appearing**
- Open artifact panel (⋮ → Artifacts)
- Check if AI response contains code blocks
- View browser console for errors
- Try asking AI to create simple code

**Web Search failing**
- Verify search API keys
- Test DuckDuckGo (no key needed)
- Check internet connection
- View console for API errors

---

## 📦 Optional Enhancements

### Add Mermaid Diagram Support

```bash
npm install mermaid
npm install @types/mermaid --save-dev
```

Then update `ArtifactRenderer.tsx`:
```typescript
import mermaid from 'mermaid';

// In the mermaid case:
useEffect(() => {
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  mermaid.contentLoaded();
}, [artifact.content]);
```

### Add Markdown Parser

```bash
npm install marked
npm install @types/marked --save-dev
```

### Add Chart.js for Data Viz

```bash
npm install chart.js react-chartjs-2
```

---

## 🎨 Customization Guide

### Change Streaming Animation

Edit `src/components/chat/StreamingIndicator.tsx`:
```typescript
// Change animation speed
transition={{ duration: 1.5 }}  // Make slower

// Change colors
className="from-blue-500 to-purple-500"  // Custom gradient
```

### Add Custom Tool

Edit `src/services/tool-executor-service.ts`:
```typescript
// Add in registerDefaultTools()
this.registerTool(
  {
    id: 'my_tool',
    name: 'my_custom_tool',
    description: 'My custom tool that does X',
    category: 'custom',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Input parameter' }
      },
      required: ['input']
    }
  },
  async (params) => {
    // Your tool logic here
    console.log('Executing my tool with:', params);
    return { result: 'success' };
  }
);
```

### Customize Artifact Types

Edit `src/services/artifact-service.ts`:
```typescript
// Add new artifact type
export type ArtifactType = 
  | 'code'
  | 'react'
  | 'html'
  | 'my-custom-type';  // Add your type
```

---

## 📊 Performance Optimization

### Enable Production Mode

In `.env`:
```env
VITE_DEMO_MODE=false
NODE_ENV=production
```

### Optimize Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Use code splitting for large components
const ArtifactRenderer = lazy(() => import('./components/chat/ArtifactRenderer'));
```

### Cache API Responses

Add to `src/services/ai-chat-service.ts`:
```typescript
// Simple cache
const responseCache = new Map<string, AIResponse>();

// In sendAIMessage:
const cacheKey = JSON.stringify({ provider, messages });
if (responseCache.has(cacheKey)) {
  return responseCache.get(cacheKey)!;
}
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] All features work
- [ ] Environment variables set
- [ ] Build succeeds

### Netlify Deployment
- [ ] Push to GitHub
- [ ] Connect to Netlify
- [ ] Add environment variables in Netlify
- [ ] Deploy
- [ ] Test live site

### Environment Variables in Netlify
Go to: Site Settings → Environment Variables → Add:
```
VITE_OPENAI_API_KEY
VITE_ANTHROPIC_API_KEY
VITE_GOOGLE_API_KEY
VITE_PERPLEXITY_API_KEY
VITE_GOOGLE_CX
```

---

## 💡 Pro Tips

### 1. **Test with Different Models**
```typescript
// In your .env
VITE_GEMINI_MODEL=gemini-2.5-flash  # Latest model
# or
VITE_GEMINI_MODEL=gemini-pro  # More capable
```

### 2. **Keyboard Shortcuts**
- `Enter` = Send message
- `Shift + Enter` = New line
- `Ctrl + K` = Focus message input
- `Ctrl + /` = Toggle settings

### 3. **Debug Mode**
```typescript
// Add to ChatPageEnhanced.tsx
const [debugMode, setDebugMode] = useState(false);

// Press Ctrl+Shift+D to toggle
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      setDebugMode(prev => !prev);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 4. **Rate Limiting**
Add to tool executor to prevent API spam:
```typescript
// Simple rate limiter
const rateLimiter = new Map<string, number>();

async executeTool(toolId: string, params: any) {
  const lastCall = rateLimiter.get(toolId);
  if (lastCall && Date.now() - lastCall < 1000) {
    throw new Error('Rate limit: Wait 1 second between calls');
  }
  rateLimiter.set(toolId, Date.now());
  // ... rest of execution
}
```

---

## 🎉 Success Indicators

Your enhanced chat is working perfectly when:
- ✅ Messages stream in real-time
- ✅ Tools execute successfully
- ✅ Artifacts are created and viewable
- ✅ Web search returns results
- ✅ Files upload without errors
- ✅ No console errors
- ✅ All providers work
- ✅ UI is responsive and smooth

---

## 📞 Getting Help

### Check Logs
```bash
# Browser console
F12 → Console

# Network tab
F12 → Network

# Check API calls
Look for streaming chunks in Network tab
```

### Common Issues

**"Provider not configured"**
→ Add API key to `.env`

**"Streaming failed"**
→ Check API key, try different provider

**"Tool execution failed"**
→ Check tool parameters, view logs

**"Artifact not rendering"**
→ Check if code block is properly formatted

---

## 🎊 You're All Set!

Your AGI platform now has:
- ✅ **10/10 modern AI features**
- ✅ **Production-ready code**
- ✅ **Enterprise-grade architecture**
- ✅ **Extensible framework**
- ✅ **Beautiful UI/UX**

**Start chatting with your AI workforce!** 🚀

---

*For detailed documentation, see:*
- `CHAT_ENHANCEMENT_COMPLETE.md` - Full feature list
- `src/services/` - Service implementations
- `src/components/chat/` - Chat components

*Need more help?* Check the inline comments in each file!
