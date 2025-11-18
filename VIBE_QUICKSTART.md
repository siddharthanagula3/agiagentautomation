# Vibe Dashboard - Quick Start Guide

## Overview

The Vibe dashboard is a modern AI development environment with three main panels:
1. **Chat Panel** (left) - Interact with AI agents
2. **Code Editor** (top right) - View and edit code with Monaco Editor
3. **Live Preview** (bottom right) - See real-time application previews

## Component Hierarchy

```
VibeDashboard
├── VibeLayout (wrapper)
├── Header (gradient header with logo)
├── Main Content (resizable panels)
│   ├── SimpleChatPanel (left 30%)
│   │   ├── Header
│   │   ├── ScrollArea (messages)
│   │   │   └── MessageBubble[] (user + agent messages)
│   │   └── Empty State
│   │
│   ├── CodeEditorPanel (top right 60% of 70%)
│   │   ├── FileTreeSidebar (collapsible)
│   │   │   └── FileTreeItem[] (recursive tree)
│   │   ├── FileTabs
│   │   ├── Toolbar (copy, download)
│   │   └── MonacoEditor
│   │
│   └── LivePreviewPanel (bottom right 40% of 70%)
│       ├── Toolbar (viewport selector, refresh, URL input)
│       ├── PreviewArea (iframe)
│       └── ConsolePanel (toggleable)
│           └── ConsoleMessageRow[]
│
└── VibeMessageInput (fixed bottom)
```

## File Structure

```
src/features/vibe/
├── pages/
│   └── VibeDashboard.tsx              # Main dashboard (redesigned)
├── components/
│   ├── redesign/                       # NEW: Redesigned components
│   │   ├── SimpleChatPanel.tsx        # Chat interface
│   │   ├── CodeEditorPanel.tsx        # Code editor
│   │   └── LivePreviewPanel.tsx       # Live preview
│   ├── input/
│   │   └── VibeMessageInput.tsx       # Message input (existing)
│   └── agent-panel/                    # Old components (still used for types)
│       ├── AgentStatusCard.tsx
│       ├── AgentMessageList.tsx
│       └── WorkingProcessSection.tsx
├── stores/
│   ├── vibe-chat-store.ts             # Chat session state
│   └── vibe-view-store.ts             # File tree, editor, preview state
└── services/
    └── vibe-message-service.ts        # Message persistence
```

## Key Features

### 1. Chat Interface

**Location:** Left panel (30% width)

**Usage:**
```typescript
<SimpleChatPanel
  messages={messages}      // Array of AgentMessage
  isLoading={isLoading}   // Boolean for loading state
/>
```

**Message Types:**
- `user` - User messages (blue, right-aligned)
- `assistant` - Agent messages (purple, left-aligned with markdown)
- `system` - System messages (gray)

**Features:**
- Auto-scroll to latest message
- Markdown rendering with code syntax highlighting
- Agent name/role badges
- Streaming message support

### 2. Code Editor

**Location:** Top right panel (60% of right side)

**Features:**
- Monaco Editor (VS Code engine)
- File tree sidebar (collapsible)
- Multiple file tabs
- Syntax highlighting for 20+ languages
- Copy and download actions

**Keyboard Shortcuts:**
- `Cmd/Ctrl + S` - Save file (coming soon)
- `Cmd/Ctrl + F` - Find in file
- `Cmd/Ctrl + P` - Quick file open (coming soon)

**Supported Languages:**
Auto-detected by file extension:
- `.ts/.tsx` → TypeScript
- `.js/.jsx` → JavaScript
- `.py` → Python
- `.html` → HTML
- `.css/.scss` → CSS
- `.json` → JSON
- `.md` → Markdown
- And more...

### 3. Live Preview

**Location:** Bottom right panel (40% of right side)

**Features:**
- Sandboxed iframe for security
- Viewport controls (Desktop/Tablet/Mobile)
- Custom URL loading
- Refresh and open external
- Console output panel

**Viewport Sizes:**
- Desktop: 100% × 100%
- Tablet: 768px × 1024px
- Mobile: 375px × 667px

**Console Panel:**
- Toggle with "Console" button
- Categorized messages (log, info, warn, error)
- Timestamp for each message
- Clear console button

## State Management

### Vibe View Store

```typescript
import { useVibeViewStore } from '../stores/vibe-view-store';

// Editor state
const { editorState, openFile, closeFile, setCurrentFile } = useVibeViewStore();

// File tree
const fileTree = useVibeViewStore((state) => state.fileTree);

// App viewer
const { appViewerState, setAppViewerUrl, setViewport } = useVibeViewStore();
```

### Vibe Chat Store

```typescript
import { useVibeChatStore } from '../stores/vibe-chat-store';

const { currentSessionId, setCurrentSession } = useVibeChatStore();
```

## Customization

### Adjusting Panel Sizes

**Default sizes:**
- Left panel: 30% (min: 25%, max: 40%)
- Right panel: 70%
  - Code editor: 60% (min: 40%, max: 80%)
  - Live preview: 40% (min: 20%, max: 60%)

**Change defaults** in `VibeDashboard.tsx`:
```typescript
<Panel defaultSize={30} minSize={25} maxSize={40}>
  {/* Adjust defaultSize, minSize, maxSize */}
</Panel>
```

### Changing Editor Theme

**Current:** `vs-dark` (Visual Studio Dark)

**Change** in `CodeEditorPanel.tsx`:
```typescript
<Editor
  theme="vs-dark"  // Options: 'vs-dark', 'vs-light', 'hc-black'
  // ... other props
/>
```

### Customizing Console Colors

**Edit** in `LivePreviewPanel.tsx`:
```typescript
const iconMap = {
  log: { icon: '>', color: 'text-gray-400' },
  info: { icon: 'ℹ', color: 'text-blue-400' },
  warn: { icon: '⚠', color: 'text-yellow-400' },
  error: { icon: '✕', color: 'text-red-400' },
};
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Navigate to /vibe
# http://localhost:5173/vibe
```

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

### Debugging

**Console Logs:**
```typescript
// Check store state
console.log(useVibeViewStore.getState());

// Check messages
console.log(messages);

// Check file tree
console.log(fileTree);
```

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state
- Track re-renders

## Responsive Behavior

### Desktop (≥768px)
- Three-panel layout with resizable dividers
- Full Monaco Editor with file tree
- All features visible

### Mobile (<768px)
- Vertical stack layout
- Equal height panels (33% each)
- File tree hidden by default (toggle button)
- Simplified viewport controls

## Common Tasks

### Opening a File

```typescript
import { useVibeViewStore } from '../stores/vibe-view-store';

const openFile = useVibeViewStore((state) => state.openFile);

// Open file programmatically
openFile(
  '/path/to/file.ts',  // File path
  'const x = 1;',      // Content
  'typescript'         // Language
);
```

### Loading a Preview URL

```typescript
import { useVibeViewStore } from '../stores/vibe-view-store';

const setAppViewerUrl = useVibeViewStore((state) => state.setAppViewerUrl);

// Load preview
setAppViewerUrl('http://localhost:3000');
```

### Adding Console Messages

```typescript
// Send postMessage from preview iframe
window.parent.postMessage({
  type: 'console',
  level: 'log',  // 'log' | 'info' | 'warn' | 'error'
  message: 'Your message here'
}, '*');
```

### Creating New Files

```typescript
import { useVibeViewStore } from '../stores/vibe-view-store';

const { setFileTree, openFile } = useVibeViewStore();

// Add to file tree
const newTree = [...fileTree, {
  id: crypto.randomUUID(),
  name: 'new-file.ts',
  type: 'file',
  path: '/src/new-file.ts'
}];
setFileTree(newTree);

// Open in editor
openFile('/src/new-file.ts', '', 'typescript');
```

## Troubleshooting

### Monaco Editor Not Loading

**Issue:** White screen or "Loading..." forever

**Solution:**
```bash
# Reinstall Monaco Editor
npm install @monaco-editor/react@latest

# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### Preview Not Loading

**Issue:** Iframe shows "Failed to load"

**Solution:**
- Check URL is valid and accessible
- Check CORS headers if loading external site
- Check browser console for errors
- Try opening URL in new tab first

### File Tree Not Showing

**Issue:** "No files yet" even after creating files

**Solution:**
```typescript
// Ensure files are added to store
const { setFileTree } = useVibeViewStore();
setFileTree([/* your file tree */]);

// Or check if fileTree is populated
console.log(useVibeViewStore.getState().fileTree);
```

### Messages Not Appearing

**Issue:** Chat shows empty even after sending message

**Solution:**
- Check `messages` array is being passed to `SimpleChatPanel`
- Verify message format matches `AgentMessage` type
- Check browser console for errors
- Verify Supabase subscription is connected

## Performance Tips

1. **Lazy load large files:** Only load file content when opened
2. **Debounce editor changes:** Don't save on every keystroke
3. **Limit console messages:** Keep last 100 messages only
4. **Optimize file tree:** Virtualize if >1000 files
5. **Memoize components:** Use `React.memo` for heavy components

## Security Notes

### Iframe Sandbox

The preview iframe uses these sandbox permissions:
- `allow-scripts` - JavaScript execution
- `allow-same-origin` - Same-origin requests
- `allow-forms` - Form submissions
- `allow-popups` - Popup windows
- `allow-modals` - Modal dialogs

**Never add:**
- `allow-top-navigation` - Could redirect parent page
- `allow-pointer-lock` - Security risk

### XSS Prevention

- All user messages sanitized via ReactMarkdown
- Code blocks use syntax highlighter (no execution)
- Preview URLs validated before loading

## Next Steps

1. **Explore the code:** Start in `VibeDashboard.tsx`
2. **Try the features:** Send a message, open files, load preview
3. **Customize:** Adjust colors, sizes, and behavior
4. **Extend:** Add new features (see VIBE_REDESIGN_SUMMARY.md)

## Support

- **Documentation:** See VIBE_REDESIGN_SUMMARY.md
- **Code examples:** Check component source code
- **Issues:** Check browser console first
- **Questions:** Review this guide and codebase comments
