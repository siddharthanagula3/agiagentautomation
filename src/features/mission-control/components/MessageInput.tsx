import React from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder,
  disabled = false,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t bg-card p-3 sm:p-4">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
          disabled={isLoading || disabled}
          className="h-10 flex-1"
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading || disabled}
          size="sm"
          className="h-10 w-10 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
