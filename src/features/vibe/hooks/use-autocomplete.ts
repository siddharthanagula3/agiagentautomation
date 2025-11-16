/**
 * Autocomplete Hook
 * Manages # (agent) and @ (file) autocomplete functionality in VIBE interface
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useVibeFileStore } from '../stores/vibe-file-store';
import type { AIEmployee } from '@core/types/ai-employee';
import type { VibeFile } from '../stores/vibe-file-store';

export type AutocompleteType = 'agent' | 'file' | null;

export interface AutocompleteMatch {
  id: string;
  label: string;
  description?: string;
  metadata?: any;
}

export interface AutocompleteState {
  isOpen: boolean;
  type: AutocompleteType;
  query: string;
  matches: AutocompleteMatch[];
  selectedIndex: number;
  triggerPosition: number;
}

export interface UseAutocompleteOptions {
  employees?: AIEmployee[];
  minQueryLength?: number;
  maxResults?: number;
}

export interface UseAutocompleteReturn extends AutocompleteState {
  // Actions
  handleInputChange: (value: string, cursorPosition: number) => void;
  selectMatch: (match: AutocompleteMatch) => string;
  selectByIndex: (index: number) => string | null;
  selectNext: () => void;
  selectPrevious: () => void;
  close: () => void;

  // Utilities
  getInsertText: (match: AutocompleteMatch) => string;
  isAgentMatch: (match: AutocompleteMatch) => boolean;
  isFileMatch: (match: AutocompleteMatch) => boolean;
}

/**
 * Hook for managing autocomplete functionality in message input
 *
 * Supports:
 * - # for agent selection
 * - @ for file references
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Fuzzy matching for both agents and files
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   matches,
 *   handleInputChange,
 *   selectMatch,
 *   selectNext,
 *   selectPrevious
 * } = useAutocomplete({ employees: hiredEmployees });
 *
 * const handleKeyDown = (e: React.KeyboardEvent) => {
 *   if (e.key === 'ArrowDown') {
 *     e.preventDefault();
 *     selectNext();
 *   } else if (e.key === 'ArrowUp') {
 *     e.preventDefault();
 *     selectPrevious();
 *   }
 * };
 * ```
 */
export function useAutocomplete(
  options: UseAutocompleteOptions = {}
): UseAutocompleteReturn {
  const { employees = [], minQueryLength = 0, maxResults = 10 } = options;

  const files = useVibeFileStore((state) => Array.from(state.files.values()));

  const [state, setState] = useState<AutocompleteState>({
    isOpen: false,
    type: null,
    query: '',
    matches: [],
    selectedIndex: 0,
    triggerPosition: -1,
  });

  const inputValueRef = useRef('');

  /**
   * Fuzzy search for agents
   */
  const searchAgents = useCallback(
    (query: string): AutocompleteMatch[] => {
      if (query.length < minQueryLength) return [];

      const lowerQuery = query.toLowerCase();
      const matches: Array<{ match: AutocompleteMatch; score: number }> = [];

      for (const employee of employees) {
        const nameLower = employee.name.toLowerCase();
        const descLower = employee.description.toLowerCase();

        let score = 0;

        // Exact match (highest priority)
        if (nameLower === lowerQuery) {
          score = 1000;
        }
        // Starts with query
        else if (nameLower.startsWith(lowerQuery)) {
          score = 500;
        }
        // Contains query in name
        else if (nameLower.includes(lowerQuery)) {
          score = 200;
        }
        // Contains query in description
        else if (descLower.includes(lowerQuery)) {
          score = 100;
        }

        if (score > 0) {
          matches.push({
            match: {
              id: employee.name,
              label: employee.name,
              description: employee.description,
              metadata: employee,
            },
            score,
          });
        }
      }

      // Sort by score and limit results
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((m) => m.match);
    },
    [employees, minQueryLength, maxResults]
  );

  /**
   * Fuzzy search for files
   */
  const searchFiles = useCallback(
    (query: string): AutocompleteMatch[] => {
      if (query.length < minQueryLength) return [];

      const lowerQuery = query.toLowerCase();
      const matches: Array<{ match: AutocompleteMatch; score: number }> = [];

      for (const file of files) {
        const nameLower = file.name.toLowerCase();

        let score = 0;

        // Exact match
        if (nameLower === lowerQuery) {
          score = 1000;
        }
        // Starts with query
        else if (nameLower.startsWith(lowerQuery)) {
          score = 500;
        }
        // Contains query
        else if (nameLower.includes(lowerQuery)) {
          score = 200;
        }

        if (score > 0) {
          matches.push({
            match: {
              id: file.id,
              label: file.name,
              description: `${(file.size / 1024).toFixed(1)} KB`,
              metadata: file,
            },
            score,
          });
        }
      }

      // Sort by score and limit results
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map((m) => m.match);
    },
    [files, minQueryLength, maxResults]
  );

  /**
   * Detect autocomplete trigger in input
   */
  const detectTrigger = useCallback(
    (value: string, cursorPosition: number): {
      type: AutocompleteType;
      query: string;
      position: number;
    } | null => {
      // Look backwards from cursor to find trigger character
      const textBeforeCursor = value.slice(0, cursorPosition);
      const lastHash = textBeforeCursor.lastIndexOf('#');
      const lastAt = textBeforeCursor.lastIndexOf('@');

      // Determine which trigger is closest to cursor
      const triggers = [
        { char: '#', pos: lastHash, type: 'agent' as AutocompleteType },
        { char: '@', pos: lastAt, type: 'file' as AutocompleteType },
      ].filter((t) => t.pos !== -1);

      if (triggers.length === 0) return null;

      // Get the most recent trigger
      const trigger = triggers.reduce((latest, current) =>
        current.pos > latest.pos ? current : latest
      );

      // Check if there's a space between trigger and cursor (which would close autocomplete)
      const textAfterTrigger = textBeforeCursor.slice(trigger.pos + 1);
      if (textAfterTrigger.includes(' ')) return null;

      // Extract query
      const query = textAfterTrigger.trim();

      return {
        type: trigger.type,
        query,
        position: trigger.pos,
      };
    },
    []
  );

  /**
   * Handle input change and update autocomplete state
   */
  const handleInputChange = useCallback(
    (value: string, cursorPosition: number) => {
      inputValueRef.current = value;

      const trigger = detectTrigger(value, cursorPosition);

      if (!trigger) {
        // Close autocomplete
        setState((prev) => ({
          ...prev,
          isOpen: false,
          type: null,
          query: '',
          matches: [],
          triggerPosition: -1,
        }));
        return;
      }

      // Get matches based on type
      const matches =
        trigger.type === 'agent'
          ? searchAgents(trigger.query)
          : searchFiles(trigger.query);

      setState({
        isOpen: matches.length > 0,
        type: trigger.type,
        query: trigger.query,
        matches,
        selectedIndex: 0,
        triggerPosition: trigger.position,
      });
    },
    [detectTrigger, searchAgents, searchFiles]
  );

  /**
   * Get text to insert when selecting a match
   */
  const getInsertText = useCallback(
    (match: AutocompleteMatch): string => {
      if (state.type === 'agent') {
        return `#${match.label} `;
      } else if (state.type === 'file') {
        return `@${match.label} `;
      }
      return match.label;
    },
    [state.type]
  );

  /**
   * Select a match and return the updated input value
   */
  const selectMatch = useCallback(
    (match: AutocompleteMatch): string => {
      const insertText = getInsertText(match);
      const beforeTrigger = inputValueRef.current.slice(
        0,
        state.triggerPosition
      );
      const afterCursor = inputValueRef.current.slice(
        state.triggerPosition + state.query.length + 1
      );

      const newValue = beforeTrigger + insertText + afterCursor;

      // Close autocomplete
      setState((prev) => ({
        ...prev,
        isOpen: false,
        type: null,
        query: '',
        matches: [],
        triggerPosition: -1,
      }));

      return newValue;
    },
    [state.triggerPosition, state.query, getInsertText]
  );

  /**
   * Select match by index
   */
  const selectByIndex = useCallback(
    (index: number): string | null => {
      if (index < 0 || index >= state.matches.length) return null;
      return selectMatch(state.matches[index]);
    },
    [state.matches, selectMatch]
  );

  /**
   * Select next match (keyboard navigation)
   */
  const selectNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: Math.min(prev.selectedIndex + 1, prev.matches.length - 1),
    }));
  }, []);

  /**
   * Select previous match (keyboard navigation)
   */
  const selectPrevious = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: Math.max(prev.selectedIndex - 1, 0),
    }));
  }, []);

  /**
   * Close autocomplete
   */
  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      type: null,
      query: '',
      matches: [],
      triggerPosition: -1,
    }));
  }, []);

  /**
   * Check if match is an agent
   */
  const isAgentMatch = useCallback(
    (match: AutocompleteMatch): boolean => {
      return state.type === 'agent';
    },
    [state.type]
  );

  /**
   * Check if match is a file
   */
  const isFileMatch = useCallback(
    (match: AutocompleteMatch): boolean => {
      return state.type === 'file';
    },
    [state.type]
  );

  return {
    // State
    ...state,

    // Actions
    handleInputChange,
    selectMatch,
    selectByIndex,
    selectNext,
    selectPrevious,
    close,

    // Utilities
    getInsertText,
    isAgentMatch,
    isFileMatch,
  };
}

/**
 * Hook for keyboard navigation in autocomplete
 *
 * @param autocomplete - The autocomplete hook instance
 * @param onSelect - Callback when user selects a match
 *
 * @example
 * ```tsx
 * const autocomplete = useAutocomplete({ employees });
 * const { handleKeyDown } = useAutocompleteKeyboard(autocomplete, (newValue) => {
 *   setInputValue(newValue);
 * });
 * ```
 */
export function useAutocompleteKeyboard(
  autocomplete: UseAutocompleteReturn,
  onSelect: (newValue: string) => void
) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!autocomplete.isOpen) return false;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          autocomplete.selectNext();
          return true;

        case 'ArrowUp':
          event.preventDefault();
          autocomplete.selectPrevious();
          return true;

        case 'Enter':
        case 'Tab':
          event.preventDefault();
          const newValue = autocomplete.selectByIndex(
            autocomplete.selectedIndex
          );
          if (newValue) {
            onSelect(newValue);
          }
          return true;

        case 'Escape':
          event.preventDefault();
          autocomplete.close();
          return true;

        default:
          return false;
      }
    },
    [autocomplete, onSelect]
  );

  return { handleKeyDown };
}
