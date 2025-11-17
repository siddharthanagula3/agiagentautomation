/**
 * VibeChatCanvas - Main chat container for VIBE interface
 * Primary chat interface with messages, input, and status display
 */

import React, { useRef, useEffect } from 'react';
import { useVibeChatStore } from '../../stores/vibe-chat-store';
import { useVibeAgentStore } from '../../stores/vibe-agent-store';
import VibeStatusBar from './VibeStatusBar';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Send, Paperclip } from 'lucide-react';

// Placeholder for VibeMessageList - to be implemented later
const VibeMessageList: React.FC<{ messages: any[] }> = ({ messages }) => {
  return (
    <div className="space-y-4 px-6 py-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Start a conversation
            </h2>
            <p className="text-sm text-muted-foreground">
              Type a message below to begin working with your AI employees. Use
              # to mention specific agents and @ to reference files.
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm border border-border bg-card'
              }`}
            >
              {message.employee_name && (
                <div className="mb-1 text-xs font-medium opacity-70">
                  {message.employee_name}
                  {message.employee_role && (
                    <span className="ml-2 opacity-60">
                      • {message.employee_role}
                    </span>
                  )}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
              <div className="mt-1 text-xs opacity-60">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Placeholder for VibeMessageInput - to be implemented later
const VibeMessageInput: React.FC<{
  onSend: (message: string) => void;
}> = ({ onSend }) => {
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        title="Attach files"
      >
        <Paperclip size={18} />
      </Button>
      <div className="flex-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (# for agents, @ for files)"
          className="min-h-[44px] resize-none"
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!input.trim()}
        className="shrink-0"
      >
        <Send size={18} />
      </Button>
    </div>
  );
};

const VibeChatCanvas: React.FC = () => {
  const { messages, addMessage, isLoading } = useVibeChatStore();
  const { activeAgents } = useVibeAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Add user message
    addMessage({
      session_id: 'current', // TODO: Use actual session ID
      role: 'user',
      content,
    });

    // TODO: Trigger agent routing and response
    // This will be implemented when the VIBE orchestrator is created
  };

  // Convert Map to Array for display
  const activeAgentsList = Array.from(activeAgents.values());

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Workforce Vibe</h1>
            <p className="text-sm text-muted-foreground">
              {activeAgentsList.length}{' '}
              {activeAgentsList.length === 1 ? 'agent' : 'agents'} active
            </p>
          </div>
          <VibeStatusBar agents={activeAgentsList} />
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <VibeMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/50 p-4 backdrop-blur-sm">
        <VibeMessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default VibeChatCanvas;
