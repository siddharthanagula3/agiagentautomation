/**
 * ChatKit Employee Chat Component
 * Integrates OpenAI ChatKit with AI Employee system using proper SDK configuration
 */

import React, { useEffect, useRef, useState } from 'react';
import type { ChatKitOptions } from '@openai/chatkit';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/components/theme-provider';

interface ChatKitEmployeeChatProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  workflowId: string;
  capabilities?: string[];
  className?: string;
}

const ChatKitEmployeeChat: React.FC<ChatKitEmployeeChatProps> = ({
  employeeId,
  employeeName,
  employeeRole,
  workflowId,
  capabilities = [],
  className = '',
}) => {
  const { user } = useAuthStore();
  const { actualTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [chatKitInstance, setChatKitInstance] = useState<any>(null);

  useEffect(() => {
    if (!user || !workflowId || !containerRef.current) return;

    const initializeChatKit = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Load ChatKit dynamically
        const { ChatKit } = await import('@openai/chatkit');

        // Generate starter prompts from capabilities
        const starterPrompts = capabilities.slice(0, 5).map((cap, index) => ({
          icon: 'sparkles' as const,
          label: cap,
          prompt: `Help me with ${cap}`,
        }));

        // Add default prompts if no capabilities
        if (starterPrompts.length === 0) {
          starterPrompts.push(
            {
              icon: 'circle-question' as const,
              label: `What can you do?`,
              prompt: `What are your capabilities?`,
            },
            {
              icon: 'lightbulb' as const,
              label: 'Get started',
              prompt: `Tell me how you can help me`,
            }
          );
        }

        // Configure ChatKit with proper options
        const options: ChatKitOptions = {
          api: {
            // Session creation endpoint
            createSession: async () => {
              const response = await fetch('/.netlify/functions/create-chatkit-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  employeeId,
                  workflowId,
                  userId: user.id,
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
            // Use light or dark based on current theme
            colorScheme: actualTheme,
            radius: 'medium',
            density: 'normal',
            typography: {
              baseSize: 16,
              fontFamily:
                '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontFamilyMono:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          },
          composer: {
            attachments: {
              enabled: true,
              maxCount: 5,
              maxSize: 10485760, // 10MB
            },
            placeholder: `Message ${employeeName}...`,
          },
          startScreen: {
            greeting: `Hi! I'm ${employeeName}, your ${employeeRole}. How can I help you today?`,
            prompts: starterPrompts,
          },
          // Handle errors
          onError: (error: any) => {
            console.error('ChatKit error:', error);
            toast.error('Chat error occurred');
          },
        };

        // Initialize ChatKit
        const chatkit = new ChatKit(containerRef.current, options);
        setChatKitInstance(chatkit);

        console.log('ChatKit initialized for:', employeeName);
        toast.success(`Connected to ${employeeName}`);
        setIsLoading(false);
      } catch (err: any) {
        console.error('ChatKit initialization error:', err);
        setError(err.message || 'Failed to initialize chat');
        toast.error('Failed to connect to AI Employee');
        setIsLoading(false);
      }
    };

    initializeChatKit();

    // Cleanup
    return () => {
      if (chatKitInstance && typeof chatKitInstance.destroy === 'function') {
        chatKitInstance.destroy();
      }
    };
  }, [
    user,
    workflowId,
    employeeId,
    employeeName,
    employeeRole,
    capabilities,
    actualTheme,
  ]);

  // Update theme when it changes
  useEffect(() => {
    if (chatKitInstance && typeof chatKitInstance.updateTheme === 'function') {
      chatKitInstance.updateTheme({
        colorScheme: actualTheme,
      });
    }
  }, [actualTheme, chatKitInstance]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full p-6 ${className}`}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-4 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connecting to {employeeName}...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{
        // Ensure ChatKit takes full height
        minHeight: '500px',
      }}
    />
  );
};

export default ChatKitEmployeeChat;
