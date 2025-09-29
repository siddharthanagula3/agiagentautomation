/**
 * Chat Page - Main chat interface with AI employees
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MultiTabChatInterface from '@/components/chat/MultiTabChatInterface';
import { toast } from 'sonner';

// Types for chat interface
interface ChatTab {
  id: string;
  title: string;
  type: 'individual' | 'team' | 'workflow';
  employeeId?: string;
  workflowId?: string;
  teamId?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive?: boolean;
  isPinned?: boolean;
  isTyping?: boolean;
  participants: ChatParticipant[];
  metadata?: {
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    department?: string;
    project?: string;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool_execution' | 'workflow_update';
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  senderRole?: string;
  status?: 'sending' | 'delivered' | 'read' | 'processing' | 'completed' | 'error';
  attachments?: MessageAttachment[];
  toolExecution?: ToolExecution;
  workflowUpdate?: WorkflowUpdate;
  metadata?: {
    edited?: boolean;
    editedAt?: Date;
    replyTo?: string;
    threadId?: string;
    mentions?: string[];
    reactions?: MessageReaction[];
  };
}

interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'document' | 'code' | 'data';
  url: string;
  size: number;
  preview?: string;
}

interface ToolExecution {
  id: string;
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  progress?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  logs?: ExecutionLog[];
}

interface WorkflowUpdate {
  id: string;
  workflowName: string;
  status: 'started' | 'step_completed' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  progress?: number;
  details?: string;
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  type: 'user' | 'ai_employee';
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: Date;
}

interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

interface ChatPageProps {
  className?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const { tabId } = useParams();
  const navigate = useNavigate();
  
  // Sample initial tabs
  const [initialTabs] = useState<ChatTab[]>([
    {
      id: 'general-assistant',
      title: 'General Assistant',
      type: 'individual',
      employeeId: 'ai-assistant',
      unreadCount: 0,
      participants: [
        {
          id: 'user-1',
          name: 'You',
          role: 'User',
          type: 'user',
          status: 'online'
        },
        {
          id: 'ai-assistant',
          name: 'AI Assistant',
          role: 'General Assistant',
          type: 'ai_employee',
          status: 'online'
        }
      ]
    },
    {
      id: 'data-analyst',
      title: 'Data Analyst',
      type: 'individual',
      employeeId: 'ai-analyst',
      unreadCount: 2,
      participants: [
        {
          id: 'user-1',
          name: 'You',
          role: 'User',
          type: 'user',
          status: 'online'
        },
        {
          id: 'ai-analyst',
          name: 'Alex Chen',
          role: 'Senior Data Analyst',
          type: 'ai_employee',
          status: 'online'
        }
      ],
      metadata: {
        tags: ['analytics', 'data'],
        priority: 'high',
        department: 'Analytics'
      }
    },
    {
      id: 'dev-team',
      title: 'Development Team',
      type: 'team',
      teamId: 'dev-team-1',
      unreadCount: 0,
      participants: [
        {
          id: 'user-1',
          name: 'You',
          role: 'User',
          type: 'user',
          status: 'online'
        },
        {
          id: 'ai-developer',
          name: 'David Kim',
          role: 'Full Stack Developer',
          type: 'ai_employee',
          status: 'online'
        },
        {
          id: 'ai-devops',
          name: 'Marcus Johnson',
          role: 'DevOps Engineer',
          type: 'ai_employee',
          status: 'busy'
        }
      ],
      metadata: {
        tags: ['development', 'team'],
        priority: 'medium',
        department: 'Engineering'
      }
    }
  ]);

  // Handlers
  const handleTabChange = (newTabId: string) => {
    navigate(`/dashboard/chat/${newTabId}`, { replace: true });
  };

  const handleMessageSend = (tabId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    console.log('Sending message:', { tabId, message });
    // Here you would typically send the message to your backend
    toast.success('Message sent successfully');
  };

  const handleTabCreate = (tab: Omit<ChatTab, 'id'>) => {
    console.log('Creating new tab:', tab);
    toast.success(`Created new chat: ${tab.title}`);
  };

  const handleTabClose = (tabId: string) => {
    console.log('Closing tab:', tabId);
    toast.info('Chat closed');
    
    // Navigate to first available tab if current tab is being closed
    if (tabId === tabId) {
      navigate('/dashboard/chat', { replace: true });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Chat</h1>
            <p className="text-slate-400 mt-1">
              Communicate with your AI employees and teams
            </p>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0"
      >
        <MultiTabChatInterface
          className="h-full"
          initialTabs={initialTabs}
          maxTabs={8}
          allowTabCreation={true}
          showParticipants={true}
          enableVoiceMessages={true}
          enableFileAttachments={true}
          enableToolExecution={true}
          onTabChange={handleTabChange}
          onMessageSend={handleMessageSend}
          onTabCreate={handleTabCreate}
          onTabClose={handleTabClose}
        />
      </motion.div>
    </div>
  );
};

export default ChatPage;