/**
 * ChatKit Employee Chat Component
 * Integrates OpenAI ChatKit web component with AI Employee system
 */

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';

// Declare ChatKit custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'session-token'?: string;
          'greeting'?: string;
          'placeholder'?: string;
          'starters'?: string;
          theme?: 'light' | 'dark' | 'auto';
        },
        HTMLElement
      >;
    }
  }
}

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
  const chatkitRef = useRef<HTMLElement>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load ChatKit script
  useEffect(() => {
    // Check if already loaded
    if (document.querySelector('script[src*="chatkit"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.openai.com/chatkit/v1/chatkit.js';
    script.async = true;
    script.type = 'module';
    
    script.onload = () => {
      console.log('ChatKit script loaded');
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load ChatKit script');
      setError('Failed to load ChatKit. Please refresh the page.');
      setScriptLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid re-downloads
    };
  }, []);

  // Create ChatKit session
  useEffect(() => {
    if (!scriptLoaded || !user || !workflowId) return;

    const createSession = async () => {
      try {
        setIsLoading(true);
        setError('');

        console.log('Creating ChatKit session for:', {
          employeeId,
          employeeName,
          workflowId,
        });

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
        console.log('ChatKit session created:', data.session_id);

        setSessionToken(data.client_secret);
        toast.success(`Connected to ${employeeName}`);
      } catch (err: any) {
        console.error('Session creation error:', err);
        setError(err.message || 'Failed to start chat session');
        toast.error('Failed to connect to AI Employee');
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, [scriptLoaded, user, employeeId, employeeName, workflowId]);

  // Listen to ChatKit events
  useEffect(() => {
    if (!chatkitRef.current) return;

    const handleMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('ChatKit message:', customEvent.detail);
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('ChatKit error:', customEvent.detail);
      toast.error('Chat error occurred');
    };

    const element = chatkitRef.current;
    element.addEventListener('message', handleMessage);
    element.addEventListener('error', handleError);

    return () => {
      element.removeEventListener('message', handleMessage);
      element.removeEventListener('error', handleError);
    };
  }, [sessionToken]);

  // Generate greeting message
  const greeting = `Hi! I'm ${employeeName}, your ${employeeRole}. How can I help you today?`;

  // Generate starter prompts based on capabilities
  const starters = JSON.stringify(
    capabilities.slice(0, 4).map(cap => ({
      prompt: `Help me with ${cap}`,
      label: cap,
    })) || [
      { prompt: `What can you help me with?`, label: 'Your capabilities' },
      { prompt: `Tell me about yourself`, label: 'About you' },
    ]
  );

  // Detect current theme
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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

  if (isLoading || !sessionToken) {
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
    <div className={`h-full ${className}`}>
      <openai-chatkit
        ref={chatkitRef}
        session-token={sessionToken}
        greeting={greeting}
        placeholder={`Message ${employeeName}...`}
        starters={starters}
        theme={theme}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

export default ChatKitEmployeeChat;

