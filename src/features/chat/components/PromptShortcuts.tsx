import React, { useState } from 'react';
import { Button } from '@shared/ui/button';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Lightbulb,
  Code,
  FileText,
  Mail,
  MessageSquare,
  Sparkles,
  Search,
  GitBranch,
  Bug,
  FileCode,
  Zap,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Prompt Shortcuts Component
 *
 * Inspired by Perplexity Comet - provides quick access to common prompts
 * so users don't have to type repetitive requests.
 *
 * Features:
 * - One-click prompt insertion
 * - Categorized shortcuts (Coding, Writing, Business, etc.)
 * - Keyboard accessible
 * - Minimalist design matching ChatGPT/Claude UX
 */

export interface PromptShortcut {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
}

const PROMPT_SHORTCUTS: PromptShortcut[] = [
  // Coding Shortcuts
  {
    id: 'code-review',
    label: 'Review my code',
    icon: Code,
    prompt: 'Please review this code for best practices, potential bugs, and improvements:',
    category: 'coding',
  },
  {
    id: 'debug-error',
    label: 'Debug this error',
    icon: Bug,
    prompt: 'I\'m getting this error. Can you help me debug it and explain what\'s wrong?',
    category: 'coding',
  },
  {
    id: 'explain-code',
    label: 'Explain this code',
    icon: FileCode,
    prompt: 'Can you explain what this code does in simple terms?',
    category: 'coding',
  },
  {
    id: 'optimize-code',
    label: 'Optimize code',
    icon: Zap,
    prompt: 'How can I optimize this code for better performance and readability?',
    category: 'coding',
  },

  // Writing Shortcuts
  {
    id: 'improve-writing',
    label: 'Improve my writing',
    icon: FileText,
    prompt: 'Please improve this text for clarity, grammar, and professionalism:',
    category: 'writing',
  },
  {
    id: 'summarize',
    label: 'Summarize this',
    icon: MessageSquare,
    prompt: 'Please provide a concise summary of the following:',
    category: 'writing',
  },
  {
    id: 'write-email',
    label: 'Write an email',
    icon: Mail,
    prompt: 'Help me write a professional email about:',
    category: 'writing',
  },

  // Business Shortcuts
  {
    id: 'business-plan',
    label: 'Create business plan',
    icon: GitBranch,
    prompt: 'Help me create a business plan for:',
    category: 'business',
  },
  {
    id: 'market-research',
    label: 'Market research',
    icon: Search,
    prompt: 'Can you help me research the market for:',
    category: 'business',
  },

  // Creative Shortcuts
  {
    id: 'brainstorm',
    label: 'Brainstorm ideas',
    icon: Lightbulb,
    prompt: 'Let\'s brainstorm creative ideas for:',
    category: 'creative',
  },
  {
    id: 'generate-content',
    label: 'Generate content',
    icon: Sparkles,
    prompt: 'Generate engaging content about:',
    category: 'creative',
  },
];

interface PromptShortcutsProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

export function PromptShortcuts({ onSelectPrompt, className }: PromptShortcutsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'coding', label: '💻 Coding', icon: Code },
    { id: 'writing', label: '✍️ Writing', icon: FileText },
    { id: 'business', label: '💼 Business', icon: GitBranch },
    { id: 'creative', label: '✨ Creative', icon: Sparkles },
  ];

  const filteredShortcuts = selectedCategory
    ? PROMPT_SHORTCUTS.filter((s) => s.category === selectedCategory)
    : PROMPT_SHORTCUTS;

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-lg', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">⚡ Quick Prompts</h3>
        <p className="text-xs text-muted-foreground">Click to insert</p>
      </div>

      {/* Category Filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="h-7 px-3 text-xs"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="h-7 px-3 text-xs"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Shortcuts Grid */}
      <ScrollArea className="max-h-[300px]">
        <div className="grid gap-2">
          {filteredShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Button
                key={shortcut.id}
                variant="ghost"
                onClick={() => onSelectPrompt(shortcut.prompt)}
                className="h-auto justify-start gap-3 px-3 py-2 text-left hover:bg-accent"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm font-medium">{shortcut.label}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-3 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
        💡 <span className="font-medium">Tip:</span> These prompts save you time by providing
        common starting points. Click one, then add your specific details.
      </div>
    </div>
  );
}
