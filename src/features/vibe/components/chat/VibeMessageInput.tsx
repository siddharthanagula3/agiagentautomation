/**
 * VibeMessageInput.tsx
 * Enhanced input component with # and @ autocomplete for the VIBE interface
 */

import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, X, Hash, AtSign } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { useVibeChatStore } from '../../stores/vibe-chat-store';
import type { AIEmployee } from '@core/types/ai-employee';

interface VibeMessageInputProps {
  onSendMessage: (content: string, files?: string[]) => void;
  availableEmployees?: AIEmployee[];
  availableFiles?: string[];
  isDisabled?: boolean;
  placeholder?: string;
}

type AutocompleteType = 'agent' | 'file' | null;

interface AutocompleteMatch {
  text: string;
  value: string;
  description?: string;
}

export const VibeMessageInput: React.FC<VibeMessageInputProps> = ({
  onSendMessage,
  availableEmployees = [],
  availableFiles = [],
  isDisabled = false,
  placeholder = 'Type your message... (# for agents, @ for files)',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { input, setInput, selectedFiles, setSelectedFiles, resetInput } =
    useVibeChatStore();

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] =
    useState<AutocompleteType>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  // Get filtered autocomplete matches
  const getAutocompleteMatches = (): AutocompleteMatch[] => {
    if (!autocompleteType) return [];

    if (autocompleteType === 'agent') {
      return availableEmployees
        .filter(
          (emp) =>
            emp.name.toLowerCase().includes(autocompleteQuery.toLowerCase()) ||
            emp.description
              .toLowerCase()
              .includes(autocompleteQuery.toLowerCase())
        )
        .slice(0, 5)
        .map((emp) => ({
          text: emp.name,
          value: `#${emp.name}`,
          description: emp.description,
        }));
    }

    if (autocompleteType === 'file') {
      return availableFiles
        .filter((file) =>
          file.toLowerCase().includes(autocompleteQuery.toLowerCase())
        )
        .slice(0, 5)
        .map((file) => ({
          text: file,
          value: `@${file}`,
        }));
    }

    return [];
  };

  const matches = getAutocompleteMatches();

  // Handle input change and detect autocomplete triggers
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);

    // Find last trigger character before cursor
    const hashMatch = textBeforeCursor.match(/#([\w-]*)$/);
    const atMatch = textBeforeCursor.match(/@([\w\-./]*)$/);

    if (hashMatch) {
      setAutocompleteType('agent');
      setAutocompleteQuery(hashMatch[1]);
      setShowAutocomplete(true);
      setSelectedIndex(0);
      updateAutocompletePosition();
    } else if (atMatch) {
      setAutocompleteType('file');
      setAutocompleteQuery(atMatch[1]);
      setShowAutocomplete(true);
      setSelectedIndex(0);
      updateAutocompletePosition();
    } else {
      setShowAutocomplete(false);
      setAutocompleteType(null);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Update autocomplete dropdown position
  const updateAutocompletePosition = () => {
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setAutocompletePosition({
        top: rect.top - 10, // Position above textarea
        left: rect.left,
      });
    }
  };

  // Handle autocomplete selection
  const selectAutocompleteItem = (match: AutocompleteMatch) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);

    // Replace the trigger + query with the selected value
    const regex = autocompleteType === 'agent' ? /#[\w-]*$/ : /@[\w\-./]*$/;
    const newTextBefore = textBeforeCursor.replace(regex, match.value + ' ');

    const newValue = newTextBefore + textAfterCursor;
    setInput(newValue);
    setShowAutocomplete(false);

    // Focus back on textarea
    textareaRef.current.focus();
    const newCursorPos = newTextBefore.length;
    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
  };

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && matches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % matches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + matches.length) % matches.length
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectAutocompleteItem(matches[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setLocalFiles((prev) => [...prev, ...files]);
    e.target.value = ''; // Reset input
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setLocalFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Send message
  const handleSend = () => {
    if (!input.trim() && localFiles.length === 0) return;
    if (isDisabled) return;

    const fileNames = localFiles.map((f) => f.name);
    onSendMessage(input, fileNames.length > 0 ? fileNames : undefined);

    // Reset input and files
    resetInput();
    setLocalFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        !textareaRef.current?.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative border-t bg-background">
      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showAutocomplete && matches.length > 0 && (
          <motion.div
            ref={autocompleteRef}
            className="absolute bottom-full left-0 right-0 z-50 mx-4 mb-2 max-h-64 overflow-y-auto rounded-lg border bg-popover shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                {autocompleteType === 'agent' ? (
                  <>
                    <Hash className="h-3 w-3" />
                    <span>Select an agent</span>
                  </>
                ) : (
                  <>
                    <AtSign className="h-3 w-3" />
                    <span>Select a file</span>
                  </>
                )}
              </div>
              {matches.map((match, index) => (
                <button
                  key={match.value}
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => selectAutocompleteItem(match)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="text-sm font-medium">{match.text}</div>
                  {match.description && (
                    <div className="truncate text-xs text-muted-foreground">
                      {match.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Files */}
      {localFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {localFiles.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="transition-colors hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        className="flex items-end gap-3 p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* File Upload Button */}
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isDisabled}
            aria-label="Upload files"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={isDisabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className="max-h-[200px] min-h-[40px] flex-1 resize-none rounded-lg border-0 bg-transparent px-3 py-2 focus:outline-none focus:ring-0"
          rows={1}
          aria-label="Message input"
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isDisabled || (!input.trim() && localFiles.length === 0)}
          size="icon"
          className="h-10 w-10 flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
