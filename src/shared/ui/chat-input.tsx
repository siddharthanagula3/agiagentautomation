import * as React from 'react';
import { Textarea } from '@shared/ui/textarea';
import { cn } from '@shared/lib/utils';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // This interface extends TextareaHTMLAttributes to inherit all textarea props
  // Additional custom props can be added here if needed in the future
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        'flex h-16 max-h-12 w-full resize-none items-center rounded-md bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
ChatInput.displayName = 'ChatInput';

export { ChatInput };
