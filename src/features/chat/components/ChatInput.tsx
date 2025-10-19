import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Send,
  Mic,
  MicOff,
  Users,
  User,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  selectedEmployees: string[];
  availableEmployees: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  onSelectEmployee: (employeeId: string) => void;
  onDeselectEmployee: (employeeId: string) => void;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  selectedEmployees,
  availableEmployees,
  onSelectEmployee,
  onDeselectEmployee,
  isStreaming = false,
  placeholder = 'Ask anything',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isStreaming) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      onDeselectEmployee(employeeId);
    } else {
      onSelectEmployee(employeeId);
    }
  };

  const selectedEmployeeNames = availableEmployees
    .filter((emp) => selectedEmployees.includes(emp.id))
    .map((emp) => emp.name);

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Employee Selection */}
      {selectedEmployees.length > 0 && (
        <div className="mb-3 flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Working with:
          </span>
          {selectedEmployeeNames.map((name, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
          >
            <Users className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'p-2',
              isRecording
                ? 'text-red-500 hover:text-red-700'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isStreaming}
            className={cn(
              'resize-none pr-12',
              isStreaming && 'cursor-not-allowed opacity-50'
            )}
          />

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isStreaming}
            size="sm"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 transform p-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Employee Selector Dropdown */}
      {showEmployeeSelector && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
          <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select AI Employees
          </div>
          <div className="flex flex-wrap gap-2">
            {availableEmployees.map((employee) => (
              <Button
                key={employee.id}
                variant={
                  selectedEmployees.includes(employee.id)
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handleEmployeeToggle(employee.id)}
                className="text-xs"
              >
                {employee.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {isStreaming && (
        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          AI Employees are working...
        </div>
      )}

      {isRecording && (
        <div className="mt-2 flex items-center text-xs text-red-500">
          <Mic className="mr-1 h-3 w-3" />
          Recording... Click to stop
        </div>
      )}
    </div>
  );
}
