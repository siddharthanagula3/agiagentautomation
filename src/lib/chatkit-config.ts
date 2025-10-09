/**
 * ChatKit Configuration Utilities
 * Centralized configuration for ChatKit instances
 */

import type { ChatKitOptions } from '@openai/chatkit';

/**
 * Icon types available in ChatKit
 */
export type ChatKitIcon =
  | 'sparkles'
  | 'circle-question'
  | 'lightbulb'
  | 'book-open'
  | 'code'
  | 'search'
  | 'chart-bar'
  | 'file-text'
  | 'globe'
  | 'wrench';

/**
 * Generate starter prompts from capabilities
 */
export const generateStarterPrompts = (
  capabilities: string[],
  icon: ChatKitIcon = 'sparkles'
): Array<{ icon: ChatKitIcon; label: string; prompt: string }> => {
  if (capabilities.length === 0) {
    return [
      {
        icon: 'circle-question',
        label: 'What can you do?',
        prompt: 'What are your capabilities?',
      },
      {
        icon: 'lightbulb',
        label: 'Get started',
        prompt: 'Tell me how you can help me',
      },
      {
        icon: 'sparkles',
        label: 'Show examples',
        prompt: 'Give me some examples of what you can do',
      },
    ];
  }

  return capabilities.slice(0, 5).map((cap) => ({
    icon,
    label: cap,
    prompt: `Help me with ${cap}`,
  }));
};

/**
 * Base ChatKit theme configuration
 */
export const baseChatKitTheme = {
  radius: 'medium' as const,
  density: 'normal' as const,
  typography: {
    baseSize: 16,
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontFamilyMono:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
};

/**
 * Default composer configuration
 */
export const defaultComposerConfig = {
  attachments: {
    enabled: true,
    maxCount: 5,
    maxSize: 10485760, // 10MB
  },
};

/**
 * Create ChatKit options for an employee
 */
export const createEmployeeChatKitOptions = (config: {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  workflowId: string;
  userId: string;
  capabilities?: string[];
  colorScheme: 'light' | 'dark';
  onError?: (error: any) => void;
}): Partial<ChatKitOptions> => {
  const {
    employeeId,
    employeeName,
    employeeRole,
    workflowId,
    userId,
    capabilities = [],
    colorScheme,
    onError,
  } = config;

  return {
    api: {
      createSession: async () => {
        const response = await fetch('/.netlify/functions/create-chatkit-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            workflowId,
            userId,
            employeeName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create session');
        }

        const data = await response.json();
        return {
          session_id: data.session_id,
          client_secret: data.client_secret,
        };
      },
    },
    theme: {
      colorScheme,
      ...baseChatKitTheme,
    },
    composer: {
      ...defaultComposerConfig,
      placeholder: `Message ${employeeName}...`,
    },
    startScreen: {
      greeting: `Hi! I'm ${employeeName}, your ${employeeRole}. How can I help you today?`,
      prompts: generateStarterPrompts(capabilities),
    },
    onError: onError || ((error) => console.error('ChatKit error:', error)),
  };
};

/**
 * Map employee role to appropriate icon
 */
export const getRoleIcon = (role: string): ChatKitIcon => {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('data') || roleLower.includes('analyst')) {
    return 'chart-bar';
  }
  if (roleLower.includes('code') || roleLower.includes('developer')) {
    return 'code';
  }
  if (roleLower.includes('content') || roleLower.includes('writer')) {
    return 'file-text';
  }
  if (roleLower.includes('research')) {
    return 'search';
  }
  if (roleLower.includes('support') || roleLower.includes('service')) {
    return 'circle-question';
  }

  return 'sparkles';
};

