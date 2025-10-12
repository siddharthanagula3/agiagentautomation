/**
 * Chat Wrapper - Conditional UI for Agent SDK vs Regular Chat
 * Replaces chat UI only for ChatGPT-powered AI Employees channel
 * Keeps existing workflows intact for regular users
 */

import React from 'react';
import { useAuthStore } from '@/stores/unified-auth-store';
import { AgentSDKChatUI } from './AgentSDKChatUI';
import ChatPageEnhanced from '@/pages/chat/ChatPageEnhanced';
import { isAgentChannel, type ChatConversation } from './chat-utils';

interface ChatWrapperProps {
  conversation?: ChatConversation;
  className?: string;
}

/**
 * Chat Wrapper Component
 * Conditionally renders Agent SDK ChatUI for AI employees or regular chat for humans
 */
export const ChatWrapper: React.FC<ChatWrapperProps> = ({
  conversation,
  className,
}) => {
  const { user } = useAuthStore();

  // Determine if this is an AI employee channel
  const isAgent = isAgentChannel(conversation);

  // If it's an AI employee channel, render Agent SDK ChatUI
  if (
    isAgent &&
    conversation?.employeeId &&
    conversation?.employeeRole &&
    conversation?.employeeName
  ) {
    return (
      <AgentSDKChatUI
        conversationId={conversation.id}
        userId={user?.id || conversation.userId || ''}
        employeeId={conversation.employeeId}
        employeeRole={conversation.employeeRole}
        employeeName={conversation.employeeName}
        className={className}
        onSessionCreated={session => {
          if (import.meta.env.DEV) {
            console.log('[ChatWrapper] Agent session created:', session);
          }
        }}
        onError={error => {
          console.error('[ChatWrapper] Agent error:', error);
        }}
      />
    );
  }

  // For regular human conversations, render the enhanced chat
  return (
    <div className={className}>
      <ChatPageEnhanced />
    </div>
  );
};

// Re-export utilities for backward compatibility
export { useIsAgentChannel, useAgentConversation } from './chat-utils';

export default ChatWrapper;
