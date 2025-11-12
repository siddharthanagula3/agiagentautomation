import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  getUserShortcuts,
  createUserShortcut,
  deleteUserShortcut,
} from '../services/user-shortcuts';
import { CustomShortcutDialog } from './CustomShortcutDialog';
import { toast } from 'sonner';

/**
 * Prompt Shortcuts Component
 *
 * Inspired by Perplexity Comet - provides quick access to common prompts
 * so users don't have to type repetitive requests.
 *
 * Features:
 * - One-click prompt insertion
 * - Categorized shortcuts (Coding, Writing, Business, etc.)
 * - Custom user shortcuts (saved to database)
 * - Keyboard accessible
 * - Minimalist design matching ChatGPT/Claude UX
 */

export interface PromptShortcut {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  isCustom?: boolean;
}

const PROMPT_SHORTCUTS: PromptShortcut[] = [
  // Coding Shortcuts
  {
    id: 'code-review',
    label: 'Review my code',
    icon: Code,
    prompt:
      'Please review this code for best practices, potential bugs, and improvements:',
    category: 'coding',
  },
  {
    id: 'debug-error',
    label: 'Debug this error',
    icon: Bug,
    prompt:
      "I'm getting this error. Can you help me debug it and explain what's wrong?",
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
    prompt:
      'How can I optimize this code for better performance and readability?',
    category: 'coding',
  },

  // Writing Shortcuts
  {
    id: 'improve-writing',
    label: 'Improve my writing',
    icon: FileText,
    prompt:
      'Please improve this text for clarity, grammar, and professionalism:',
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
    prompt: "Let's brainstorm creative ideas for:",
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

export function PromptShortcuts({
  onSelectPrompt,
  className,
}: PromptShortcutsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customShortcuts, setCustomShortcuts] = useState<PromptShortcut[]>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const { user } = useAuthStore();

  const categories = [
    { id: 'coding', label: '💻 Coding', icon: Code },
    { id: 'writing', label: '✍️ Writing', icon: FileText },
    { id: 'business', label: '💼 Business', icon: GitBranch },
    { id: 'creative', label: '✨ Creative', icon: Sparkles },
  ];

  const loadCustomShortcuts = useCallback(async () => {
    if (!user) return;

    setIsLoadingCustom(true);
    try {
      const shortcuts = await getUserShortcuts(user.id);
      // Mark as custom and add default icon
      const customWithIcons = shortcuts.map((s) => ({
        ...s,
        icon: Zap,
        isCustom: true,
      }));
      setCustomShortcuts(customWithIcons);
    } catch (error) {
      console.error(
        '[Prompt Shortcuts] Error loading custom shortcuts:',
        error
      );
    } finally {
      setIsLoadingCustom(false);
    }
  }, [user]);

  // Load custom shortcuts on mount
  useEffect(() => {
    if (user) {
      loadCustomShortcuts();
    }
  }, [user, loadCustomShortcuts]);

  const handleCreateShortcut = async (shortcut: {
    label: string;
    prompt: string;
    category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  }) => {
    if (!user) {
      toast.error('Please log in to create custom shortcuts');
      return;
    }

    const newShortcut = await createUserShortcut(user.id, shortcut);
    if (newShortcut) {
      setCustomShortcuts((prev) => [
        { ...newShortcut, icon: Zap, isCustom: true },
        ...prev,
      ]);
    } else {
      throw new Error('Failed to create shortcut');
    }
  };

  const handleDeleteShortcut = async (shortcutId: string) => {
    if (!user) {
      toast.error('Please log in to delete shortcuts');
      return;
    }

    const success = await deleteUserShortcut(user.id, shortcutId);
    if (success) {
      setCustomShortcuts((prev) => prev.filter((s) => s.id !== shortcutId));
      toast.success('Shortcut deleted');
    } else {
      toast.error('Failed to delete shortcut');
    }
  };

  // Combine default + custom shortcuts
  const allShortcuts = [...PROMPT_SHORTCUTS, ...customShortcuts];

  const filteredShortcuts = selectedCategory
    ? allShortcuts.filter((s) => s.category === selectedCategory)
    : allShortcuts;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-lg',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          ⚡ Quick Prompts
        </h3>
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
              <div key={shortcut.id} className="group flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => onSelectPrompt(shortcut.prompt)}
                  className="h-auto flex-1 justify-start gap-3 px-3 py-2 text-left hover:bg-accent"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium">{shortcut.label}</span>
                  {shortcut.isCustom && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Custom
                    </span>
                  )}
                </Button>
                {shortcut.isCustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteShortcut(shortcut.id)}
                    className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    title="Delete shortcut"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}

          {isLoadingCustom && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading your custom shortcuts...
            </div>
          )}

          {filteredShortcuts.length === 0 && !isLoadingCustom && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No shortcuts in this category.
              {user && ' Create your first custom shortcut below!'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Custom Shortcut Button */}
      {user && (
        <div className="mt-4 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomDialog(true)}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Custom Shortcut
          </Button>
        </div>
      )}

      <div className="mt-3 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
        💡 <span className="font-medium">Tip:</span>{' '}
        {user
          ? 'Create custom shortcuts for your frequently used prompts!'
          : 'Log in to save custom prompts!'}
      </div>

      {/* Custom Shortcut Dialog */}
      {user && (
        <CustomShortcutDialog
          open={showCustomDialog}
          onOpenChange={setShowCustomDialog}
          onSave={handleCreateShortcut}
        />
      )}
    </div>
  );
}
