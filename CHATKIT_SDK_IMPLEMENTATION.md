# 🚀 ChatKit SDK Implementation Guide

## Overview

Your `/chat-agent` page now uses the **official ChatKit JavaScript SDK** with proper `ChatKitOptions` configuration, following [OpenAI's documentation](https://platform.openai.com/docs/guides/chatkit-themes).

---

## ✅ Implementation Details

### 1. Proper SDK Usage

Instead of using the web component, we now use the **JavaScript SDK** approach:

```typescript
import { ChatKit } from '@openai/chatkit';
import type { ChatKitOptions } from '@openai/chatkit';

// Create configuration
const options: ChatKitOptions = {
  api: {
    createSession: async () => {
      // Your session creation logic
    },
  },
  theme: {
    colorScheme: 'dark', // or 'light'
    radius: 'medium',
    density: 'normal',
    typography: { /* ... */ }
  },
  composer: {
    attachments: { /* ... */ },
    placeholder: 'Message...'
  },
  startScreen: {
    greeting: 'Hello!',
    prompts: [ /* ... */ ]
  }
};

// Initialize ChatKit
const chatkit = new ChatKit(container, options);
```

---

## 📦 File Structure

```
src/
├── components/
│   └── chat/
│       └── ChatKitEmployeeChat.tsx      # Main ChatKit component
├── lib/
│   └── chatkit-config.ts                # Configuration utilities
├── pages/
│   └── chat/
│       └── ChatAgentPageChatKit.tsx     # Page component

netlify/
└── functions/
    └── create-chatkit-session.ts        # Session endpoint
```

---

## 🎨 Theme Configuration

### Automatic Theme Switching

ChatKit automatically adapts to your app's theme:

```typescript
const { actualTheme } = useTheme(); // 'light' or 'dark'

const options: ChatKitOptions = {
  theme: {
    colorScheme: actualTheme, // Updates automatically
    radius: 'medium',         // 'none', 'small', 'medium', 'large', 'pill'
    density: 'normal',        // 'compact', 'normal', 'spacious'
    typography: {
      baseSize: 16,
      fontFamily: '"Inter", system-ui, sans-serif',
      fontFamilyMono: 'ui-monospace, monospace'
    }
  }
};
```

### Theme Options

| Property | Options | Default |
|----------|---------|---------|
| `colorScheme` | `'light'`, `'dark'` | `'light'` |
| `radius` | `'none'`, `'small'`, `'medium'`, `'large'`, `'pill'` | `'medium'` |
| `density` | `'compact'`, `'normal'`, `'spacious'` | `'normal'` |
| `baseSize` | `number` (12-20) | `16` |

---

## 🎯 Configuration Options

### API Configuration

```typescript
api: {
  createSession: async () => {
    // Call your backend to create ChatKit session
    const response = await fetch('/api/create-session', {
      method: 'POST',
      body: JSON.stringify({ workflowId, userId })
    });
    
    const data = await response.json();
    return {
      session_id: data.session_id,
      client_secret: data.client_secret
    };
  }
}
```

### Composer Configuration

```typescript
composer: {
  attachments: {
    enabled: true,
    maxCount: 5,
    maxSize: 10485760 // 10MB in bytes
  },
  placeholder: 'Message AI Employee...',
  // Optional: Add tools
  tools: [
    {
      id: 'search_docs',
      label: 'Search docs',
      shortLabel: 'Docs',
      icon: 'book-open',
      placeholderOverride: 'Search documentation'
    }
  ],
  // Optional: Add model selector
  models: [
    {
      id: 'gpt-4o',
      label: 'GPT-4o',
      description: 'Most capable model',
      default: true
    }
  ]
}
```

### Start Screen Configuration

```typescript
startScreen: {
  greeting: "Hi! I'm Data Analyst AI, ready to help!",
  prompts: [
    {
      icon: 'chart-bar',          // ChatKit icon name
      label: 'Analyze Data',      // Button text
      prompt: 'Help me analyze...' // Sent when clicked
    },
    {
      icon: 'sparkles',
      label: 'Generate Report',
      prompt: 'Create a report on...'
    }
  ]
}
```

### Available Icons

Common ChatKit icons:
- `sparkles` - AI/magic
- `circle-question` - Help/questions
- `lightbulb` - Ideas
- `book-open` - Documentation
- `code` - Code/programming
- `search` - Search
- `chart-bar` - Data/analytics
- `file-text` - Documents
- `globe` - Web/internet
- `wrench` - Tools/settings

---

## 🔧 Utilities (`src/lib/chatkit-config.ts`)

### Generate Starter Prompts

```typescript
import { generateStarterPrompts } from '@/lib/chatkit-config';

const prompts = generateStarterPrompts(
  ['Data Analysis', 'Report Generation', 'Visualization'],
  'chart-bar'
);
```

### Create Employee Options

```typescript
import { createEmployeeChatKitOptions } from '@/lib/chatkit-config';

const options = createEmployeeChatKitOptions({
  employeeId: 'emp_123',
  employeeName: 'Data Analyst AI',
  employeeRole: 'Data Analyst',
  workflowId: 'flow_data_001',
  userId: user.id,
  capabilities: ['SQL', 'Python', 'Visualization'],
  colorScheme: actualTheme,
  onError: (error) => console.error(error)
});
```

### Get Role Icon

```typescript
import { getRoleIcon } from '@/lib/chatkit-config';

const icon = getRoleIcon('Data Analyst'); // Returns 'chart-bar'
```

---

## 💡 Advanced Features

### Custom Tools

Add custom tools to the composer:

```typescript
composer: {
  tools: [
    {
      id: 'analyze_data',
      label: 'Analyze Data',
      shortLabel: 'Analyze',
      icon: 'chart-bar',
      placeholderOverride: 'Paste your data to analyze...',
      pinned: true // Show by default
    },
    {
      id: 'generate_code',
      label: 'Generate Code',
      shortLabel: 'Code',
      icon: 'code',
      pinned: false
    }
  ]
}
```

### Handle Client Tools

```typescript
const options: ChatKitOptions = {
  // ...other options
  onClientTool: async (tool, parameters) => {
    console.log('Tool called:', tool, parameters);
    
    // Execute tool and return result
    if (tool === 'search_docs') {
      const results = await searchDocumentation(parameters.query);
      return { results };
    }
    
    return null;
  }
};
```

### Thread Management

```typescript
// Start with existing thread
const options: ChatKitOptions = {
  initialThread: 'thread_abc123',
  // ...other options
};

// Handle thread changes
const chatkit = new ChatKit(container, options);
chatkit.on('threadCreated', (threadId) => {
  console.log('New thread:', threadId);
});
```

---

## 🎨 Customization Examples

### Professional Theme

```typescript
theme: {
  colorScheme: 'light',
  radius: 'medium',
  density: 'normal',
  typography: {
    baseSize: 15,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyMono: '"Fira Code", monospace'
  }
}
```

### Compact Theme

```typescript
theme: {
  colorScheme: 'dark',
  radius: 'small',
  density: 'compact',
  typography: {
    baseSize: 14
  }
}
```

### Rounded Theme

```typescript
theme: {
  colorScheme: 'light',
  radius: 'pill',
  density: 'spacious',
  typography: {
    baseSize: 16
  }
}
```

---

## 🐛 Debugging

### Enable Debug Mode

```typescript
const options: ChatKitOptions = {
  // ...other options
  onError: (error) => {
    console.error('ChatKit Error:', error);
    // Send to error tracking service
  }
};
```

### Check ChatKit Events

```typescript
const chatkit = new ChatKit(container, options);

// Listen to events
chatkit.on('message', (message) => {
  console.log('New message:', message);
});

chatkit.on('sessionCreated', (session) => {
  console.log('Session created:', session);
});

chatkit.on('error', (error) => {
  console.error('ChatKit error:', error);
});
```

---

## 📚 Resources

- **ChatKit Documentation**: https://platform.openai.com/docs/guides/chatkit-themes
- **ChatKit GitHub**: https://github.com/openai/openai-chatkit-starter-app
- **Agent Builder**: https://platform.openai.com/agent-builder
- **API Reference**: https://platform.openai.com/docs/api-reference

---

## ✅ Benefits of This Approach

1. **Type Safety**: Full TypeScript support with `ChatKitOptions`
2. **Flexibility**: Complete control over configuration
3. **Consistency**: Follows OpenAI's official patterns
4. **Maintainability**: Centralized configuration utilities
5. **Theming**: Automatic light/dark mode adaptation
6. **Extensibility**: Easy to add custom tools and features

---

## 🎯 Quick Reference

### Minimal Configuration

```typescript
const options: ChatKitOptions = {
  api: {
    createSession: async () => {
      const res = await fetch('/api/session', { method: 'POST' });
      return await res.json();
    }
  },
  theme: {
    colorScheme: 'dark'
  },
  startScreen: {
    greeting: 'Hello!',
    prompts: [
      { icon: 'sparkles', label: 'Help', prompt: 'How can you help?' }
    ]
  }
};
```

### Full Configuration

```typescript
const options: ChatKitOptions = {
  api: { /* session creation */ },
  theme: { /* appearance */ },
  composer: { /* input options */ },
  startScreen: { /* welcome screen */ },
  onClientTool: async (tool, params) => { /* tool handler */ },
  onError: (error) => { /* error handler */ },
  initialThread: 'thread_id', // Optional
  locale: 'en-US', // Optional
};
```

---

**Status:** ✅ Implemented with proper SDK configuration

**Last Updated:** December 10, 2024

**Version:** 2.0.0 - ChatKit SDK Implementation

