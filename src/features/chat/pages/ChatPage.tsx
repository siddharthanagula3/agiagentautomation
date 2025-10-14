/**
 * Chat Page - Chat with your purchased AI employees
 * Now with real AI provider integration!
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog';
import {
  Bot,
  Plus,
  MessageSquare,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Settings,
  Paperclip,
  Mic,
} from 'lucide-react';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { useTheme } from '@shared/components/theme-provider';
import {
  getEmployeeById,
  listPurchasedEmployees,
} from '@features/workforce/services/supabase-employees';
import {
  createSession,
  listMessages,
  listSessions,
  sendMessage,
} from '@features/chat/services/supabase-chat';
import {
  sendAIMessage,
  isProviderConfigured,
  getConfiguredProviders,
  type AIMessage,
} from '@_core/api/ai-chat-service';
import { TokenUsageWarning } from '@features/chat/components/TokenUsageWarning';
import { ChatErrorBoundary } from '@features/chat/components/ChatErrorBoundary';
import { useChatState } from '@shared/hooks/useChatState';

interface PurchasedEmployee {
  id: string;
  name: string;
  role: string;
  provider: string;
  purchasedAt: string;
}

interface ChatTab {
  id: string;
  employeeId: string;
  role: string;
  provider: string;
  messages: ChatMessage[];
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  return (
    <ChatErrorBoundary>
      <ChatPageContent />
    </ChatErrorBoundary>
  );
};

const ChatPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [purchasedEmployees, setPurchasedEmployees] = useState<
    PurchasedEmployee[]
  >([]);
  const [activeTabs, setActiveTabs] = useState<ChatTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Get active tab data
  const activeTabData = activeTabs.find((tab) => tab.id === selectedTab);

  // Generate object URL previews for selected files
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTabData?.messages]);

  // Focus message input when tab changes
  useEffect(() => {
    if (selectedTab && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedTab]);

  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  // Check configured providers on mount
  useEffect(() => {
    const providers = getConfiguredProviders();
    setConfiguredProviders(providers);
    console.log('Configured AI providers:', providers);

    if (providers.length === 0) {
      toast.error(
        'No AI providers configured. Please add API keys in your .env file.',
        {
          duration: 10000,
          action: {
            label: 'Guide',
            onClick: () => window.open('#api-setup', '_blank'),
          },
        }
      );
    }
  }, []);

  // Load purchased employees
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        if (!user?.id) {
          console.log('No user logged in, skipping employee load');
          setPurchasedEmployees([]);
          return;
        }

        console.log('=== Loading purchased employees ===');
        console.log('User ID:', user.id);
        const rows = await listPurchasedEmployees(user.id);

        if (!isMounted) return;

        console.log('Purchased employees raw data:', rows);
        console.log('Number of employees:', rows.length);
        const normalized = rows.map((r) => ({
          id: r.employee_id,
          name: getEmployeeById(r.employee_id)?.role || '',
          role: getEmployeeById(r.employee_id)?.role || '',
          provider: r.provider,
          purchasedAt: r.purchased_at,
        }));
        setPurchasedEmployees(normalized);

        // Load recent sessions
        const sessions = await listSessions(user.id);
        console.log('Chat sessions loaded:', sessions);

        if (!isMounted) return;

        if (sessions.length > 0) {
          // Load first session messages
          const first = sessions[0];
          const msgs = await listMessages(user.id, first.id);
          console.log('Messages loaded for first session:', msgs);

          setActiveTabs([
            {
              id: first.id,
              employeeId: first.employee_id,
              role: first.role,
              provider: first.provider,
              isActive: true,
              messages: msgs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.created_at),
              })),
            },
          ]);
          setSelectedTab(first.id);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        toast.error('Failed to load chat data. Please try refreshing.');
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Get full employee data
  const getEmployeeData = (employeeId: string) => getEmployeeById(employeeId);

  const getProviderColor = (provider: string) => {
    const colors = {
      chatgpt: 'bg-green-500/20 text-green-400 border-green-500/30',
      claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[provider as keyof typeof colors] || colors.chatgpt;
  };

  const handleStartChat = async (employee: PurchasedEmployee) => {
    try {
      console.log('=== Starting chat with employee ===');
      console.log('Employee object:', employee);
      console.log('Employee ID:', employee.id);

      const employeeData = getEmployeeData(employee.id);
      console.log('Employee data lookup result:', employeeData);

      if (!employeeData) {
        console.error('Employee data not found for ID:', employee.id);
        toast.error(`Employee data not found for ID: ${employee.id}`);
        return;
      }

      // Check if provider is configured
      if (!isProviderConfigured(employee.provider)) {
        toast.error(
          `${employee.provider} API key not configured. Please add it to your .env file.`,
          {
            duration: 8000,
          }
        );
        return;
      }

      // Check if tab already exists
      const existingTab = activeTabs.find(
        (tab) => tab.employeeId === employee.id
      );
      if (existingTab) {
        console.log('Tab already exists, switching to it');
        setSelectedTab(existingTab.id);
        setIsSelectDialogOpen(false);
        toast.info(`Switched to ${employee.role} chat`);
        return;
      }

      if (!user?.id) {
        console.error('User not authenticated');
        toast.error('Please sign in to start a chat');
        navigate('/auth/login');
        return;
      }

      // Create session in Supabase
      console.log('Creating new session...');
      const session = await createSession(user.id, {
        employeeId: employee.id,
        role: employee.role,
        provider: employee.provider,
      });
      console.log('Session created:', session);

      // Create welcome message
      const welcomeContent = `Hi! I'm your ${employee.role}. I'm powered by ${employee.provider} and I'm here to help you with ${employeeData.specialty}. How can I assist you today?`;
      const welcomeMessage = await sendMessage(
        user.id,
        session.id,
        'assistant',
        welcomeContent
      );
      console.log('Welcome message sent:', welcomeMessage);

      const newTab: ChatTab = {
        id: session.id,
        employeeId: employee.id,
        role: employee.role,
        provider: employee.provider,
        isActive: true,
        messages: [
          {
            id: welcomeMessage.id,
            role: 'assistant',
            content: welcomeMessage.content,
            timestamp: new Date(welcomeMessage.created_at),
          },
        ],
      };

      setActiveTabs((prev) => [...prev, newTab]);
      setSelectedTab(newTab.id);
      setIsSelectDialogOpen(false);
      toast.success(`Started chat with ${employee.role}`);
      console.log('Chat started successfully');
    } catch (error) {
      console.error('=== ERROR STARTING CHAT ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error(
        'Error stack:',
        error instanceof Error ? error.stack : 'No stack'
      );

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.error('Final error message:', errorMessage);
      toast.error(`Failed to start chat: ${errorMessage}`, { duration: 10000 });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTab || isSending) return;

    // Clear any previous errors
    setError(null);

    const activeTab = activeTabs.find((tab) => tab.id === selectedTab);
    if (!activeTab) {
      console.error('Active tab not found');
      return;
    }

    console.log('Sending message:', message);
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Add user message to UI immediately
    setActiveTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === selectedTab) {
          return {
            ...tab,
            messages: [...tab.messages, userMessage],
          };
        }
        return tab;
      })
    );

    setMessage('');

    // Maintain focus on input after sending
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 0);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Persist user message to database
      await sendMessage(user.id, selectedTab, 'user', userMessage.content);
      console.log('User message saved to database');

      // Check if provider is configured
      if (!isProviderConfigured(activeTab.provider)) {
        throw new Error(`${activeTab.provider} API key not configured`);
      }

      // Prepare conversation history for AI
      const conversationHistory: AIMessage[] = activeTab.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      conversationHistory.push({
        role: 'user',
        content: userMessage.content,
      });

      console.log('Sending to AI provider:', activeTab.provider);

      // Build image attachments from selected files
      const attachments: {
        type: 'image';
        mimeType: string;
        dataBase64: string;
      }[] = [];
      for (const f of files) {
        if (f.type.startsWith('image/')) {
          const buf = await f.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          attachments.push({
            type: 'image',
            mimeType: f.type,
            dataBase64: b64,
          });
        }
      }

      // Get AI response
      const aiResponse = await sendAIMessage(
        activeTab.provider,
        conversationHistory,
        activeTab.role,
        attachments
      );

      console.log('AI response received:', aiResponse);

      // Save AI response to database
      const aiMessageRecord = await sendMessage(
        user.id,
        selectedTab,
        'assistant',
        aiResponse.content
      );

      // Add AI response to UI
      const aiMessage: ChatMessage = {
        id: aiMessageRecord.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(aiMessageRecord.created_at),
      };

      setActiveTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === selectedTab) {
            return { ...tab, messages: [...tab.messages, aiMessage] };
          }
          return tab;
        })
      );

      console.log('Message exchange complete');
      setFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message in chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}. Please check your API configuration.`,
        timestamp: new Date(),
      };

      setActiveTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === selectedTab) {
            return { ...tab, messages: [...tab.messages, errorMessage] };
          }
          return tab;
        })
      );

      toast.error(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSending(false);
      // Maintain focus on input after error
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleCloseTab = (tabId: string) => {
    setActiveTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    if (selectedTab === tabId) {
      setSelectedTab(activeTabs[0]?.id || null);
    }
  };

  // Get theme for dynamic styling
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Comprehensive markdown components for ReactMarkdown with theme support
  const markdownComponents = {
    // Headings - All levels
    h1: ({ children }: unknown) => (
      <h1
        className={cn(
          'mb-3 border-b pb-1 text-2xl font-bold',
          isDark
            ? 'border-gray-600 text-white'
            : 'border-gray-300 text-gray-900'
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: unknown) => (
      <h2
        className={cn(
          'mb-2 text-xl font-bold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: unknown) => (
      <h3
        className={cn(
          'mb-2 text-lg font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: unknown) => (
      <h4
        className={cn(
          'mb-1 text-base font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </h4>
    ),
    h5: ({ children }: unknown) => (
      <h5
        className={cn(
          'mb-1 text-sm font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </h5>
    ),
    h6: ({ children }: unknown) => (
      <h6
        className={cn(
          'mb-1 text-xs font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children }: unknown) => (
      <p
        className={cn(
          'mb-3 leading-relaxed',
          isDark ? 'text-gray-200' : 'text-gray-700'
        )}
      >
        {children}
      </p>
    ),

    // Text formatting
    strong: ({ children }: unknown) => (
      <strong
        className={cn('font-bold', isDark ? 'text-white' : 'text-gray-900')}
      >
        {children}
      </strong>
    ),
    em: ({ children }: unknown) => (
      <em className={cn('italic', isDark ? 'text-gray-300' : 'text-gray-600')}>
        {children}
      </em>
    ),
    del: ({ children }: unknown) => (
      <del
        className={cn(
          'line-through',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}
      >
        {children}
      </del>
    ),
    mark: ({ children }: unknown) => (
      <mark className="rounded bg-yellow-200 px-1 text-black">{children}</mark>
    ),

    // Code blocks and inline code
    code: ({ children, className, inline }: unknown) => {
      if (inline) {
        return (
          <code
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-sm',
              isDark
                ? 'bg-gray-700 text-green-400'
                : 'bg-gray-100 text-green-600'
            )}
          >
            {children}
          </code>
        );
      }
      return (
        <pre
          className={cn(
            'mb-4 overflow-x-auto rounded-lg border p-4',
            isDark
              ? 'border-gray-700 bg-gray-900'
              : 'border-gray-300 bg-gray-50'
          )}
        >
          <code
            className={cn(
              'font-mono text-sm leading-relaxed',
              isDark ? 'text-green-400' : 'text-green-600'
            )}
          >
            {children}
          </code>
        </pre>
      );
    },
    pre: ({ children }: unknown) => (
      <pre
        className={cn(
          'mb-4 overflow-x-auto rounded-lg border p-4',
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'
        )}
      >
        {children}
      </pre>
    ),

    // Lists
    ul: ({ children }: unknown) => (
      <ul
        className={cn(
          'mb-3 list-inside list-disc space-y-1',
          isDark ? 'text-gray-200' : 'text-gray-700'
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children }: unknown) => (
      <ol
        className={cn(
          'mb-3 list-inside list-decimal space-y-1',
          isDark ? 'text-gray-200' : 'text-gray-700'
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children }: unknown) => <li className="mb-1">{children}</li>,

    // Nested lists
    'ul ul': ({ children }: unknown) => (
      <ul className="ml-4 mt-1 list-inside list-disc">{children}</ul>
    ),
    'ol ol': ({ children }: unknown) => (
      <ol className="ml-4 mt-1 list-inside list-decimal">{children}</ol>
    ),
    'ul ol': ({ children }: unknown) => (
      <ol className="ml-4 mt-1 list-inside list-decimal">{children}</ol>
    ),
    'ol ul': ({ children }: unknown) => (
      <ul className="ml-4 mt-1 list-inside list-disc">{children}</ul>
    ),

    // Blockquotes
    blockquote: ({ children }: unknown) => (
      <blockquote
        className={cn(
          'mb-3 rounded-r border-l-4 border-blue-500 py-2 pl-4 italic',
          isDark
            ? 'bg-gray-800/50 text-gray-300'
            : 'bg-gray-100/50 text-gray-600'
        )}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rules
    hr: () => (
      <hr
        className={cn('my-6', isDark ? 'border-gray-600' : 'border-gray-300')}
      />
    ),

    // Links
    a: ({ href, children }: unknown) => (
      <a
        href={href}
        className={cn(
          'underline',
          isDark
            ? 'text-blue-400 decoration-blue-400 hover:text-blue-300 hover:decoration-blue-300'
            : 'text-blue-600 decoration-blue-600 hover:text-blue-500 hover:decoration-blue-500'
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }: unknown) => (
      <div className="mb-4 overflow-x-auto">
        <table
          className={cn(
            'min-w-full rounded-lg border',
            isDark ? 'border-gray-600' : 'border-gray-300'
          )}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: unknown) => (
      <thead className={cn(isDark ? 'bg-gray-800' : 'bg-gray-100')}>
        {children}
      </thead>
    ),
    tbody: ({ children }: unknown) => (
      <tbody className={cn(isDark ? 'bg-gray-900' : 'bg-white')}>
        {children}
      </tbody>
    ),
    tr: ({ children }: unknown) => (
      <tr
        className={cn(
          'border-b',
          isDark ? 'border-gray-600' : 'border-gray-300'
        )}
      >
        {children}
      </tr>
    ),
    th: ({ children }: unknown) => (
      <th
        className={cn(
          'border-r px-4 py-2 text-left font-semibold',
          isDark
            ? 'border-gray-600 text-white'
            : 'border-gray-300 text-gray-900'
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }: unknown) => (
      <td
        className={cn(
          'border-r px-4 py-2',
          isDark
            ? 'border-gray-600 text-gray-200'
            : 'border-gray-300 text-gray-700'
        )}
      >
        {children}
      </td>
    ),

    // Task lists (GitHub Flavored Markdown)
    input: ({ type, checked, ...props }: unknown) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 accent-blue-500"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },

    // Definition lists
    dl: ({ children }: unknown) => <dl className="mb-3">{children}</dl>,
    dt: ({ children }: unknown) => (
      <dt
        className={cn(
          'mb-1 font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {children}
      </dt>
    ),
    dd: ({ children }: unknown) => (
      <dd
        className={cn('mb-2 ml-4', isDark ? 'text-gray-200' : 'text-gray-700')}
      >
        {children}
      </dd>
    ),

    // Images
    img: ({ src, alt, ...props }: unknown) => (
      <img
        src={src}
        alt={alt}
        className={cn(
          'mb-3 h-auto max-w-full rounded-lg border',
          isDark ? 'border-gray-600' : 'border-gray-300'
        )}
        {...props}
      />
    ),

    // Line breaks
    br: () => <br className="mb-1" />,

    // Subscript and superscript
    sub: ({ children }: unknown) => (
      <sub
        className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}
      >
        {children}
      </sub>
    ),
    sup: ({ children }: unknown) => (
      <sup
        className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}
      >
        {children}
      </sup>
    ),

    // Keyboard keys
    kbd: ({ children }: unknown) => (
      <kbd
        className={cn(
          'rounded border px-2 py-1 font-mono text-xs',
          isDark
            ? 'border-gray-600 bg-gray-700 text-gray-200'
            : 'border-gray-300 bg-gray-100 text-gray-700'
        )}
      >
        {children}
      </kbd>
    ),

    // Abbreviations
    abbr: ({ title, children }: unknown) => (
      <abbr
        title={title}
        className={cn(
          'cursor-help border-b border-dotted',
          isDark ? 'border-gray-400' : 'border-gray-500'
        )}
      >
        {children}
      </abbr>
    ),

    // Citations
    cite: ({ children }: unknown) => (
      <cite
        className={cn('italic', isDark ? 'text-gray-400' : 'text-gray-500')}
      >
        {children}
      </cite>
    ),

    // Small text
    small: ({ children }: unknown) => (
      <small
        className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}
      >
        {children}
      </small>
    ),

    // Time
    time: ({ children }: unknown) => (
      <time className={cn(isDark ? 'text-gray-400' : 'text-gray-500')}>
        {children}
      </time>
    ),
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Chat</h1>
            <p className="mt-1 text-slate-400">
              Communicate with your AI employees
              {configuredProviders.length > 0 && (
                <span className="ml-2 text-green-400">
                  • {configuredProviders.join(', ')} configured
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {configuredProviders.length === 0 && (
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/settings')}
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Setup API Keys
              </Button>
            )}
            <Dialog
              open={isSelectDialogOpen}
              onOpenChange={setIsSelectDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Select AI Employee</DialogTitle>
                  <DialogDescription>
                    Choose from your hired AI employees to start a conversation
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {purchasedEmployees.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bot className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No AI Employees Yet
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        Hire AI employees from the marketplace to start chatting
                      </p>
                      <Button onClick={() => navigate('/marketplace')}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Go to Marketplace
                      </Button>
                    </div>
                  ) : (
                    <div className="grid max-h-[400px] gap-3 overflow-y-auto">
                      {purchasedEmployees.map((employee) => {
                        const employeeData = getEmployeeData(employee.id);
                        if (!employeeData) return null;

                        const providerConfigured = isProviderConfigured(
                          employee.provider
                        );

                        return (
                          <button
                            key={employee.id}
                            onClick={() => handleStartChat(employee)}
                            disabled={!providerConfigured}
                            className={cn(
                              'flex items-center space-x-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent',
                              !providerConfigured &&
                                'cursor-not-allowed opacity-50'
                            )}
                          >
                            <img
                              src={employeeData.avatar}
                              alt={employee.role}
                              className="h-12 w-12 rounded-full"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground">
                                {employee.role}
                              </div>
                              <div className="truncate text-sm text-muted-foreground">
                                {employeeData.specialty}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                getProviderColor(employee.provider)
                              )}
                            >
                              {employee.provider}
                              {!providerConfigured && ' ⚠️'}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-h-0 flex-1"
      >
        {activeTabs.length === 0 ? (
          <Card className="h-full border-border bg-card">
            <CardContent className="flex h-full flex-col items-center justify-center p-12">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-6 h-20 w-20 text-muted-foreground" />
                <h2 className="mb-3 text-2xl font-bold text-foreground">
                  No Active Chats
                </h2>
                <p className="mb-6 max-w-md text-muted-foreground">
                  {purchasedEmployees.length === 0
                    ? 'Hire AI employees from the marketplace to start chatting with them'
                    : "Click 'New Chat' to start a conversation with your AI employees"}
                </p>
                {purchasedEmployees.length === 0 ? (
                  <Button
                    onClick={() => navigate('/marketplace')}
                    className="bg-primary"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Go to Marketplace
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsSelectDialogOpen(true)}
                    className="bg-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Start Your First Chat
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full gap-4">
            {/* Chat Tabs Sidebar */}
            <div className="w-64 space-y-2">
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="mb-3 font-semibold text-foreground">
                    Active Chats
                  </h3>
                  <div className="space-y-2">
                    {activeTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
                          selectedTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center space-x-2">
                          <Bot className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm font-medium">
                            {tab.role}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(tab.id);
                          }}
                          className="ml-2 flex-shrink-0 hover:text-destructive"
                        >
                          ×
                        </button>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 border-border bg-card">
              <CardContent className="flex h-full flex-col p-6">
                {activeTabData && (
                  <>
                    {/* Chat Header */}
                    <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {activeTabData.role}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              getProviderColor(activeTabData.provider)
                            )}
                          >
                            {activeTabData.provider}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
                      {activeTabData.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            msg.role === 'user'
                              ? 'justify-end'
                              : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-lg p-4',
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                  components={markdownComponents}
                                  remarkPlugins={[
                                    remarkGfm,
                                    remarkBreaks,
                                    remarkMath,
                                  ]}
                                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                  skipHtml={false}
                                  linkTarget="_blank"
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-sm">
                                {msg.content}
                              </p>
                            )}
                            <span className="mt-1 block text-xs opacity-70">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="flex items-center space-x-2 rounded-lg bg-muted p-4 text-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Token Usage Warning */}
                    {activeTabData && (
                      <TokenUsageWarning
                        provider={
                          activeTabData.provider as
                            | 'openai'
                            | 'anthropic'
                            | 'google'
                            | 'perplexity'
                        }
                        className="mb-4"
                      />
                    )}

                    {/* Message Input */}
                    <div className="flex items-center gap-2">
                      {/* File attach */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files || []))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      {/* Mic record (placeholder: logs blob) */}
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn('px-2', isRecording && 'text-red-400')}
                        onClick={async () => {
                          if (isRecording) {
                            mediaRecorderRef.current?.stop();
                            setIsRecording(false);
                            return;
                          }
                          try {
                            const stream =
                              await navigator.mediaDevices.getUserMedia({
                                audio: true,
                              });
                            const mr = new MediaRecorder(stream);
                            recordedChunksRef.current = [];
                            mr.ondataavailable = (e) => {
                              if (e.data.size > 0)
                                recordedChunksRef.current.push(e.data);
                            };
                            mr.onstop = () => {
                              const blob = new Blob(recordedChunksRef.current, {
                                type: 'audio/webm',
                              });
                              console.log(
                                'Recorded audio (send to STT):',
                                blob
                              );
                            };
                            mediaRecorderRef.current = mr;
                            mr.start();
                            setIsRecording(true);
                          } catch (e) {
                            toast.error('Microphone permission denied');
                          }
                        }}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && !isSending && handleSendMessage()
                        }
                        placeholder={
                          isSending ? 'Sending...' : 'Type your message...'
                        }
                        disabled={isSending}
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                      {/* Selected file thumbnails */}
                      {filePreviews.length > 0 && (
                        <div className="flex items-center gap-2">
                          {filePreviews.slice(0, 3).map((src, idx) => (
                            <div
                              key={idx}
                              className="relative h-10 w-10 overflow-hidden rounded border border-border"
                            >
                              <img
                                src={src}
                                alt={`attachment-${idx}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {filePreviews.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{filePreviews.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !message.trim()}
                        className="bg-primary"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ChatPage;
