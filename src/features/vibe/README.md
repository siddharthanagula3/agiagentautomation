# VIBE (Visual Interactive Build Environment) Documentation

## Overview

VIBE is a multi-agent collaborative workspace inspired by MGX.dev and MetaGPT. It provides a real-time, interactive environment where AI agents work together to complete complex tasks while users observe and interact with their progress.

## Architecture

### Database Schema

#### Core Tables

1. **vibe_sessions**
   - Stores chat sessions for the VIBE interface
   - Links to users via `user_id`
   - Contains session metadata and timestamps

2. **vibe_messages**
   - Stores all conversation messages (user, assistant, system)
   - Links to sessions via `session_id`
   - Links to users via `user_id` (added in migration 20251116000002)
   - Tracks employee information for agent messages
   - Supports streaming state with `is_streaming` flag

3. **vibe_files**
   - Stores file uploads and references
   - Links to sessions and users
   - Contains file metadata (size, type, storage URL)

4. **vibe_agent_actions**
   - Tracks real-time agent actions for visualization
   - Supports action types: file_edit, command_execution, app_preview, etc.
   - Contains action metadata, status, and results

5. **vibe_tasks**
   - Tracks parallel task execution
   - Manages task dependencies
   - Monitors task status and results

## Message Flow

### Complete User Message Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Input                                                   │
│    - User types message in VibeMessageInput                     │
│    - Optional: Attaches files                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VibeDashboard.handleSendMessage()                            │
│    - Creates user message object                                │
│    - Adds to local state (optimistic update)                    │
│    - Inserts to vibe_messages table                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Workforce Orchestrator                                       │
│    - workforceOrchestratorRefactored.processRequest()           │
│    - Plans: Analyzes request and creates execution plan         │
│    - Delegates: Selects optimal AI employees                    │
│    - Executes: Runs tasks with selected employees               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Response Streaming                                           │
│    - streamAssistantResponse() chunks the response              │
│    - Updates UI incrementally (word by word)                    │
│    - Sets is_streaming: true → false                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Persistence                                         │
│    - Final response inserted to vibe_messages                   │
│    - Includes employee_name and employee_role                   │
│    - Realtime subscription triggers UI update                   │
└─────────────────────────────────────────────────────────────────┘
```

### Real-Time Updates

VIBE uses Supabase Realtime to provide live updates across three channels:

#### 1. Message Subscription (VibeDashboard.tsx)
```typescript
// Subscribes to vibe_messages table
// Updates AgentPanel message list when new messages arrive
supabase
  .channel(`vibe-messages-${sessionId}`)
  .on('postgres_changes', ...)
  .subscribe()
```

#### 2. File Subscription (use-vibe-realtime.ts)
```typescript
// Subscribes to vibe_files table
// Updates file tree when files are created/modified/deleted
supabase
  .channel(`vibe-files-${sessionId}`)
  .on('postgres_changes', ...)
  .subscribe()
```

#### 3. Agent Action Subscription (use-vibe-realtime.ts)
```typescript
// Subscribes to vibe_agent_actions table
// Updates WorkingStep timeline and terminal logs
supabase
  .channel(`vibe-agent-actions-${sessionId}`)
  .on('postgres_changes', ...)
  .subscribe()
```

## Components

### Page Components

#### VibeDashboard.tsx
**Location:** `src/features/vibe/pages/VibeDashboard.tsx`

**Purpose:** Main orchestration component for VIBE interface

**Key Responsibilities:**
- Session management (create/load sessions)
- Message handling (send/receive/stream)
- Workforce orchestrator integration
- Real-time subscription coordination
- State synchronization between UI and database

**Key Functions:**
- `ensureSession()`: Creates or loads user's VIBE session
- `handleSendMessage()`: Processes user input through workforce orchestrator
- `streamAssistantResponse()`: Chunks AI responses for real-time display
- `handleAgentAction()`: Converts agent actions to working steps for UI

### Layout Components

#### VibeLayout.tsx
**Location:** `src/features/vibe/layouts/VibeLayout.tsx`

**Purpose:** Provides the main container and navigation for VIBE

#### VibeSplitView.tsx
**Location:** `src/features/vibe/layouts/VibeSplitView.tsx`

**Purpose:** Implements resizable split pane layout for agent panel and output panel

### Feature Components

#### AgentPanel
**Location:** `src/features/vibe/components/agent-panel/AgentPanel.tsx`

**Purpose:** Displays active agent status, working steps, and message history

**Sub-components:**
- `AgentStatusCard`: Shows current agent status (idle/working/completed/error)
- `WorkingProcessSection`: Displays task execution timeline
- `AgentMessageList`: Renders conversation history with streaming support

#### OutputPanel
**Location:** `src/features/vibe/pages/VibeDashboard.tsx:39-51`

**Purpose:** Container for editor and app viewer

**Sub-components:**
- `ViewSelector`: Switches between editor and app viewer modes
- `EditorView`: Monaco-based code editor with file tree
- `AppViewerView`: Live app preview with responsive viewport controls

#### VibeMessageInput
**Location:** `src/features/vibe/components/input/VibeMessageInput.tsx`

**Purpose:** Message input with file attachment support

### Hooks

#### useVibeRealtime
**Location:** `src/features/vibe/hooks/use-vibe-realtime.ts`

**Purpose:** Manages all real-time subscriptions for VIBE

**Subscriptions:**
1. **vibe_files**: Updates file tree metadata
2. **vibe_agent_actions**: Hydrates terminal logs and working steps

**Features:**
- Automatic reconnection on error
- Initial data loading
- File tree synchronization
- Terminal command mapping
- App preview URL updates

## Services

### VibeMessageService
**Location:** `src/features/vibe/services/vibe-message-service.ts`

**Purpose:** Complete CRUD operations for vibe_messages

**Key Methods:**

#### getMessages(sessionId)
Fetches all messages for a session, ordered chronologically

#### createMessage(params)
Creates a new message in the database with proper typing

#### updateMessage(messageId, updates)
Updates an existing message (used for streaming updates)

#### processUserMessage(params)
**Complete message processing flow:**
1. Creates user message in database
2. Calls workforce orchestrator with conversation history
3. Streams response chunks with callbacks
4. Saves final assistant message
5. Handles errors gracefully

**Parameters:**
```typescript
{
  sessionId: string;
  userId: string;
  content: string;
  conversationHistory: Array<{ role: string; content: string }>;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}
```

#### subscribeToMessages(sessionId, onMessage, onError)
Creates real-time subscription with cleanup function

#### getRecentMessages(sessionId, limit)
Fetches latest N messages for session

#### clearSessionMessages(sessionId)
Deletes all messages for a session

## State Management

### useVibeViewStore
**Location:** `src/features/vibe/stores/vibe-view-store.ts`

**Purpose:** Manages all UI state for VIBE workspace

**State Sections:**

1. **View State**
   - `activeView`: 'editor' | 'app-viewer'
   - `splitLayout`: Split pane dimensions
   - `followingAgent`: Auto-scroll to agent actions

2. **Editor State**
   - `currentFile`: Active file path
   - `openFiles`: List of open file tabs
   - `content`: Current file content
   - `cursor`: Cursor position
   - `language`: Syntax highlighting language

3. **Terminal State**
   - `history`: Command execution history
   - `activeCommand`: Currently running command

4. **App Viewer State**
   - `url`: Preview URL
   - `viewport`: Mobile/tablet/desktop mode
   - `isLoading`: Loading state

5. **File Tree**
   - `fileTree`: Hierarchical file structure
   - `fileMetadata`: Map<path, metadata> for fast lookups

### useVibeChatStore
**Location:** `src/features/vibe/stores/vibe-chat-store.ts`

**Purpose:** Manages session state

**State:**
- `currentSessionId`: Active VIBE session
- Session metadata

## Integration with Workforce Orchestrator

### Orchestrator Call Flow

```typescript
// 1. VibeDashboard calls orchestrator
const response = await workforceOrchestratorRefactored.processRequest({
  userId: user.id,
  input: content,
  mode: 'chat',
  sessionId,
  conversationHistory: [...messages, newUserMessage]
});

// 2. Orchestrator returns response
if (response.success && response.chatResponse) {
  // 3. Stream response to UI
  await streamAssistantResponse(messageId, response.chatResponse);

  // 4. Save to database
  await supabase.from('vibe_messages').insert({
    role: 'assistant',
    content: response.chatResponse,
    employee_name: response.assignedEmployee
  });
}
```

### Agent Actions Tracking

During task execution, agents can log actions to `vibe_agent_actions`:

```typescript
// Backend (inside agent execution)
await supabase.from('vibe_agent_actions').insert({
  session_id: sessionId,
  agent_name: 'code-reviewer',
  action_type: 'file_edit',
  status: 'in_progress',
  metadata: {
    file_path: 'src/app.ts',
    changes: 'Added error handling'
  }
});

// Frontend (useVibeRealtime receives update)
// Automatically converts to WorkingStep and updates UI
```

## Usage Examples

### Basic Message Sending

```typescript
import { VibeMessageService } from '@features/vibe/services/vibe-message-service';

// Process user message with streaming
const result = await VibeMessageService.processUserMessage({
  sessionId: 'session-123',
  userId: 'user-456',
  content: 'Create a React component for user profiles',
  conversationHistory: messages,
  onChunk: (chunk) => console.log('Chunk:', chunk),
  onComplete: (response) => console.log('Done:', response),
  onError: (error) => console.error('Failed:', error)
});
```

### Real-Time Subscription

```typescript
import { VibeMessageService } from '@features/vibe/services/vibe-message-service';

// Subscribe to messages
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

// Cleanup when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Custom Agent Actions

```typescript
// Backend: Log agent action
await supabase.from('vibe_agent_actions').insert({
  session_id: sessionId,
  agent_name: 'debugger',
  action_type: 'command_execution',
  status: 'in_progress',
  metadata: {
    command: 'npm test',
    description: 'Running test suite'
  }
});

// Update when complete
await supabase.from('vibe_agent_actions')
  .update({
    status: 'completed',
    result: { exit_code: 0, output: 'All tests passed' }
  })
  .eq('id', actionId);
```

## Performance Considerations

### Database Queries

1. **Indexed Fields**: All queries use indexed columns (session_id, user_id, timestamp)
2. **Pagination**: Use `getRecentMessages(sessionId, limit)` for large message histories
3. **RLS Policies**: All tables have Row Level Security for secure multi-tenant access

### Real-Time Optimization

1. **Channel Cleanup**: Always unsubscribe from channels when components unmount
2. **Selective Updates**: Use Zustand selectors to prevent unnecessary re-renders
3. **Chunked Streaming**: Response chunking uses 40ms delays to balance UX and performance

### File Tree Performance

1. **Metadata Map**: Uses Map<path, metadata> for O(1) file lookups
2. **Tree Rebuilding**: Only rebuilds tree when files change, not on every update
3. **Lazy Loading**: Editor only fetches file content when user clicks on file

## Security

### Row Level Security (RLS)

All VIBE tables use RLS policies to ensure users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can view messages from their sessions"
  ON vibe_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );
```

### Best Practices

1. **Never bypass RLS**: Use `auth.uid()` in client queries
2. **Validate session ownership**: Check session belongs to user before operations
3. **Sanitize input**: Validate and sanitize all user input before processing
4. **Rate limiting**: Implement rate limits on message sending to prevent abuse

## Troubleshooting

### Common Issues

#### Messages not appearing in UI
- **Check:** Realtime subscription is active
- **Check:** User has permission to view messages (RLS policy)
- **Fix:** Verify `currentSessionId` matches messages in database

#### Streaming not working
- **Check:** `is_streaming` flag set correctly
- **Check:** Message updates trigger UI re-render
- **Fix:** Ensure `streamAssistantResponse()` updates message content incrementally

#### Agent actions not showing
- **Check:** `vibe_agent_actions` subscription active
- **Check:** Actions have correct session_id
- **Fix:** Verify `handleAgentAction()` callback registered

#### File tree not updating
- **Check:** `vibe_files` subscription active
- **Check:** File metadata map updates trigger tree rebuild
- **Fix:** Call `rebuildTree()` after file operations

## Future Enhancements

### Planned Features

1. **Collaborative Editing**: Multi-user real-time code editing
2. **Task Branching**: Create task branches for parallel workflows
3. **Agent Metrics**: Track agent performance and success rates
4. **File Diffing**: Visual diff viewer for file changes
5. **Export Workflows**: Save and share agent workflows

### Extension Points

1. **Custom Agent Types**: Add new action types to `vibe_agent_actions`
2. **File Processors**: Custom file type handlers for editor
3. **Viewport Presets**: Additional device presets for app viewer
4. **Message Formatters**: Rich message rendering (markdown, code blocks)

## Related Files

- `src/features/vibe/pages/VibeDashboard.tsx` - Main dashboard
- `src/features/vibe/hooks/use-vibe-realtime.ts` - Realtime hooks
- `src/features/vibe/stores/vibe-view-store.ts` - View state
- `src/features/vibe/services/vibe-message-service.ts` - Message CRUD
- `supabase/migrations/20251116000001_add_vibe_interface_tables.sql` - Schema
- `supabase/migrations/20251116000002_add_user_id_to_vibe_messages.sql` - Schema update
