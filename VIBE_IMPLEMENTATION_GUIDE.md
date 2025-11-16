# VIBE Implementation Guide

## Complete Supabase Integration with Workforce Orchestrator

This guide documents the complete implementation of VIBE (Visual Interactive Build Environment) with Supabase database integration and workforce orchestrator coordination.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Was Implemented](#what-was-implemented)
3. [Database Schema](#database-schema)
4. [Service Layer](#service-layer)
5. [React Hooks](#react-hooks)
6. [Usage Examples](#usage-examples)
7. [Integration with Workforce Orchestrator](#integration-with-workforce-orchestrator)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

VIBE is a multi-agent collaborative workspace that enables AI agents to work together in real-time while users observe their progress. This implementation provides complete database integration with Supabase and seamless coordination with the workforce orchestrator.

### Key Features

✅ **Real-time message streaming** - Word-by-word response chunking
✅ **Agent action tracking** - All agent actions logged to database
✅ **Workforce orchestrator integration** - Automatic agent selection and task delegation
✅ **Type-safe operations** - Full TypeScript support
✅ **Row Level Security** - Secure multi-tenant database access
✅ **React hooks** - Easy integration with React components
✅ **Service layer** - Clean separation of concerns

---

## What Was Implemented

### 1. Database Schema Enhancement

**File:** `supabase/migrations/20251116000002_add_user_id_to_vibe_messages.sql`

- Added `user_id` column to `vibe_messages` table
- Created index for optimized user queries
- Backfilled existing rows with user data
- Enables direct user tracking without session joins

### 2. Service Layer

#### VibeMessageService

**File:** `src/features/vibe/services/vibe-message-service.ts`

Complete CRUD operations for messages:

- `getMessages(sessionId)` - Fetch all messages
- `createMessage(params)` - Create new message
- `updateMessage(messageId, updates)` - Update existing message
- `deleteMessage(messageId)` - Remove message
- `processUserMessage(params)` - **Complete workflow integration**
- `subscribeToMessages(sessionId, onMessage)` - Real-time updates
- `getRecentMessages(sessionId, limit)` - Paginated retrieval
- `clearSessionMessages(sessionId)` - Bulk delete

#### VibeAgentActionService

**File:** `src/features/vibe/services/vibe-agent-action-service.ts`

Complete action logging system:

- `createAction(params)` - Log new action
- `updateAction(actionId, updates)` - Update action status
- `completeAction(actionId, result)` - Mark as completed
- `failAction(actionId, error)` - Mark as failed
- `getActions(sessionId)` - Fetch all actions
- `getAgentActions(sessionId, agentName)` - Filter by agent
- `subscribeToActions(sessionId, onAction)` - Real-time updates
- `getActionStats(sessionId)` - Statistics and analytics

**Helper Methods:**

- `logFileEdit()` - Log file modifications
- `logCommandExecution()` - Log terminal commands
- `logAppPreview()` - Log app preview URLs
- `logToolExecution()` - Log tool usage
- `logTaskPlanning()` - Log planning phase

### 3. React Hooks

#### useVibeMessages

**File:** `src/features/vibe/hooks/use-vibe-messages.ts`

Hook for message management:

```typescript
const {
  messages,
  isLoading,
  error,
  loadMessages,
  createMessage,
  clearMessages,
  refresh,
} = useVibeMessages({ sessionId });
```

Features:

- Automatic real-time subscription
- Optimistic UI updates
- Error handling
- Auto-load on mount

#### useVibeAgentActions

**File:** `src/features/vibe/hooks/use-vibe-agent-actions.ts`

Hook for action tracking:

```typescript
const {
  actions,
  stats,
  logFileEdit,
  logCommand,
  logAppPreview,
  logToolExecution,
  clearActions,
  refresh,
} = useVibeAgentActions({ sessionId, agentName });
```

Features:

- Real-time action updates
- Statistics calculation
- Helper methods for common actions
- Agent-specific filtering

### 4. VibeDashboard Refactoring

**File:** `src/features/vibe/pages/VibeDashboard.tsx`

Refactored to use service layer:

- Cleaner code structure
- Better error handling
- Improved type safety
- Reduced code duplication

### 5. Integration Examples

**File:** `src/features/vibe/examples/workforce-integration-example.ts`

Complete working examples:

- `processUserRequestExample()` - Full message flow
- `agentExecutionExample()` - Action logging patterns
- `streamingResponseExample()` - Response streaming
- `errorHandlingExample()` - Error handling
- `completeWorkflowExample()` - End-to-end workflow

### 6. Comprehensive Documentation

**File:** `src/features/vibe/README.md`

Complete documentation including:

- Architecture overview
- Database schema
- Component hierarchy
- Message flow diagrams
- Real-time subscriptions
- Performance considerations
- Security best practices
- Troubleshooting guide

---

## Database Schema

### vibe_messages Table

```sql
CREATE TABLE vibe_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NEW
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  employee_id UUID REFERENCES ai_employees(id),
  employee_name TEXT,
  employee_role TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_streaming BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_vibe_messages_user ON vibe_messages(user_id);  -- NEW
```

### vibe_agent_actions Table

```sql
CREATE TABLE vibe_agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'file_edit', 'command_execution', 'app_preview',
    'task_planning', 'tool_execution', 'file_read',
    'file_create', 'file_delete'
  )),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  result JSONB,
  error TEXT
);
```

---

## Service Layer

### VibeMessageService API

#### Create Message

```typescript
const message = await VibeMessageService.createMessage({
  sessionId: 'session-123',
  userId: 'user-456',
  role: 'user',
  content: 'Hello, VIBE!',
  metadata: { source: 'web' },
});
```

#### Process User Message (Complete Workflow)

```typescript
const result = await VibeMessageService.processUserMessage({
  sessionId,
  userId,
  content: userInput,
  conversationHistory: messages,
  onChunk: (chunk) => {
    // Update UI with chunk
    console.log('Chunk:', chunk);
  },
  onComplete: (fullResponse) => {
    // Handle completion
    console.log('Done:', fullResponse);
  },
  onError: (error) => {
    // Handle error
    console.error('Error:', error);
  },
});
```

#### Subscribe to Real-time Updates

```typescript
const unsubscribe = VibeMessageService.subscribeToMessages(
  sessionId,
  (message) => {
    console.log('New message:', message);
    // Update UI
  },
  (error) => {
    console.error('Subscription error:', error);
  }
);

// Cleanup
unsubscribe();
```

### VibeAgentActionService API

#### Log File Edit

```typescript
const fileEdit = await VibeAgentActionService.logFileEdit({
  sessionId,
  agentName: 'code-reviewer',
  filePath: 'src/App.tsx',
  changes: 'Added error boundary',
});

// Later, when edit completes
await fileEdit.complete('File successfully updated');

// Or if it fails
await fileEdit.fail('Permission denied');
```

#### Log Command Execution

```typescript
const command = await VibeAgentActionService.logCommandExecution({
  sessionId,
  agentName: 'debugger',
  command: 'npm test',
  cwd: '/workspace',
});

// When command completes
await command.complete('All tests passed (15/15)', 0);

// Or if it fails
await command.fail('Tests failed: 3 errors', 1);
```

#### Log App Preview

```typescript
const preview = await VibeAgentActionService.logAppPreview({
  sessionId,
  agentName: 'developer',
  previewUrl: 'http://localhost:3000',
  port: 3000,
});
```

#### Get Action Statistics

```typescript
const stats = await VibeAgentActionService.getActionStats(sessionId);

console.log(stats);
// {
//   total: 25,
//   completed: 20,
//   failed: 2,
//   in_progress: 3,
//   by_type: {
//     file_edit: 10,
//     command_execution: 8,
//     tool_execution: 7
//   },
//   by_agent: {
//     'code-reviewer': 15,
//     'debugger': 10
//   }
// }
```

---

## React Hooks

### Using useVibeMessages

```typescript
import { useVibeMessages } from '@features/vibe/hooks/use-vibe-messages';

function ChatComponent({ sessionId }: { sessionId: string }) {
  const { messages, isLoading, createMessage } = useVibeMessages({
    sessionId,
    autoLoad: true
  });

  const handleSend = async (content: string) => {
    await createMessage({
      role: 'user',
      content,
    });
  };

  if (isLoading) return <div>Loading messages...</div>;

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => handleSend('Hello!')}>Send</button>
    </div>
  );
}
```

### Using useVibeAgentActions

```typescript
import { useVibeAgentActions } from '@features/vibe/hooks/use-vibe-agent-actions';

function AgentMonitor({ sessionId }: { sessionId: string }) {
  const { actions, stats, logCommand } = useVibeAgentActions({
    sessionId,
    autoLoad: true
  });

  const runTest = async () => {
    const command = await logCommand({
      agentName: 'test-runner',
      command: 'npm test'
    });

    // Simulate command execution
    setTimeout(async () => {
      await command.complete('All tests passed!', 0);
    }, 2000);
  };

  return (
    <div>
      <h3>Action Statistics</h3>
      <p>Total: {stats.total}</p>
      <p>Completed: {stats.completed}</p>
      <p>Failed: {stats.failed}</p>

      <h3>Recent Actions</h3>
      {actions.map(action => (
        <div key={action.id}>
          {action.agent_name}: {action.action_type} - {action.status}
        </div>
      ))}

      <button onClick={runTest}>Run Tests</button>
    </div>
  );
}
```

---

## Integration with Workforce Orchestrator

### Complete Message Flow

```typescript
import { VibeMessageService } from '@features/vibe/services/vibe-message-service';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';

async function handleUserMessage(params: {
  sessionId: string;
  userId: string;
  userInput: string;
  conversationHistory: Array<{ role: string; content: string }>;
}) {
  // 1. Create user message
  const userMessage = await VibeMessageService.createMessage({
    sessionId: params.sessionId,
    userId: params.userId,
    role: 'user',
    content: params.userInput,
  });

  // 2. Call workforce orchestrator
  const response = await workforceOrchestratorRefactored.processRequest({
    userId: params.userId,
    input: params.userInput,
    mode: 'chat',
    sessionId: params.sessionId,
    conversationHistory: [
      ...params.conversationHistory,
      { role: 'user', content: params.userInput },
    ],
  });

  if (!response.success || !response.chatResponse) {
    throw new Error(response.error || 'Orchestrator failed');
  }

  // 3. Create assistant message with streaming
  let currentContent = '';
  const chunks = response.chatResponse.split(/(\s+)/).filter((p) => p.length);

  const assistantMessage = await VibeMessageService.createMessage({
    sessionId: params.sessionId,
    userId: params.userId,
    role: 'assistant',
    content: '',
    employeeName: response.assignedEmployee || 'AI Assistant',
    isStreaming: true,
  });

  // 4. Stream chunks
  for (const chunk of chunks) {
    currentContent += chunk;
    await VibeMessageService.updateMessage(assistantMessage.id, {
      content: currentContent,
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
  }

  // 5. Mark complete
  await VibeMessageService.updateMessage(assistantMessage.id, {
    is_streaming: false,
    content: response.chatResponse,
  });

  return { userMessage, assistantMessage };
}
```

### Agent Action Logging

Agents can log their actions during execution:

```typescript
import { VibeAgentActionService } from '@features/vibe/services/vibe-agent-action-service';

async function agentWorkflow(sessionId: string) {
  const agentName = 'code-reviewer';

  // Log file read
  const fileRead = await VibeAgentActionService.createAction({
    sessionId,
    agentName,
    actionType: 'file_read',
    metadata: { file_path: 'src/App.tsx' },
  });

  // ... read file ...

  await VibeAgentActionService.completeAction(fileRead.id, {
    lines: 150,
    summary: 'Analyzed component structure',
  });

  // Log file edit with helper
  const edit = await VibeAgentActionService.logFileEdit({
    sessionId,
    agentName,
    filePath: 'src/App.tsx',
    changes: 'Added error boundary',
  });

  // ... make changes ...

  await edit.complete('Successfully added error boundary');

  // Log command
  const test = await VibeAgentActionService.logCommandExecution({
    sessionId,
    agentName,
    command: 'npm test',
  });

  // ... run tests ...

  await test.complete('All tests passed (20/20)', 0);
}
```

---

## Testing

### Run Type Checking

```bash
npm run type-check
```

All code is fully typed and passes TypeScript strict mode checks.

### Test Service Methods

```typescript
import { VibeMessageService } from '@features/vibe/services/vibe-message-service';

// Test message creation
const message = await VibeMessageService.createMessage({
  sessionId: 'test-session',
  userId: 'test-user',
  role: 'user',
  content: 'Test message',
});

console.log('✅ Message created:', message.id);

// Test message retrieval
const messages = await VibeMessageService.getMessages('test-session');
console.log('✅ Retrieved messages:', messages.length);
```

### Run Examples

```typescript
import { examples } from '@features/vibe/examples/workforce-integration-example';

// Run complete workflow example
await examples.completeWorkflow();
```

---

## Deployment

### Prerequisites

1. **Docker Desktop** running (for local Supabase)
2. **Environment variables** configured
3. **Supabase project** set up

### Apply Migrations

```bash
# Local development
supabase db reset

# Production
supabase db push
```

### Deploy to Netlify

```bash
# Type check
npm run type-check

# Build
npm run build:prod

# Deploy (automatic on push to main)
git push origin main
```

---

## Summary

This implementation provides a complete, production-ready integration of VIBE with Supabase and the workforce orchestrator. Key achievements:

✅ **Database schema** - Added user_id column to vibe_messages
✅ **Service layer** - VibeMessageService and VibeAgentActionService
✅ **React hooks** - useVibeMessages and useVibeAgentActions
✅ **VibeDashboard refactoring** - Cleaner, more maintainable code
✅ **Integration examples** - Complete working examples
✅ **Comprehensive documentation** - Full README and guides
✅ **Type safety** - All code passes TypeScript strict checks

### Files Created/Modified

**New Files:**

- `supabase/migrations/20251116000002_add_user_id_to_vibe_messages.sql`
- `src/features/vibe/services/vibe-message-service.ts`
- `src/features/vibe/services/vibe-agent-action-service.ts`
- `src/features/vibe/hooks/use-vibe-messages.ts`
- `src/features/vibe/hooks/use-vibe-agent-actions.ts`
- `src/features/vibe/examples/workforce-integration-example.ts`
- `src/features/vibe/README.md`
- `VIBE_IMPLEMENTATION_GUIDE.md`

**Modified Files:**

- `src/features/vibe/pages/VibeDashboard.tsx` (refactored to use services)

### Next Steps

1. **Start Docker Desktop** and run `supabase db reset` to apply migrations
2. **Review the examples** in `src/features/vibe/examples/workforce-integration-example.ts`
3. **Update agent implementations** to use `VibeAgentActionService` for logging
4. **Test the complete flow** in the VIBE dashboard
5. **Monitor action statistics** for insights into agent performance

---

## Support

For questions or issues:

- Review the complete documentation in `src/features/vibe/README.md`
- Check the examples in `src/features/vibe/examples/`
- See CLAUDE.md for project-wide guidelines
