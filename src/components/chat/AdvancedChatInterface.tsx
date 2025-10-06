/**
 * Advanced Chat Interface Component
 * Enhanced chat interface with advanced AI model support, streaming, and configuration options
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  User,
  Send,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Brain,
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  X,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Share2,
  Copy,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { sendAIMessage, getConfiguredProviders, getAvailableModels, createCustomSystemPrompt } from '@/services/enhanced-ai-chat-service-v2';
import { streamAIResponse, supportsStreaming, createStreamConfig } from '@/services/enhanced-streaming-service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  isStreaming?: boolean;
  error?: string;
}

interface ChatConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableStreaming: boolean;
  enableTools: boolean;
  enableWebSearch: boolean;
}

interface AdvancedChatInterfaceProps {
  className?: string;
  initialConfig?: Partial<ChatConfig>;
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
}

export const AdvancedChatInterface: React.FC<AdvancedChatInterfaceProps> = ({
  className,
  initialConfig,
  onMessageSent,
  onMessageReceived
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [config, setConfig] = useState<ChatConfig>({
    provider: 'ChatGPT',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are a helpful AI assistant.',
    enableStreaming: true,
    enableTools: false,
    enableWebSearch: false,
    ...initialConfig
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const configuredProviders = getConfiguredProviders();
  const availableModels = getAvailableModels(config.provider);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Update model when provider changes
  useEffect(() => {
    const models = getAvailableModels(config.provider);
    if (models.length > 0 && !models.includes(config.model)) {
      setConfig(prev => ({ ...prev, model: models[0] }));
    }
  }, [config.provider]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      if (config.enableStreaming && supportsStreaming(config.provider)) {
        setIsStreaming(true);
        setStreamingContent('');

        const streamConfig = createStreamConfig(
          config.model,
          config.temperature,
          config.maxTokens,
          config.systemPrompt,
          config.enableTools
        );

        await streamAIResponse(
          config.provider,
          [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          (chunk) => {
            if (chunk.isComplete) {
              const assistantMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
                model: config.model,
                provider: config.provider,
                usage: chunk.usage
              };
              
              setMessages(prev => [...prev, assistantMessage]);
              onMessageReceived?.(assistantMessage);
              setIsStreaming(false);
              setStreamingContent('');
            } else {
              setStreamingContent(prev => prev + chunk.content);
            }
          },
          streamConfig
        );
      } else {
        // Non-streaming fallback
        const response = await sendAIMessage(
          config.provider,
          [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          undefined, // employeeRole
          attachments.length > 0 ? attachments.map(f => ({
            type: 'image' as const,
            mimeType: f.type,
            dataBase64: '' // Will be processed in the service
          })) : undefined,
          {
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            systemPrompt: config.systemPrompt,
            enableWebSearch: config.enableWebSearch,
            enableTools: config.enableTools
          }
        );

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          model: response.model,
          provider: response.provider,
          usage: response.usage
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageReceived?.(assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setAttachments([]);
    }
  }, [inputValue, messages, config, attachments, isLoading, streamingContent, onMessageSent, onMessageReceived]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setStreamingContent('');
    toast.success('Chat cleared');
  };

  const handleExportChat = () => {
    const chatData = {
      messages,
      config,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Chat exported');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const renderMessage = (message: ChatMessage) => (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        message.role === 'user' ? "bg-primary/10 ml-12" : "bg-muted/50 mr-12"
      )}
    >
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          {message.provider && (
            <Badge variant="secondary" className="text-xs">
              {message.provider}
            </Badge>
          )}
          {message.model && (
            <Badge variant="outline" className="text-xs">
              {message.model}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
        </div>
        
        {message.usage && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Tokens: {message.usage.totalTokens}</span>
            <span>Cost: ~${(message.usage.totalTokens * 0.00002).toFixed(4)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyMessage(message.content)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          {message.error && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Advanced AI Chat</CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by {config.provider} • {config.model}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={messages.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Chat Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your AI chat settings and preferences
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Provider</label>
                    <Select
                      value={config.provider}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {configuredProviders.map(provider => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <Select
                      value={config.model}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Temperature */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Temperature: {config.temperature}
                    </label>
                    <Slider
                      value={[config.temperature]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Focused</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Max Tokens: {config.maxTokens}
                    </label>
                    <Slider
                      value={[config.maxTokens]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, maxTokens: value }))}
                      min={100}
                      max={8192}
                      step={100}
                      className="w-full"
                    />
                  </div>
                  
                  {/* System Prompt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Prompt</label>
                    <Textarea
                      value={config.systemPrompt}
                      onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      placeholder="Enter system prompt..."
                      rows={3}
                    />
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Streaming</label>
                        <p className="text-xs text-muted-foreground">
                          Enable real-time response streaming
                        </p>
                      </div>
                      <Switch
                        checked={config.enableStreaming}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableStreaming: checked }))}
                        disabled={!supportsStreaming(config.provider)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Tools</label>
                        <p className="text-xs text-muted-foreground">
                          Enable function calling and tools
                        </p>
                      </div>
                      <Switch
                        checked={config.enableTools}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableTools: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Web Search</label>
                        <p className="text-xs text-muted-foreground">
                          Enable real-time web search
                        </p>
                      </div>
                      <Switch
                        checked={config.enableWebSearch}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableWebSearch: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            
            {/* Streaming Message */}
            {isStreaming && streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 mr-12"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      {config.provider}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Streaming
                    </Badge>
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-12"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {file.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
