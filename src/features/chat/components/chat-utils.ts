/**
 * Chat Utilities - Helper functions for chat components
 */

export interface ChatConversation {
  id: string;
  channel?: string;
  employeeId?: string;
  employeeRole?: string;
  employeeName?: string;
  userId?: string;
}

/**
 * Determines if the conversation is with ChatGPT-powered AI Employees
 */
export function isAgentChannel(conversation?: ChatConversation): boolean {
  // Check for explicit channel flag
  if (conversation?.channel === 'ai_employees') {
    return true;
  }

  // Check if it's a purchased AI employee conversation
  if (conversation?.employeeId && conversation?.employeeRole) {
    return true;
  }

  // Default to false for regular human conversations
  return false;
}

/**
 * Hook to determine if current conversation is with AI employees
 */
export function useIsAgentChannel(conversation?: ChatConversation): boolean {
  return isAgentChannel(conversation);
}

/**
 * Hook to get AI employee conversation metadata
 */
export function useAgentConversation(conversation?: ChatConversation) {
  const isAgent = isAgentChannel(conversation);

  if (!isAgent || !conversation) {
    return null;
  }

  return {
    isAgent: true,
    employeeId: conversation.employeeId,
    employeeRole: conversation.employeeRole,
    employeeName: conversation.employeeName,
    conversationId: conversation.id,
    userId: conversation.userId,
  };
}
