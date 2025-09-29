/**
 * Chat Page - Chat with your purchased AI employees
 * No mock data - loads real purchased employees from marketplace
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
  Sparkles
} from 'lucide-react';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [purchasedEmployees, setPurchasedEmployees] = useState<PurchasedEmployee[]>([]);
  const [activeTabs, setActiveTabs] = useState<ChatTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);

  // Load purchased employees
  useEffect(() => {
    const purchased = JSON.parse(localStorage.getItem('purchasedEmployees') || '[]');
    setPurchasedEmployees(purchased);
  }, []);

  // Get full employee data
  const getEmployeeData = (employeeId: string) => {
    return AI_EMPLOYEES.find(emp => emp.id === employeeId);
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      chatgpt: 'bg-green-500/20 text-green-400 border-green-500/30',
      claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[provider as keyof typeof colors] || colors.chatgpt;
  };

  const handleStartChat = (employee: PurchasedEmployee) => {
    const employeeData = getEmployeeData(employee.id);
    if (!employeeData) return;

    // Check if tab already exists
    const existingTab = activeTabs.find(tab => tab.employeeId === employee.id);
    if (existingTab) {
      setSelectedTab(existingTab.id);
      setIsSelectDialogOpen(false);
      toast.info(`Switched to ${employee.role} chat`);
      return;
    }

    // Create new tab
    const newTab: ChatTab = {
      id: `chat-${Date.now()}`,
      employeeId: employee.id,
      role: employee.role,
      provider: employee.provider,
      isActive: true,
      messages: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Hi! I'm your ${employee.role}. How can I help you today?`,
          timestamp: new Date()
        }
      ]
    };

    setActiveTabs(prev => [...prev, newTab]);
    setSelectedTab(newTab.id);
    setIsSelectDialogOpen(false);
    toast.success(`Started chat with ${employee.role}`);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedTab) return;

    const activeTab = activeTabs.find(tab => tab.id === selectedTab);
    if (!activeTab) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I'm processing your request as your ${activeTab.role}. This would connect to ${activeTab.provider} API in production.`,
        timestamp: new Date()
      };

      setActiveTabs(prev => prev.map(tab => {
        if (tab.id === selectedTab) {
          return {
            ...tab,
            messages: [...tab.messages, aiMessage]
          };
        }
        return tab;
      }));
    }, 1000);
  };

  const handleCloseTab = (tabId: string) => {
    setActiveTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (selectedTab === tabId) {
      setSelectedTab(activeTabs[0]?.id || null);
    }
  };

  const activeTabData = activeTabs.find(tab => tab.id === selectedTab);

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
            </p>
          </div>
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

                      return (
                        <button
                          key={employee.id}
                          onClick={() => handleStartChat(employee)}
                          className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
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
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button onClick={handleSendMessage} className="bg-primary">
                        Send
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
