import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Bot, User, Send, Plus, Menu, Settings, ChevronDown, Users, Zap, Star,
  Paperclip, Search, Mic, X, Upload, History, Share2, Crown, CreditCard,
  HelpCircle, Moon, Sun, LogOut, Bell, Shield, Palette, Globe, Brain,
  Target, Workflow, BarChart3, MessageSquare, Clock, Filter, Bookmark,
  UserCircle, Mail, Phone, MapPin, Edit3, Save, Trash2, Download,
  Eye, EyeOff, Copy, ThumbsUp, ThumbsDown, RotateCcw, Share, MoreHorizontal,
  Check, Code, FileText, Sparkles, PenTool
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  model?: string;
  tokensUsed?: number;
  cost?: number;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessage: string;
  messageCount: number;
  starred: boolean;
}

const ChatInterface: React.FC = () => {
  // Core state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Settings and dialogs
  const [showSettings, setShowSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState("AGI Agent 4.0");
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Mock conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "AGI Agent Automation Planning",
      createdAt: "Today",
      lastMessage: "Let's design your AI workforce strategy...",
      messageCount: 12,
      starred: false
    },
    {
      id: "2",
      title: "Data Analysis Pipeline",
      createdAt: "Yesterday",
      lastMessage: "The regression model shows promising results...",
      messageCount: 8,
      starred: true
    },
    {
      id: "3",
      title: "Content Creation Strategy",
      createdAt: "2 days ago",
      lastMessage: "Here's your Q4 content calendar...",
      messageCount: 15,
      starred: false
    },
    {
      id: "4",
      title: "AI Employee Integration",
      createdAt: "3 days ago",
      lastMessage: "Setting up your specialized agents...",
      messageCount: 6,
      starred: false
    },
    {
      id: "5",
      title: "Workflow Optimization",
      createdAt: "1 week ago",
      lastMessage: "Automated 73% of repetitive tasks...",
      messageCount: 22,
      starred: false
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showModelSelector]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      // Cmd/Ctrl + Shift + O to open settings
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setShowSettings(true);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [sidebarOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about: "${inputValue}"\n\nI can help you with this task using our AGI Agent capabilities. Would you like me to:\n\n• Provide a direct analysis and solution\n• Deploy specialized AI agents for complex tasks\n• Break this down into a multi-step project with our 250+ AI workforce\n\nLet me know how you'd like to proceed!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: currentModel,
        tokensUsed: Math.floor(Math.random() * 500) + 100,
        cost: Math.random() * 0.02 + 0.005
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const models = [
    'AGI Agent 4.0',
    'AGI Agent 3.5',
    'CEO Agent',
    'DataAnalyst Pro',
    'ContentCreator AI',
    'CodeMaster Pro'
  ];

  const actionButtons = [
    { icon: Code, label: 'Code', color: 'text-purple-400' },
    { icon: FileText, label: 'Write', color: 'text-blue-400' },
    { icon: Sparkles, label: 'Create', color: 'text-pink-400' },
    { icon: Search, label: 'Research', color: 'text-green-400' },
    { icon: BarChart3, label: 'Analyze', color: 'text-orange-400' }
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ${darkMode ? 'bg-black' : 'bg-gray-50 border-r border-gray-200'} flex flex-col overflow-hidden`}>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className={`w-full justify-center gap-2 bg-transparent rounded-xl h-11 font-normal text-sm ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  // Load conversation messages
                  setMessages([
                    {
                      id: 'loaded-' + conv.id,
                      role: 'system',
                      content: `Loaded conversation: ${conv.title}`,
                      timestamp: 'Now'
                    },
                    {
                      id: 'loaded-msg-' + conv.id,
                      role: 'assistant',
                      content: conv.lastMessage,
                      timestamp: conv.createdAt,
                      model: currentModel
                    }
                  ]);
                }}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`font-normal text-sm truncate ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>
                      {conv.title}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
                      {conv.starred ? (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <Star className={`h-3 w-3 ${darkMode ? 'text-white/60' : 'text-gray-400'}`} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4">
          <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-normal ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>John Doe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-black' : 'bg-white'}`}>

        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`h-8 w-8 p-0 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Model Selector */}
            <div className="relative" ref={modelSelectorRef}>
              <Button
                variant="ghost"
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`flex items-center gap-2 h-8 px-3 font-normal ${darkMode ? 'text-white/90 hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}
              >
                <span className="text-sm">{currentModel}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>

              {showModelSelector && (
                <div className={`absolute top-full left-0 mt-1 w-52 rounded-lg shadow-xl z-50 ${darkMode ? 'bg-black border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <div className="p-1">
                    {models.map((model) => (
                      <Button
                        key={model}
                        variant="ghost"
                        onClick={() => {
                          setCurrentModel(model);
                          setShowModelSelector(false);
                        }}
                        className={`w-full justify-start text-sm h-8 font-normal ${
                          darkMode
                            ? `text-white/80 hover:bg-white/10 ${currentModel === model ? 'bg-white/10 text-white' : ''}`
                            : `text-gray-700 hover:bg-gray-100 ${currentModel === model ? 'bg-gray-100 text-gray-900' : ''}`
                        }`}
                      >
                        {model}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs px-3 h-8 font-normal rounded-lg">
              Upgrade your plan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className={`h-8 w-8 p-0 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className={`h-8 w-8 p-0 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center mb-8 max-w-3xl">
                <h1 className={`text-2xl font-normal mb-2 ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>
                  What can I help with?
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8 justify-center max-w-2xl">
                {actionButtons.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    className={`flex items-center gap-2 px-4 py-2 h-auto rounded-xl font-normal text-sm ${darkMode ? 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'}`}
                    onClick={() => setInputValue(`Help me with ${action.label.toLowerCase()}`)}
                  >
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group mb-6 ${
                      message.role === 'assistant' ? (darkMode ? 'bg-white/5' : 'bg-gray-50') : ''
                    }`}
                  >
                    <div className="flex gap-4 px-4 py-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {message.role === 'assistant' ? (
                          <div className="w-6 h-6 bg-[#10A37F] rounded-full flex items-center justify-center">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-[#8B5CF6] rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none">
                          <div className={`whitespace-pre-wrap text-sm leading-relaxed ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>
                            {message.content}
                          </div>
                        </div>

                        {/* Action buttons for assistant messages */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                              <Share className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage}>
              <div className="relative">
                <div className={`flex items-center gap-3 rounded-3xl px-4 py-3 min-h-[52px] ${darkMode ? 'bg-[#2F3349]' : 'bg-gray-100 border border-gray-200'}`}>
                  {/* Add Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 rounded-lg ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  {/* Text Input */}
                  <div className="flex-1">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Ask anything..."
                      className={`w-full resize-none bg-transparent focus:outline-none text-sm leading-relaxed py-1 ${darkMode ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-500'}`}
                      rows={1}
                      style={{ maxHeight: '200px' }}
                    />
                  </div>

                  {/* Voice Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 rounded-lg ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>

                  {/* Send Button */}
                  {inputValue.trim() && (
                    <Button
                      type="submit"
                      size="sm"
                      className={`h-6 w-6 p-0 rounded-lg ${darkMode ? 'bg-white hover:bg-white/90 text-black' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </form>

            {/* Footer Text */}
            <div className="text-center mt-2">
              <p className={`text-xs ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>
                AGI Agent can make mistakes. Check important info.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`sm:max-w-[500px] ${darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
              <TabsTrigger value="general" className={darkMode ? 'text-white/70 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:text-gray-900'}>General</TabsTrigger>
              <TabsTrigger value="ai" className={darkMode ? 'text-white/70 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:text-gray-900'}>AI & Models</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className={`text-sm font-normal ${darkMode ? 'text-white' : 'text-gray-900'}`}>Theme</Label>
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-gray-600'}`}>Choose your interface appearance</p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className={`text-sm font-normal ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chat History</Label>
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-gray-600'}`}>Save and sync conversations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-model" className={`text-sm font-normal ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default Model</Label>
                  <select
                    id="default-model"
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className={`w-full mt-2 p-2 rounded-lg focus:outline-none focus:ring-1 ${darkMode ? 'bg-black text-white focus:ring-white/20' : 'bg-gray-100 text-gray-900 border border-gray-300 focus:ring-blue-500'}`}
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="instructions" className={`text-sm font-normal ${darkMode ? 'text-white' : 'text-gray-900'}`}>Custom Instructions</Label>
                  <textarea
                    id="instructions"
                    placeholder="Add custom instructions for AI responses..."
                    className={`w-full mt-2 p-3 rounded-lg focus:outline-none focus:ring-1 resize-none text-sm ${darkMode ? 'bg-black text-white placeholder-white/50 focus:ring-white/20' : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300 focus:ring-blue-500'}`}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
