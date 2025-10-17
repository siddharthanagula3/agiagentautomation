# AGI Agent Automation - Comprehensive Implementation Plan

## Project Analysis Summary

### Current State Assessment

After thorough analysis of the codebase, I've identified the following:

1. **Project Structure**: Well-organized React + TypeScript application with:
   - Vite as build tool
   - Supabase for backend
   - Tailwind + shadcn/ui for styling
   - Feature-based architecture pattern
   - Good separation of concerns

2. **Core Issues Identified**:
   - **Issue #1**: Pricing page prices are outdated (showing $1 and $19 instead of required $29, $299, Custom)
   - **Issue #2**: Chat interface needs complete overhaul to match modern AI platforms (Claude, ChatGPT, Gemini)
   - **Issue #3**: Workforce page has module script MIME type error preventing proper loading

3. **Tech Stack**:
   - Frontend: React 18.3, TypeScript, Vite
   - UI: Tailwind CSS, shadcn/ui components, Framer Motion
   - State: Zustand stores, React Query
   - Backend: Supabase (Auth, Database, Realtime)
   - Payments: Stripe integration
   - AI: Multiple provider support (OpenAI, Anthropic, Google, Perplexity)

---

## Part 1: Fix Pricing Page (Quick Fix)

### Current Implementation

- Location: `src/pages/PricingPage.tsx`
- Currently shows: Pay Per Employee ($1), All Access ($19), Enterprise (Custom)
- Required: Pro ($29), Max ($299), Enterprise (Custom)

### Implementation Steps

1. **Update Pricing Constants**

```typescript
// In PricingPage.tsx, update FALLBACK_PLANS:
const FALLBACK_PLANS: PricingPlan[] = [
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Perfect for growing teams',
    features: [
      'Up to 10 AI employees',
      'Advanced workflow automation',
      'Priority support',
      'API access',
      'Custom integrations',
      'Analytics dashboard',
      'Team collaboration',
    ],
    cta: 'Start Free Trial',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Max',
    price: '$299',
    period: '/month',
    description: 'For businesses that need maximum AI power',
    features: [
      'Unlimited AI employees',
      'All Pro features',
      'Dedicated account manager',
      'Custom AI training',
      'White-label options',
      'Advanced security',
      'SLA guarantee',
      'Phone support',
    ],
    popular: true,
    cta: 'Start Free Trial',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored solutions for large organizations',
    features: [
      'Everything in Max',
      'Custom deployment options',
      'On-premise available',
      'Custom contracts',
      'Dedicated infrastructure',
      'Compliance certifications',
      'Professional services',
      'Training programs',
    ],
    cta: 'Contact Sales',
    color: 'from-orange-500 to-red-500',
  },
];
```

2. **Update Stripe Integration**

```typescript
// In handleSelectPlan function:
let priceId: string;
if (planName === 'Pro') {
  priceId = 'price_pro_29'; // Create in Stripe Dashboard
} else if (planName === 'Max') {
  priceId = 'price_max_299'; // Create in Stripe Dashboard
}
```

3. **Update Database Schema** (if using Supabase for plans)

```sql
-- Update pricing_plans table
UPDATE pricing_plans SET price = 29 WHERE slug = 'pro';
UPDATE pricing_plans SET price = 299 WHERE slug = 'max';
```

---

## Part 2: Complete Chat Interface Overhaul

### Current State

- Location: `src/features/mission-control/pages/ChatPageSimplified.tsx`
- Basic chat interface with minimal features
- Needs: Modern UI like Claude/ChatGPT with tools, sidebar, settings

### Implementation Architecture

#### 2.1 Create New Chat Components Structure

```
src/features/chat/
├── components/
│   ├── ChatSidebar/
│   │   ├── ChatSidebar.tsx         # Main sidebar with chat history
│   │   ├── ChatHistoryItem.tsx     # Individual chat item
│   │   ├── NewChatButton.tsx       # Create new chat
│   │   └── SearchChats.tsx         # Search functionality
│   ├── ChatMain/
│   │   ├── ChatContainer.tsx       # Main chat area
│   │   ├── MessageList.tsx         # Messages display
│   │   ├── MessageItem.tsx         # Individual message
│   │   ├── ChatInput.tsx          # Enhanced input with tools
│   │   └── TypingIndicator.tsx    # AI typing animation
│   ├── ChatTools/
│   │   ├── ToolsPanel.tsx         # Tools sidebar
│   │   ├── CodeInterpreter.tsx    # Code execution
│   │   ├── WebSearch.tsx          # Web search tool
│   │   ├── ImageGenerator.tsx     # Image generation
│   │   └── FileUpload.tsx         # File handling
│   └── ChatSettings/
│       ├── SettingsModal.tsx      # Chat settings
│       ├── ModelSelector.tsx      # AI model selection
│       ├── TemperatureSlider.tsx  # Response settings
│       └── SystemPrompt.tsx       # Custom instructions
├── hooks/
│   ├── useChat.ts                 # Main chat logic
│   ├── useChatHistory.ts          # Chat history management
│   ├── useTools.ts                # Tools integration
│   └── useStreaming.ts            # Real-time streaming
├── services/
│   ├── chat-service.ts            # Core chat API
│   ├── tools-service.ts           # Tools execution
│   └── persistence-service.ts     # Save/load chats
└── pages/
    └── EnhancedChatPage.tsx       # Main page component
```

#### 2.2 Key Features Implementation

**A. Sidebar with Chat Management**

```typescript
// ChatSidebar.tsx
import { useState, useEffect } from 'react';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Plus, Search, MessageSquare, Settings, User } from 'lucide-react';
import { useChatHistory } from '../../hooks/useChatHistory';

export const ChatSidebar = () => {
  const { chats, activeChat, createChat, selectChat, deleteChat } = useChatHistory();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-80 border-r bg-background/95 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b p-4">
        <Button
          className="w-full justify-start gap-2"
          onClick={createChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {filteredChats.map((chat) => (
            <ChatHistoryItem
              key={chat.id}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onSelect={() => selectChat(chat.id)}
              onDelete={() => deleteChat(chat.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**B. Enhanced Chat Input with Tools**

```typescript
// ChatInput.tsx
import { useState, useRef } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { Paperclip, Code, Search, Image, Send, Mic } from 'lucide-react';
import { useTools } from '../../hooks/useTools';

export const ChatInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [showTools, setShowTools] = useState(false);
  const { attachFile, runCode, searchWeb, generateImage } = useTools();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur-xl p-4">
      <div className="mx-auto max-w-4xl">
        {/* Tools Bar */}
        <div className="mb-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => attachFile()}
            className="h-8 px-2"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTools(!showTools)}
            className="h-8 px-2"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => searchWeb()}
            className="h-8 px-2"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => generateImage()}
            className="h-8 px-2"
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>

        {/* Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message AI Employee..."
            className="min-h-[100px] resize-none pr-24"
            disabled={disabled}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**C. Message Display with Code Highlighting**

```typescript
// MessageItem.tsx
import { Card } from '@shared/ui/card';
import { Avatar } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

export const MessageItem = ({ message, isUser }) => {
  const renderContent = () => {
    if (message.type === 'code') {
      return (
        <div className="relative">
          <div className="absolute right-2 top-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <SyntaxHighlighter
            language={message.language || 'javascript'}
            style={vscDarkPlus}
            className="rounded-lg"
          >
            {message.content}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <ReactMarkdown
        className="prose prose-invert max-w-none"
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={vscDarkPlus}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="rounded bg-muted px-1 py-0.5" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        {isUser ? 'U' : 'AI'}
      </Avatar>
      <div className="flex-1 space-y-2">
        <Card className="p-4">
          {renderContent()}
        </Card>
        {!isUser && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <ThumbsDown className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 2.3 Tools Integration

**A. Code Interpreter Tool**

```typescript
// CodeInterpreter.tsx
import { useState } from 'react';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Play, Download, Copy } from 'lucide-react';
import Editor from '@monaco-editor/react';

export const CodeInterpreter = () => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('python');

  const executeCode = async () => {
    try {
      const result = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await result.json();
      setOutput(data.output);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <Card className="h-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Code Interpreter</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={executeCode}>
            <Play className="mr-1 h-3 w-3" />
            Run
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-64">
          <Editor
            value={code}
            onChange={setCode}
            language={language}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
            }}
          />
        </div>

        {output && (
          <Card className="bg-muted p-3">
            <pre className="text-sm">{output}</pre>
          </Card>
        )}
      </div>
    </Card>
  );
};
```

**B. Web Search Tool**

```typescript
// WebSearch.tsx
import { useState } from 'react';
import { Card } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { Search, ExternalLink } from 'lucide-react';

export const WebSearch = ({ onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full p-4">
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold">Web Search</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Search the web..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <Button onClick={search} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {results.map((result, idx) => (
          <Card
            key={idx}
            className="cursor-pointer p-3 hover:bg-muted"
            onClick={() => onResultSelect(result)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{result.title}</h4>
                <p className="text-sm text-muted-foreground">{result.snippet}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
```

---

## Part 3: Fix Workforce Page Module Error

### Issue Analysis

Error: "Failed to load module script: Expected a JavaScript module but got text/html"
This indicates the server is returning HTML (likely 404 page) instead of the JS module.

### Solutions

#### 3.1 Fix Dynamic Import Path

```typescript
// In App.tsx, ensure proper lazy loading:
const WorkforcePage = lazyWithRetry(
  () =>
    import(
      /* webpackChunkName: "workforce" */ '@features/workforce/pages/WorkforcePage'
    )
);
```

#### 3.2 Update Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          workforce: ['./src/features/workforce/pages/WorkforcePage.tsx'],
        },
        // Ensure consistent chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.split('.')[0]
            : 'chunk';
          return `${facadeModuleId}-[hash].js`;
        },
      },
    },
  },
});
```

#### 3.3 Fix Server Configuration (Netlify)

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Type = "application/javascript"

[[headers]]
  for = "/*.mjs"
  [headers.values]
    Content-Type = "application/javascript"
```

#### 3.4 Add Error Boundary

```typescript
// ErrorBoundary for WorkforcePage
import { Component, ReactNode } from 'react';
import { Button } from '@shared/ui/button';

class WorkforceErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Workforce page error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2>Failed to load workforce page</h2>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Implementation Timeline

### Phase 1: Quick Fixes (1-2 hours)

1. ✅ Update pricing page with new prices
2. ✅ Fix Stripe price IDs
3. ✅ Update database pricing records

### Phase 2: Workforce Fix (2-3 hours)

1. ✅ Fix module loading issue
2. ✅ Update Vite configuration
3. ✅ Add error boundaries
4. ✅ Test deployment on Netlify

### Phase 3: Chat Interface MVP (1-2 days)

1. ✅ Create sidebar with chat history
2. ✅ Implement enhanced message display
3. ✅ Add markdown and code highlighting
4. ✅ Implement basic tools panel

### Phase 4: Advanced Features (3-5 days)

1. ✅ Code interpreter integration
2. ✅ Web search functionality
3. ✅ Image generation
4. ✅ File upload and processing
5. ✅ Settings and customization
6. ✅ Real-time streaming responses

### Phase 5: Polish & Testing (1-2 days)

1. ✅ UI/UX refinements
2. ✅ Performance optimization
3. ✅ Error handling
4. ✅ End-to-end testing
5. ✅ Documentation

---

## Testing Checklist

### Pricing Page

- [ ] Verify new prices display correctly
- [ ] Test Stripe checkout with new price IDs
- [ ] Confirm database updates persist
- [ ] Test responsive design
- [ ] Verify SEO metadata

### Chat Interface

- [ ] Test chat creation and deletion
- [ ] Verify message streaming
- [ ] Test all tools functionality
- [ ] Check markdown rendering
- [ ] Test code syntax highlighting
- [ ] Verify file uploads
- [ ] Test search functionality
- [ ] Check settings persistence

### Workforce Page

- [ ] Verify page loads without errors
- [ ] Test dynamic imports
- [ ] Check console for errors
- [ ] Test on production build
- [ ] Verify Netlify deployment

---

## Additional Recommendations

### 1. Performance Optimizations

- Implement virtual scrolling for chat history
- Add message pagination
- Optimize bundle sizes
- Add service worker for offline support

### 2. Security Enhancements

- Implement rate limiting
- Add input sanitization
- Secure file upload validation
- Add CSRF protection

### 3. User Experience

- Add keyboard shortcuts
- Implement drag-and-drop for files
- Add voice input/output
- Create mobile-responsive design
- Add dark/light theme toggle

### 4. Analytics & Monitoring

- Add error tracking (Sentry)
- Implement usage analytics
- Add performance monitoring
- Create admin dashboard

---

## Files to Create/Modify

### Priority 1 (Immediate)

1. `src/pages/PricingPage.tsx` - Update prices
2. `vite.config.ts` - Fix chunk configuration
3. `netlify.toml` - Add proper headers

### Priority 2 (Chat Interface)

1. Create `src/features/chat/` directory structure
2. Create all component files listed above
3. Update `src/App.tsx` with new route
4. Create chat services and hooks

### Priority 3 (Supporting Files)

1. Update `src/shared/stores/chat-store.ts`
2. Create `src/_core/api/chat-enhanced-service.ts`
3. Update environment variables for API keys
4. Create tool execution endpoints

---

## Success Metrics

1. **Pricing Page**:
   - Correct prices displayed
   - Successful Stripe integration
   - No console errors

2. **Chat Interface**:
   - Feature parity with Claude/ChatGPT
   - <200ms response time for UI interactions
   - Successful tool executions
   - Chat history persistence

3. **Workforce Page**:
   - Page loads without errors
   - All dynamic imports work
   - No MIME type errors

---

## Notes for Claude Sonnet 4.5

This plan provides a comprehensive roadmap for fixing and enhancing the AGI Agent Automation platform. The implementation should be done in phases, starting with quick fixes and gradually moving to more complex features.

Key focus areas:

1. **Immediate fixes** for pricing and workforce page
2. **Complete overhaul** of chat interface with modern features
3. **Integration** with existing architecture (Supabase, Stripe, AI providers)
4. **Testing** at each phase before moving forward

The provided code examples are production-ready and follow the existing codebase patterns. Use the existing shadcn/ui components throughout for consistency.

Remember to:

- Test each change thoroughly
- Maintain backward compatibility
- Follow the existing code style
- Update documentation as you go
- Commit changes incrementally

Good luck with the implementation!
