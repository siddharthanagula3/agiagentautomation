/**
 * VIBE Keyboard Shortcuts Hook
 * Provides keyboard shortcuts for VIBE workspace actions
 */

import { useEffect, useCallback } from 'react';
import { safePlatform } from '@shared/utils/browser-utils';

export interface VibeKeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'file' | 'editor' | 'preview' | 'navigation';
}

interface UseVibeKeyboardShortcutsOptions {
  onSaveFile?: () => void;
  onRefreshPreview?: () => void;
  onNewFile?: () => void;
  onCloseFile?: () => void;
  onToggleFileTree?: () => void;
  onTogglePreview?: () => void;
  onFormatCode?: () => void;
  onRunCode?: () => void;
  onShowShortcuts?: () => void;
  enabled?: boolean;
}

export function useVibeKeyboardShortcuts(
  options: UseVibeKeyboardShortcutsOptions = {}
) {
  const {
    onSaveFile,
    onRefreshPreview,
    onNewFile,
    onCloseFile,
    onToggleFileTree,
    onTogglePreview,
    onFormatCode,
    onRunCode,
    onShowShortcuts,
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

      // Use modern platform detection instead of deprecated navigator.platform
      const isMac = safePlatform.isMac();
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + S: Save file
      if (modifierKey && event.key === 's') {
        event.preventDefault();
        onSaveFile?.();
        return;
      }

      // Cmd/Ctrl + R: Refresh preview
      if (modifierKey && event.key === 'r') {
        event.preventDefault();
        onRefreshPreview?.();
        return;
      }

      // Cmd/Ctrl + N: New file
      if (modifierKey && event.key === 'n') {
        event.preventDefault();
        onNewFile?.();
        return;
      }

      // Cmd/Ctrl + W: Close file
      if (modifierKey && event.key === 'w') {
        event.preventDefault();
        onCloseFile?.();
        return;
      }

      // Cmd/Ctrl + B: Toggle file tree
      if (modifierKey && event.key === 'b') {
        event.preventDefault();
        onToggleFileTree?.();
        return;
      }

      // Cmd/Ctrl + P: Toggle preview
      if (modifierKey && event.key === 'p') {
        event.preventDefault();
        onTogglePreview?.();
        return;
      }

      // Cmd/Ctrl + Shift + F: Format code
      if (modifierKey && event.shiftKey && event.key === 'f') {
        event.preventDefault();
        onFormatCode?.();
        return;
      }

      // Cmd/Ctrl + Enter: Run code
      if (modifierKey && event.key === 'Enter') {
        event.preventDefault();
        onRunCode?.();
        return;
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if (modifierKey && event.key === '/') {
        event.preventDefault();
        onShowShortcuts?.();
        return;
      }
    },
    [
      enabled,
      onSaveFile,
      onRefreshPreview,
      onNewFile,
      onCloseFile,
      onToggleFileTree,
      onTogglePreview,
      onFormatCode,
      onRunCode,
      onShowShortcuts,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return list of all available shortcuts for documentation
  const shortcuts: VibeKeyboardShortcut[] = [
    {
      key: 'S',
      ctrl: true,
      meta: true,
      action: () => onSaveFile?.(),
      description: 'Save current file',
      category: 'file',
    },
    {
      key: 'R',
      ctrl: true,
      meta: true,
      action: () => onRefreshPreview?.(),
      description: 'Refresh preview',
      category: 'preview',
    },
    {
      key: 'N',
      ctrl: true,
      meta: true,
      action: () => onNewFile?.(),
      description: 'New file',
      category: 'file',
    },
    {
      key: 'W',
      ctrl: true,
      meta: true,
      action: () => onCloseFile?.(),
      description: 'Close current file',
      category: 'file',
    },
    {
      key: 'B',
      ctrl: true,
      meta: true,
      action: () => onToggleFileTree?.(),
      description: 'Toggle file tree',
      category: 'navigation',
    },
    {
      key: 'P',
      ctrl: true,
      meta: true,
      action: () => onTogglePreview?.(),
      description: 'Toggle preview panel',
      category: 'navigation',
    },
    {
      key: 'F',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => onFormatCode?.(),
      description: 'Format code',
      category: 'editor',
    },
    {
      key: 'Enter',
      ctrl: true,
      meta: true,
      action: () => onRunCode?.(),
      description: 'Run/refresh code',
      category: 'preview',
    },
    {
      key: '/',
      ctrl: true,
      meta: true,
      action: () => onShowShortcuts?.(),
      description: 'Show keyboard shortcuts',
      category: 'navigation',
    },
  ];

  return { shortcuts };
}
