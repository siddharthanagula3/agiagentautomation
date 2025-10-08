/**
 * Chat Wrapper - Conditional UI for Agent SDK vs Regular Chat
 * Replaces chat UI only for ChatGPT-powered AI Employees channel
 * Keeps existing workflows intact for regular users
 */

import React from 'react';
import { useAuthStore } from '@/stores/unified-auth-store';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { AgentSDKChatUI } from './AgentSDKChatUI';
import ChatPageEnhanced from '@/pages/chat/ChatPageEnhanced';
import ChatPage from '@/pages/chat/ChatPage';

interface ChatWrapperProps {
  conversation?: {
    id: string;
    channel?: string;
    employeeId?: string;
    employeeRole?: string;
    employeeName?: string;
    userId?: string;
  };
  className?: string;
}

/**
 * Determines if the conversation is with ChatGPT-powered AI Employees
 */
function isAgentChannel(conversation?: ChatWrapperProps['conversation']): boolean {
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
 * Chat Wrapper Component
 * Conditionally renders Agent SDK ChatUI for AI employees or regular chat for humans
 */
export const ChatWrapper: React.FC<ChatWrapperProps> = ({ 
  conversation, 
  className 
}) => {
  const { user } = useAuthStore();
  
  // Determine if this is an AI employee channel
  const isAgent = isAgentChannel(conversation);
  
  // If it's an AI employee channel, render Agent SDK ChatUI
  if (isAgent && conversation?.employeeId && conversation?.employeeRole && conversation?.employeeName) {
    return (
      <AgentSDKChatUI
        conversationId={conversation.id}
        userId={user?.id || conversation.userId || ''}
        employeeId={conversation.employeeId}
        employeeRole={conversation.employeeRole}
        employeeName={conversation.employeeName}
        className={className}
        onSessionCreated={(session) => {
          console.log('[ChatWrapper] Agent session created:', session);
        }}
        onError={(error) => {
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

/**
 * Hook to determine if current conversation is with AI employees
 */
export function useIsAgentChannel(conversation?: ChatWrapperProps['conversation']): boolean {
  return isAgentChannel(conversation);
}

/**
 * Hook to get AI employee conversation metadata
 */
export function useAgentConversation(conversation?: ChatWrapperProps['conversation']) {
  const isAgent = isAgentChannel(conversation);
  
  if (!isAgent || !conversation) {
    return null;
  }
  
  return {
    employeeId: conversation.employeeId,
    employeeRole: conversation.employeeRole,
    employeeName: conversation.employeeName,
    userId: conversation.userId,
    channel: conversation.channel || 'ai_employees'
  };
}

export default ChatWrapper;
