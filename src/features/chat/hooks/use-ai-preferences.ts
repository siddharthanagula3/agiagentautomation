/**
 * useAIPreferences Hook
 * Loads and applies user AI preferences when chat interface mounts
 */

import { useEffect, useState } from 'react';
import { loadUserAIPreferences } from '@core/ai/llm/user-ai-preferences';
import type { LLMProvider } from '@core/ai/llm/unified-language-model';

export interface AIPreferences {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to load and apply user AI preferences
 * Call this in chat components to ensure user preferences are applied
 */
export function useAIPreferences() {
  const [preferences, setPreferences] = useState<AIPreferences>({
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4000,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const prefs = await loadUserAIPreferences();

        if (isMounted) {
          setPreferences({
            ...prefs,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setPreferences((prev) => ({
            ...prev,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load preferences',
          }));
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  return preferences;
}
