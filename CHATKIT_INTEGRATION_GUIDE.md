# 🚀 ChatKit Integration Guide

## Overview

Your `/chat-agent` page now uses **OpenAI's ChatKit** web component for a clean, professional chat experience with your AI Employees.

---

## 📋 What Changed

### ✅ New Components
1. **`ChatKitEmployeeChat.tsx`** - ChatKit web component wrapper
2. **`ChatAgentPageChatKit.tsx`** - Clean chat interface using ChatKit
3. **`create-chatkit-session.ts`** - Netlify function for session creation

### ✅ Benefits
- **Clean UI**: Simple, focused chat interface
- **Official Component**: Uses OpenAI's ChatKit web component
- **Better Performance**: Optimized by OpenAI
- **Automatic Theme**: Respects light/dark mode
- **Easy Maintenance**: Less custom code

---

## 🔧 Setup Required

### 1. Configure OpenAI API Key

Make sure your OpenAI API key is set in Netlify environment variables:

```bash
OPENAI_API_KEY=sk-proj-...
```

**Important:** The API key must be from the **same organization and project** as your Agent Builder workflows.

### 2. Add Workflow IDs to AI Employees

Each AI Employee needs a `workflow_id` in their metadata. You have two options:

#### Option A: Database Migration (Recommended)

Run this SQL in your Supabase dashboard to add workflow IDs:

```sql
-- Update existing employees with workflow IDs
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  '"flow_abc123"'::jsonb
)
WHERE employee_id = 'specific-employee-id';

-- Example for multiple employees
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  CASE
    WHEN role = 'Data Analyst' THEN '"flow_data_analyst_001"'::jsonb
    WHEN role = 'Content Writer' THEN '"flow_content_writer_001"'::jsonb
    WHEN role = 'Code Assistant' THEN '"flow_code_assistant_001"'::jsonb
    ELSE '"flow_default_001"'::jsonb
  END
)
WHERE user_id = 'your-user-id';
```

#### Option B: Update via Backend Service

Create a service to manage workflow IDs:

```typescript
// src/services/employee-workflow-service.ts
import { supabase } from '@/lib/supabase-client';

export const updateEmployeeWorkflowId = async (
  employeeId: string,
  workflowId: string
) => {
  const { data, error } = await supabase
    .from('purchased_employees')
    .update({
      metadata: {
        workflow_id: workflowId
      }
    })
    .eq('id', employeeId);

  if (error) throw error;
  return data;
};

// Map of employee roles to workflow IDs
export const EMPLOYEE_WORKFLOW_MAP = {
  'Data Analyst': 'flow_data_analyst_001',
  'Content Writer': 'flow_content_writer_001',
  'Code Assistant': 'flow_code_assistant_001',
  'Research Analyst': 'flow_research_analyst_001',
  'Marketing Specialist': 'flow_marketing_specialist_001',
  // Add more mappings...
};
```

### 3. Create OpenAI Agent Builder Workflows

For each AI Employee type, create a workflow in OpenAI Agent Builder:

1. Go to [OpenAI Agent Builder](https://platform.openai.com/agent-builder)
2. Create a new workflow for each employee role
3. Configure the agent with:
   - Name matching the employee role
   - System instructions for the employee's specialty
   - Tools (Code Interpreter, Web Search, etc.)
   - Response format and behavior
4. Save and get the `workflow_id` (starts with `flow_`)
5. Add the workflow ID to your employee metadata

---

## 🎯 How It Works

### User Flow

1. **Select Employee**: User clicks on an AI Employee from Workforce page
2. **Navigate**: User is redirected to `/chat-agent?employee={id}`
3. **Load Data**: Page loads employee data and workflow ID
4. **Create Session**: Backend creates ChatKit session with OpenAI
5. **Chat**: User interacts with clean ChatKit interface

### Technical Flow

```
User Selects Employee
        ↓
/chat-agent?employee=abc123
        ↓
ChatAgentPageChatKit loads
        ↓
Fetch employee from Supabase
        ↓
Get workflow_id from metadata
        ↓
Call create-chatkit-session
        ↓
OpenAI creates session
        ↓
Returns session_token
        ↓
ChatKitEmployeeChat renders
        ↓
User chats with AI Employee
```

---

## 📦 File Structure

```
src/
├── components/
│   └── chat/
│       ├── ChatKitEmployeeChat.tsx      # ChatKit wrapper
│       └── AgentChatUI.tsx              # Old custom chat (backup)
├── pages/
│   └── chat/
│       ├── ChatAgentPageChatKit.tsx     # New ChatKit page (active)
│       └── ChatAgentPage.tsx            # Old page (backup at /chat-agent-custom)
├── types/
│   └── employee.ts                      # Employee types

netlify/
└── functions/
    └── create-chatkit-session.ts        # Session endpoint

CHATKIT_INTEGRATION_GUIDE.md             # This file
```

---

## 🔑 Environment Variables

### Required

```bash
# OpenAI API Key (same org/project as Agent Builder)
OPENAI_API_KEY=sk-proj-...
```

### Optional

```bash
# Default workflow ID (fallback if employee doesn't have one)
VITE_DEFAULT_WORKFLOW_ID=flow_default_001

# Custom ChatKit API endpoint (if self-hosting)
CHATKIT_API_BASE=https://api.openai.com/v1
```

---

## 🎨 Customization

### Update Starter Prompts

Edit `ChatKitEmployeeChat.tsx`:

```typescript
const starters = JSON.stringify(
  capabilities.slice(0, 4).map(cap => ({
    prompt: `Help me with ${cap}`,
    label: cap,
  }))
);
```

### Change Greeting

```typescript
const greeting = `Hi! I'm ${employeeName}, your ${employeeRole}. How can I help you today?`;
```

### Adjust Theme

ChatKit automatically detects and follows your app's theme:

```typescript
const [theme, setTheme] = useState<'light' | 'dark'>('dark');

useEffect(() => {
  const updateTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  };
  updateTheme();
}, []);
```

---

## 🧪 Testing

### 1. Local Testing

```bash
# Start dev server
npm run dev

# Visit
http://localhost:5173/chat-agent?employee={employee-id}
```

### 2. Test Session Creation

```bash
curl -X POST http://localhost:8888/.netlify/functions/create-chatkit-session \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp_123",
    "workflowId": "flow_test_001",
    "userId": "user_123",
    "employeeName": "Test Employee"
  }'
```

### 3. Check Console

Open browser DevTools and look for:
- ✅ "ChatKit script loaded"
- ✅ "Creating ChatKit session for: ..."
- ✅ "ChatKit session created: sess_..."
- ❌ Any errors

---

## 🐛 Troubleshooting

### Issue: "Failed to load ChatKit"

**Cause**: ChatKit script couldn't load from CDN

**Fix**: Check internet connection or add script to `index.html`:

```html
<script src="https://cdn.openai.com/chatkit/v1/chatkit.js" type="module"></script>
```

### Issue: "No workflow ID configured"

**Cause**: Employee metadata doesn't have `workflow_id`

**Fix**: Add workflow ID to employee:

```sql
UPDATE purchased_employees
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{workflow_id}',
  '"flow_your_workflow"'::jsonb
)
WHERE id = 'employee-id';
```

### Issue: "Failed to create session"

**Cause**: OpenAI API error (wrong key, wrong org, invalid workflow)

**Fix**: 
1. Verify API key in Netlify environment
2. Ensure API key is from same org as Agent Builder
3. Verify workflow ID exists in Agent Builder
4. Check Netlify function logs

### Issue: Session expires quickly

**Cause**: ChatKit sessions have expiration

**Fix**: Implement session refresh in `ChatKitEmployeeChat.tsx`:

```typescript
useEffect(() => {
  const checkSession = setInterval(() => {
    // Re-create session if needed
    if (sessionExpired) {
      createSession();
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkSession);
}, []);
```

---

## 📊 Migration from Old Chat

### Old Custom Chat

```tsx
// Old: ChatAgentPage.tsx
<AgentChatUI
  sessionId={session.id}
  userId={user.id}
  agentName={employee.name}
  // ... many props
/>
```

### New ChatKit

```tsx
// New: ChatAgentPageChatKit.tsx
<ChatKitEmployeeChat
  employeeId={employee.id}
  employeeName={employee.name}
  employeeRole={employee.role}
  workflowId={workflowId}
  capabilities={employee.capabilities}
/>
```

**Simpler, cleaner, better!**

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] ✅ ChatKit package installed (`npm install @openai/chatkit`)
- [ ] ✅ OpenAI API key set in Netlify environment
- [ ] ✅ All employees have workflow IDs in metadata
- [ ] ✅ All workflows created in OpenAI Agent Builder
- [ ] ✅ Session endpoint deployed (`create-chatkit-session.ts`)
- [ ] ✅ Tested locally
- [ ] ✅ Tested on staging
- [ ] ✅ Theme works in light and dark modes
- [ ] ✅ Error handling tested
- [ ] ✅ Documentation updated

---

## 📚 References

- **OpenAI ChatKit**: https://github.com/openai/openai-chatkit-starter-app
- **Agent Builder**: https://platform.openai.com/agent-builder
- **OpenAI API Docs**: https://platform.openai.com/docs
- **ChatKit CDN**: https://cdn.openai.com/chatkit/v1/chatkit.js

---

## 🎯 Next Steps

### Phase 1: Setup (Current)
- [x] Install ChatKit
- [x] Create session endpoint
- [x] Build ChatKit wrapper component
- [x] Create new page with ChatKit
- [x] Update routes

### Phase 2: Configuration
- [ ] Add workflow IDs to all employees
- [ ] Create workflows in Agent Builder
- [ ] Configure environment variables
- [ ] Test with real employees

### Phase 3: Enhancement
- [ ] Add session persistence
- [ ] Implement chat history
- [ ] Add file upload support
- [ ] Add conversation export
- [ ] Add analytics tracking

### Phase 4: Polish
- [ ] Optimize performance
- [ ] Add more customization options
- [ ] Improve error handling
- [ ] Add offline support

---

## 💡 Tips

1. **Use Descriptive Workflow Names**: Name workflows clearly (e.g., `flow_data_analyst_001`)
2. **Test Each Workflow**: Verify each workflow works in Agent Builder before using
3. **Monitor Usage**: ChatKit usage counts toward your OpenAI API quota
4. **Cache Sessions**: Consider caching session tokens temporarily
5. **Handle Errors Gracefully**: Show clear error messages to users

---

**Status:** ✅ Ready for Phase 2 (Configuration)

**Last Updated:** December 10, 2024

**Version:** 1.0.0 - ChatKit Integration

