/**
 * Workforce Orchestrator Integration Example
 *
 * Shows how to integrate VIBE message and action services
 * with the workforce orchestrator for complete agent workflows
 */

import { VibeMessageService } from '../services/vibe-message-service';
import { VibeAgentActionService } from '../services/vibe-agent-action-service';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';

/**
 * Example: Complete Message Processing with Agent Actions
 *
 * This example shows the complete flow:
 * 1. User sends message
 * 2. Workforce orchestrator processes request
 * 3. Agents log their actions
 * 4. Response is streamed back to user
 */
export async function processUserRequestExample(params: {
  sessionId: string;
  userId: string;
  userInput: string;
  conversationHistory: Array<{ role: string; content: string }>;
}) {
  const { sessionId, userId, userInput, conversationHistory } = params;

  // Step 1: Create user message
  const userMessage = await VibeMessageService.createMessage({
    sessionId,
    userId,
    role: 'user',
    content: userInput,
  });

  console.log('✅ User message created:', userMessage.id);

  // Step 2: Process request through workforce orchestrator
  const orchestratorResponse =
    await workforceOrchestratorRefactored.processRequest({
      userId,
      input: userInput,
      mode: 'chat',
      sessionId,
      conversationHistory: [...conversationHistory, { role: 'user', content: userInput }],
    });

  if (!orchestratorResponse.success || !orchestratorResponse.chatResponse) {
    throw new Error(orchestratorResponse.error || 'Orchestrator failed');
  }

  console.log('✅ Orchestrator processed request');
  console.log('   Assigned Employee:', orchestratorResponse.assignedEmployee);

  // Step 3: Create assistant message with streaming
  const assistantMessage = await VibeMessageService.createMessage({
    sessionId,
    userId,
    role: 'assistant',
    content: orchestratorResponse.chatResponse,
    employeeName: orchestratorResponse.assignedEmployee || 'AI Assistant',
    isStreaming: false,
  });

  console.log('✅ Assistant message created:', assistantMessage.id);

  return {
    userMessage,
    assistantMessage,
    orchestratorResponse,
  };
}

/**
 * Example: Agent Logging Actions During Execution
 *
 * This example shows how agents can log their actions
 * while executing tasks
 */
export async function agentExecutionExample(params: {
  sessionId: string;
  agentName: string;
  task: string;
}) {
  const { sessionId, agentName, task } = params;

  console.log(`🤖 Agent "${agentName}" starting task: ${task}`);

  // Example 1: Log file read
  const fileReadAction = await VibeAgentActionService.createAction({
    sessionId,
    agentName,
    actionType: 'file_read',
    metadata: {
      file_path: 'src/components/Button.tsx',
      purpose: 'Reading component to understand structure',
    },
  });

  // Simulate file read
  await new Promise((resolve) => setTimeout(resolve, 500));

  await VibeAgentActionService.completeAction(fileReadAction.id, {
    lines_read: 50,
    summary: 'Button component uses Tailwind CSS',
  });

  console.log('✅ File read logged');

  // Example 2: Log file edit with helper
  const fileEdit = await VibeAgentActionService.logFileEdit({
    sessionId,
    agentName,
    filePath: 'src/components/Button.tsx',
    changes: 'Added hover state animation',
  });

  // Simulate editing
  await new Promise((resolve) => setTimeout(resolve, 800));

  await fileEdit.complete('File successfully updated with animations');

  console.log('✅ File edit logged');

  // Example 3: Log command execution with helper
  const command = await VibeAgentActionService.logCommandExecution({
    sessionId,
    agentName,
    command: 'npm run test',
    cwd: '/workspace',
  });

  // Simulate command execution
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await command.complete('All tests passed (12/12)', 0);

  console.log('✅ Command execution logged');

  // Example 4: Log app preview
  await VibeAgentActionService.logAppPreview({
    sessionId,
    agentName,
    previewUrl: 'http://localhost:3000',
    port: 3000,
  });

  console.log('✅ App preview logged');

  // Example 5: Log tool execution
  const toolExec = await VibeAgentActionService.logToolExecution({
    sessionId,
    agentName,
    toolName: 'WebSearch',
    toolInput: {
      query: 'React best practices 2025',
      limit: 5,
    },
  });

  // Simulate tool execution
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await toolExec.complete({
    results: [
      { title: 'React Server Components', url: 'https://...' },
      { title: 'React 19 Features', url: 'https://...' },
    ],
  });

  console.log('✅ Tool execution logged');

  return {
    message: 'All actions logged successfully',
    totalActions: 5,
  };
}

/**
 * Example: Streaming Response with Real-time Updates
 *
 * This example shows how to stream responses word-by-word
 * and update the database in real-time
 */
export async function streamingResponseExample(params: {
  sessionId: string;
  userId: string;
  agentName: string;
  fullResponse: string;
  onChunk?: (chunk: string) => void;
}) {
  const { sessionId, userId, agentName, fullResponse, onChunk } = params;

  // Create initial streaming message
  const messageId = crypto.randomUUID();
  let currentContent = '';

  await VibeMessageService.createMessage({
    sessionId,
    userId,
    role: 'assistant',
    content: '',
    employeeName: agentName,
    isStreaming: true,
  });

  // Split response into chunks (words)
  const chunks = fullResponse.split(/(\s+)/).filter((part) => part.length);

  // Stream each chunk
  for (const chunk of chunks) {
    currentContent += chunk;

    // Update message in database
    await VibeMessageService.updateMessage(messageId, {
      content: currentContent,
    });

    // Notify UI
    if (onChunk) {
      onChunk(chunk);
    }

    // Small delay for realistic streaming
    await new Promise((resolve) => setTimeout(resolve, 40));
  }

  // Mark streaming as complete
  await VibeMessageService.updateMessage(messageId, {
    content: fullResponse,
    is_streaming: false,
  });

  console.log('✅ Response streaming complete');

  return { messageId, finalContent: fullResponse };
}

/**
 * Example: Error Handling and Failed Actions
 *
 * This example shows how to handle errors and log failed actions
 */
export async function errorHandlingExample(params: {
  sessionId: string;
  agentName: string;
}) {
  const { sessionId, agentName } = params;

  try {
    // Log command that will fail
    const command = await VibeAgentActionService.logCommandExecution({
      sessionId,
      agentName,
      command: 'npm run build',
      cwd: '/workspace',
    });

    // Simulate command failure
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Log the failure
    await command.fail('Build failed: TypeScript errors found', 1);

    console.log('❌ Command failed (logged properly)');

    // Try file edit that fails
    const fileEdit = await VibeAgentActionService.logFileEdit({
      sessionId,
      agentName,
      filePath: 'src/missing-file.tsx',
      changes: 'Attempted to update file',
    });

    await fileEdit.fail('File not found: src/missing-file.tsx');

    console.log('❌ File edit failed (logged properly)');
  } catch (error) {
    console.error('Error during example:', error);
  }

  // Get action statistics
  const stats = await VibeAgentActionService.getActionStats(sessionId);

  console.log('📊 Action Statistics:', {
    total: stats.total,
    completed: stats.completed,
    failed: stats.failed,
    in_progress: stats.in_progress,
  });

  return stats;
}

/**
 * Example: Complete End-to-End Workflow
 *
 * This example demonstrates a complete workflow from user input
 * to final response with all actions logged
 */
export async function completeWorkflowExample() {
  const sessionId = 'example-session-123';
  const userId = 'user-456';
  const agentName = 'code-reviewer';

  console.log('🚀 Starting complete workflow example\n');

  // 1. Process user request
  console.log('Step 1: Processing user request...');
  const result = await processUserRequestExample({
    sessionId,
    userId,
    userInput: 'Review the Button component and add animations',
    conversationHistory: [],
  });

  console.log(`   User Message ID: ${result.userMessage.id}`);
  console.log(`   Assistant Message ID: ${result.assistantMessage.id}\n`);

  // 2. Agent executes task with logging
  console.log('Step 2: Agent executing task with action logging...');
  await agentExecutionExample({
    sessionId,
    agentName,
    task: 'Review and enhance Button component',
  });

  console.log('');

  // 3. Get final statistics
  console.log('Step 3: Getting final statistics...');
  const stats = await VibeAgentActionService.getActionStats(sessionId);

  console.log('📊 Final Statistics:');
  console.log(`   Total Actions: ${stats.total}`);
  console.log(`   Completed: ${stats.completed}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   In Progress: ${stats.in_progress}`);
  console.log(`   By Type:`, stats.by_type);
  console.log(`   By Agent:`, stats.by_agent);

  console.log('\n✅ Complete workflow example finished!');

  return {
    session: sessionId,
    messages: {
      user: result.userMessage.id,
      assistant: result.assistantMessage.id,
    },
    stats,
  };
}

// Export all examples
export const examples = {
  processUserRequest: processUserRequestExample,
  agentExecution: agentExecutionExample,
  streamingResponse: streamingResponseExample,
  errorHandling: errorHandlingExample,
  completeWorkflow: completeWorkflowExample,
};
