/**
 * Chat Page - Chat with your purchased AI employees
 * Now with real AI provider integration!
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  ShoppingCart,
  Loader2,
  AlertCircle,
  Settings
} from 'lucide-react';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/unified-auth-store';
import { getEmployeeById, listPurchasedEmployees } from '@/services/supabase-employees';
import { createSession, listMessages, listSessions, sendMessage } from '@/services/supabase-chat';
import { sendAIMessage, isProviderConfigured, getConfiguredProviders, type AIMessage } from '@/services/ai-chat-service';

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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [purchasedEmployees, setPurchasedEmployees] = useState<PurchasedEmployee[]>([]);
  const [activeTabs, setActiveTabs] = useState<ChatTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  // Check configured providers on mount
  useEffect(() => {
    const providers = getConfiguredProviders();
    setConfiguredProviders(providers);
    console.log('Configured AI providers:', providers);
    
    if (providers.length === 0) {
      toast.error('No AI providers configured. Please add API keys in your .env file.', {
        duration: 10000,
        action: {
          label: 'Guide',
          onClick: () => window.open('#api-setup', '_blank')
        }
      });
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
        const normalized = rows.map(r => ({
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
              messages: msgs.map(m => ({ 
                id: m.id, 
                role: m.role, 
                content: m.content, 
                timestamp: new Date(m.created_at) 
              }))
            }
          ]);
          setSelectedTab(first.id);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        toast.error('Failed to load chat data. Please try refreshing.');
      }
    }
    load();
    return () => { isMounted = false; };
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
        toast.error(`${employee.provider} API key not configured. Please add it to your .env file.`, {
          duration: 8000
        });
        return;
      }

      // Check if tab already exists
      const existingTab = activeTabs.find(tab => tab.employeeId === employee.id);
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
        provider: employee.provider 
      });
      console.log('Session created:', session);

      // Create welcome message
      const welcomeContent = `Hi! I'm your ${employee.role}. I'm powered by ${employee.provider} and I'm here to help you with ${employeeData.specialty}. How can I assist you today?`;
      const welcomeMessage = await sendMessage(user.id, session.id, 'assistant', welcomeContent);
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
            timestamp: new Date(welcomeMessage.created_at) 
          }
        ]
      };

      setActiveTabs(prev => [...prev, newTab]);
      setSelectedTab(newTab.id);
      setIsSelectDialogOpen(false);
      toast.success(`Started chat with ${employee.role}`);
      console.log('Chat started successfully');
    } catch (error) {
      console.error('=== ERROR STARTING CHAT ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
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

    const activeTab = activeTabs.find(tab => tab.id === selectedTab);
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
      timestamp: new Date()
    };

    // Add user message to UI immediately
    setActiveTabs(prev => prev.map(tab => {
      if (tab.id === selectedTab) {
        return {
          ...tab,
          messages: [...tab.messages, userMessage]
        };
      }
      return tab;
    }));

    setMessage('');

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
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      console.log('Sending to AI provider:', activeTab.provider);
      
      // Get AI response
      const aiResponse = await sendAIMessage(
        activeTab.provider,
        conversationHistory,
        activeTab.role
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
        timestamp: new Date(aiMessageRecord.created_at) 
      };

      setActiveTabs(prev => prev.map(tab => {
        if (tab.id === selectedTab) {
          return { ...tab, messages: [...tab.messages, aiMessage] };
        }
        return tab;
      }));

      console.log('Message exchange complete');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message in chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}. Please check your API configuration.`,
        timestamp: new Date()
      };

      setActiveTabs(prev => prev.map(tab => {
        if (tab.id === selectedTab) {
          return { ...tab, messages: [...tab.messages, errorMessage] };
        }
        return tab;
      }));

      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTab = (tabId: string) => {
    setActiveTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (selectedTab === tabId) {
      setSelectedTab(activeTabs[0]?.id || null);
    }
  };

  const activeTabData = activeTabs.find(tab => tab.id === selectedTab);

  function renderMarkdownToHtml(markdown: string): string {
    let html = markdown;
    // Escape HTML first to prevent injection inside our basic replacements
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Code blocks ```
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code.trim()}</code></pre>`);
    // Headings ######..#
    for (let i = 6; i >= 1; i--) {
      const re = new RegExp(`^${'#'.repeat(i)}\s+(.+)$`, 'gm');
      html = html.replace(re, `<h${i}>$1</h${i}>`);
    }
    // Bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic *text* or _text_
    html = html.replace(/(^|\s)\*(?!\*)([^\n*]+)\*(?=\s|$)/g, '$1<em>$2</em>');
    html = html.replace(/(^|\s)_([^\n_]+)_(?=\s|$)/g, '$1<em>$2</em>');
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Horizontal rule ---
    html = html.replace(/^---$/gm, '<hr />');
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Unordered lists - item / * item
    html = html.replace(/^(?:- |\* )(.*(?:\n(?:- |\* ).*)*)/gm, (block) => {
      const items = block.split(/\n/).map(l => l.replace(/^(?:- |\* )/, '').trim());
      return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    });
    // Ordered lists 1. item
    html = html.replace(/^(?:\d+\. )(.*(?:\n(?:\d+\. ).*)*)/gm, (block) => {
      const items = block.split(/\n/).map(l => l.replace(/^\d+\. /, '').trim());
      return `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
    });
    // New lines to paragraphs
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = `<p>${html}</p>`;
    return DOMPurify.sanitize(html);
  }

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
                <AlertCircle className="h-4 w-4 mr-2" />
                Setup API Keys
              </Button>
            )}
            <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
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
                    <div className="text-center py-8">
                      <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No AI Employees Yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Hire AI employees from the marketplace to start chatting
                      </p>
                      <Button onClick={() => navigate('/marketplace')}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Go to Marketplace
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                      {purchasedEmployees.map((employee) => {
                        const employeeData = getEmployeeData(employee.id);
                        if (!employeeData) return null;

                        const providerConfigured = isProviderConfigured(employee.provider);

                        return (
                          <button
                            key={employee.id}
                            onClick={() => handleStartChat(employee)}
                            disabled={!providerConfigured}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left",
                              !providerConfigured && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <img
                              src={employeeData.avatar}
                              alt={employee.role}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground">
                                {employee.role}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {employeeData.specialty}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getProviderColor(employee.provider))}
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
        className="flex-1 min-h-0"
      >
        {activeTabs.length === 0 ? (
          <Card className="h-full border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center h-full p-12">
              <div className="text-center">
                <MessageSquare className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  No Active Chats
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {purchasedEmployees.length === 0 
                    ? "Hire AI employees from the marketplace to start chatting with them"
                    : "Click 'New Chat' to start a conversation with your AI employees"
                  }
                </p>
                {purchasedEmployees.length === 0 ? (
                  <Button onClick={() => navigate('/marketplace')} className="bg-primary">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Go to Marketplace
                  </Button>
                ) : (
                  <Button onClick={() => setIsSelectDialogOpen(true)} className="bg-primary">
                    <Plus className="h-4 w-4 mr-2" />
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
                  <h3 className="font-semibold text-foreground mb-3">Active Chats</h3>
                  <div className="space-y-2">
                    {activeTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                          selectedTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Bot className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{tab.role}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(tab.id);
                          }}
                          className="ml-2 hover:text-destructive flex-shrink-0"
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
              <CardContent className="p-6 flex flex-col h-full">
                {activeTabData && (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">{activeTabData.role}</h3>
                          <Badge variant="outline" className={cn("text-xs", getProviderColor(activeTabData.provider))}>
                            {activeTabData.provider}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {activeTabData.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-4",
                              msg.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div
                                className="prose prose-invert prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(msg.content) }}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <span className="text-xs opacity-70 mt-1 block">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="bg-muted text-foreground rounded-lg p-4 flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                        placeholder={isSending ? "Sending..." : "Type your message..."}
                        disabled={isSending}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
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
