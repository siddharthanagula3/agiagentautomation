import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ChatMessage, type ChatMessage as ChatMessageType, type MCPToolCall } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  currentToolCalls: MCPToolCall[];
  employeeName: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentToolCalls,
  employeeName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentToolCalls]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              employeeName={employeeName}
            />
          ))}
        </AnimatePresence>
        
        {/* Current Tool Executions */}
        {currentToolCalls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Executing tools...</p>
            {currentToolCalls.map((toolCall, index) => (
              <div key={index} className="bg-muted rounded p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{toolCall.tool}</span>
                  <Badge variant="outline" className="text-xs">executing</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
