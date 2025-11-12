import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { toast } from 'sonner';

interface CustomShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (shortcut: {
    label: string;
    prompt: string;
    category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  }) => Promise<void>;
  editingShortcut?: {
    id: string;
    label: string;
    prompt: string;
    category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  };
}

/**
 * Custom Shortcut Dialog
 *
 * Allows users to create or edit custom prompt shortcuts.
 * Inspired by Perplexity's custom collections feature.
 */
export function CustomShortcutDialog({
  open,
  onOpenChange,
  onSave,
  editingShortcut,
}: CustomShortcutDialogProps) {
  const [label, setLabel] = useState(editingShortcut?.label || '');
  const [prompt, setPrompt] = useState(editingShortcut?.prompt || '');
  const [category, setCategory] = useState<
    'coding' | 'writing' | 'business' | 'analysis' | 'creative'
  >(editingShortcut?.category || 'writing');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('Please enter a label for your shortcut');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({ label: label.trim(), prompt: prompt.trim(), category });

      // Reset form
      setLabel('');
      setPrompt('');
      setCategory('writing');

      toast.success(
        editingShortcut ? 'Shortcut updated!' : 'Shortcut created!'
      );
      onOpenChange(false);
    } catch (error) {
      console.error('[Custom Shortcut] Error saving:', error);
      toast.error('Failed to save shortcut. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingShortcut ? 'Edit' : 'Create'} Custom Shortcut
          </DialogTitle>
          <DialogDescription>
            Create a custom prompt that you use frequently. It will appear in
            your Prompt Shortcuts menu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Shortcut Label</Label>
            <Input
              id="label"
              placeholder="e.g., Explain like I'm 5"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              A short, descriptive name for your shortcut
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(
                  value as
                    | 'coding'
                    | 'writing'
                    | 'business'
                    | 'analysis'
                    | 'creative'
                )
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coding">💻 Coding</SelectItem>
                <SelectItem value="writing">✍️ Writing</SelectItem>
                <SelectItem value="business">💼 Business</SelectItem>
                <SelectItem value="analysis">📊 Analysis</SelectItem>
                <SelectItem value="creative">✨ Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Text</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Explain the following concept in simple terms that a 5-year-old would understand:"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              The prompt that will be inserted when you click this shortcut
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : editingShortcut
                ? 'Update Shortcut'
                : 'Create Shortcut'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
