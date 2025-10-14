import React, { useState, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Type your message...',
}) => {
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-end sm:space-x-2 sm:space-y-0">
        <div className="flex-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            className="max-h-32 min-h-[40px] w-full resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end space-x-1 sm:justify-start">
          <Button variant="ghost" size="sm" className="p-2" title="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" className="p-2" title="Emoji">
            <Smile className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};
