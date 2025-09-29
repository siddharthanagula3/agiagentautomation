# Chat Integration Guide - Show Purchased AI Employees

## 🎯 Goal
Display purchased AI employees in the chat interface and enable conversations with them.

---

## 📊 Data Flow

```
Marketplace Purchase → localStorage → Chat Interface → AI API
```

1. User purchases employee in marketplace
2. Saved to `localStorage` with key `'purchasedEmployees'`
3. Chat reads from localStorage and displays employees
4. User clicks employee to start chat
5. Route to correct API based on employee's `provider`

---

## 🔧 Implementation Steps

### Step 1: Read Purchased Employees

Add this hook to your chat component:

```typescript
// In your ChatPage.tsx or chat component
import { useEffect, useState } from 'react';
import { AI_EMPLOYEES, type AIEmployee } from '@/data/ai-employees';

function usePurchasedEmployees() {
  const [purchasedEmployees, setPurchasedEmployees] = useState<AIEmployee[]>([]);

  useEffect(() => {
    // Load from localStorage
    const purchased = JSON.parse(localStorage.getItem('purchasedEmployees') || '[]');
    
    // Map IDs to full employee data
    const employees = purchased
      .map((p: any) => AI_EMPLOYEES.find(e => e.id === p.id))
      .filter(Boolean);
    
    setPurchasedEmployees(employees);
  }, []);

  return purchasedEmployees;
}
```

### Step 2: Display Employees in Sidebar

```typescript
function ChatSidebar() {
  const purchasedEmployees = usePurchasedEmployees();

  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your AI Team
        </h2>
        
        {purchasedEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No AI employees yet
            </p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="mt-4"
            >
              Hire Your First Employee
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {purchasedEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => startChat(employee)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <img 
                  src={employee.avatar} 
                  alt={employee.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {employee.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {employee.role}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getProviderBadge(employee.provider)}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Create Chat Session

```typescript
interface ChatSession {
  id: string;
  employeeId: string;
  employeeName: string;
  provider: 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
  messages: Message[];
}

function startChat(employee: AIEmployee) {
  const sessionId = `chat-${Date.now()}`;
  
  const newSession: ChatSession = {
    id: sessionId,
    employeeId: employee.id,
    employeeName: employee.name,
    provider: employee.provider,
    messages: [
      {
        role: 'system',
        content: `You are ${employee.name}, a ${employee.role}. ${employee.description}. Your specialties include: ${employee.skills.join(', ')}.`
      },
      {
        role: 'assistant',
        content: `Hi! I'm ${employee.name}, your ${employee.role}. How can I help you today?`
      }
    ]
  };
  
  // Save to state and display
  setActiveSession(newSession);
}
```

### Step 4: Route to Correct API

```typescript
async function sendMessage(message: string, session: ChatSession) {
  const apiConfig = {
    chatgpt: {
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    claude: {
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-sonnet-20240229',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    },
    gemini: {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      model: 'gemini-pro',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    perplexity: {
      url: 'https://api.perplexity.ai/chat/completions',
      model: 'llama-3.1-sonar-small-128k-online',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  };

  const config = apiConfig[session.provider];
  
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...session.messages,
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    
    // Extract response based on provider
    let assistantMessage = '';
    if (session.provider === 'chatgpt' || session.provider === 'perplexity') {
      assistantMessage = data.choices[0].message.content;
    } else if (session.provider === 'claude') {
      assistantMessage = data.content[0].text;
    } else if (session.provider === 'gemini') {
      assistantMessage = data.candidates[0].content.parts[0].text;
    }

    return assistantMessage;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 🎨 UI Components

### Employee Badge Colors

```typescript
function getProviderBadge(provider: string) {
  const badges = {
    chatgpt: { label: 'ChatGPT', className: 'bg-green-500/20 text-green-400' },
    claude: { label: 'Claude', className: 'bg-purple-500/20 text-purple-400' },
    gemini: { label: 'Gemini', className: 'bg-blue-500/20 text-blue-400' },
    perplexity: { label: 'Perplexity', className: 'bg-orange-500/20 text-orange-400' }
  };
  return badges[provider as keyof typeof badges];
}
```

### Empty State

```typescript
<div className="flex flex-col items-center justify-center h-full p-8">
  <Bot className="h-16 w-16 text-muted-foreground mb-4" />
  <h3 className="text-xl font-semibold text-foreground mb-2">
    Hire Your First AI Employee
  </h3>
  <p className="text-muted-foreground text-center mb-6">
    Browse our marketplace and hire specialized AI employees to chat with.
  </p>
  <Button onClick={() => navigate('/marketplace')}>
    <ShoppingCart className="h-4 w-4 mr-2" />
    Go to Marketplace
  </Button>
</div>
```

---

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# ChatGPT
VITE_OPENAI_API_KEY=sk-...

# Claude
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Gemini
VITE_GEMINI_API_KEY=...

# Perplexity
VITE_PERPLEXITY_API_KEY=pplx-...
```

---

## 💾 LocalStorage Structure

```typescript
// Key: 'purchasedEmployees'
// Value:
[
  {
    "id": "emp-001",
    "name": "Alex Chen",
    "role": "Software Architect",
    "provider": "claude",
    "purchasedAt": "2025-01-15T10:30:00.000Z"
  }
]

// Key: 'chatSessions' (optional - for persistence)
// Value:
[
  {
    "id": "chat-1705315800000",
    "employeeId": "emp-001",
    "employeeName": "Alex Chen",
    "provider": "claude",
    "messages": [...],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastMessageAt": "2025-01-15T10:35:00.000Z"
  }
]
```

---

## 🎯 Complete Example

Here's a minimal working example:

```typescript
import React, { useState, useEffect } from 'react';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export function ChatPage() {
  const [purchasedEmployees, setPurchasedEmployees] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Load purchased employees
  useEffect(() => {
    const purchased = JSON.parse(localStorage.getItem('purchasedEmployees') || '[]');
    const employees = purchased
      .map(p => AI_EMPLOYEES.find(e => e.id === p.id))
      .filter(Boolean);
    setPurchasedEmployees(employees);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeEmployee) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Send to API (simplified)
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider: activeEmployee.provider,
        messages: [...messages, userMessage]
      })
    });

    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar with employees */}
      <div className="w-64 border-r">
        {purchasedEmployees.map(emp => (
          <button
            key={emp.id}
            onClick={() => setActiveEmployee(emp)}
            className="w-full p-3 hover:bg-accent"
          >
            <img src={emp.avatar} className="w-10 h-10 rounded-full" />
            <div>{emp.name}</div>
            <div>{emp.role}</div>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              {msg.content}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Purchase employee in marketplace
- [ ] Refresh page - employee persists
- [ ] Go to chat - see employee in sidebar
- [ ] Click employee - chat opens
- [ ] Send message - receives response from correct API
- [ ] Multiple employees - can switch between them
- [ ] Empty state - shows when no employees purchased

---

## 🚀 Quick Win

Start with this simple version first:

1. Read from `localStorage`
2. Show employee list in sidebar
3. Click employee shows static welcome message
4. Gradually add API integration

This lets you see the purchased employees immediately while you work on the API connections!
