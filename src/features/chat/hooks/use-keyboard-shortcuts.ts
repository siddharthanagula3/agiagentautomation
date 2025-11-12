/**
 * Keyboard Shortcuts Hook
 * Provides keyboard shortcuts for common chat actions
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'conversation' | 'message' | 'ui';
}

interface UseKeyboardShortcutsOptions {
  onNewChat?: () => void;
  onSearch?: () => void;
  onShowShortcuts?: () => void;
  onToggleSidebar?: () => void;
  onFocusComposer?: () => void;
  onCopyLastMessage?: () => void;
  onRegenerateLastMessage?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onNewChat,
    onSearch,
    onShowShortcuts,
    onToggleSidebar,
    onFocusComposer,
    onCopyLastMessage,
    onRegenerateLastMessage,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields (except for specific keys)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + K: Open search
      if (modifierKey && event.key === 'k') {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if (modifierKey && event.key === '/') {
        event.preventDefault();
        onShowShortcuts?.();
        return;
      }

      // Cmd/Ctrl + N: New chat
      if (modifierKey && event.key === 'n') {
        event.preventDefault();
        onNewChat?.();
        return;
      }

      // Cmd/Ctrl + B: Toggle sidebar
      if (modifierKey && event.key === 'b') {
        event.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Escape: Focus composer (when not in input field)
      if (event.key === 'Escape' && !isInputField) {
        event.preventDefault();
        onFocusComposer?.();
        return;
      }

      // Cmd/Ctrl + Shift + C: Copy last message
      if (modifierKey && event.shiftKey && event.key === 'c') {
        event.preventDefault();
        onCopyLastMessage?.();
        return;
      }

      // Cmd/Ctrl + Shift + R: Regenerate last message
      if (modifierKey && event.shiftKey && event.key === 'r') {
        event.preventDefault();
        onRegenerateLastMessage?.();
        return;
      }
    },
    [
      enabled,
      onNewChat,
      onSearch,
      onShowShortcuts,
      onToggleSidebar,
      onFocusComposer,
      onCopyLastMessage,
      onRegenerateLastMessage,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return list of all available shortcuts for documentation
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'K',
      ctrl: true,
      meta: true,
      action: () => onSearch?.(),
      description: 'Open search',
      category: 'navigation',
    },
    {
      key: '/',
      ctrl: true,
      meta: true,
      action: () => onShowShortcuts?.(),
      description: 'Show keyboard shortcuts',
      category: 'ui',
    },
    {
      key: 'N',
      ctrl: true,
      meta: true,
      action: () => onNewChat?.(),
      description: 'New conversation',
      category: 'conversation',
    },
    {
      key: 'B',
      ctrl: true,
      meta: true,
      action: () => onToggleSidebar?.(),
      description: 'Toggle sidebar',
      category: 'ui',
    },
    {
      key: 'Escape',
      action: () => onFocusComposer?.(),
      description: 'Focus message composer',
      category: 'navigation',
    },
    {
      key: 'C',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => onCopyLastMessage?.(),
      description: 'Copy last message',
      category: 'message',
    },
    {
      key: 'R',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => onRegenerateLastMessage?.(),
      description: 'Regenerate last message',
      category: 'message',
    },
  ];

  return { shortcuts };
}
