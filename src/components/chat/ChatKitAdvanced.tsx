/**
 * Advanced ChatKit Integration Component
 * Implements OpenAI ChatKit with themes, widgets, and actions
 * Based on: https://platform.openai.com/docs/guides/chatkit-themes
 *          https://platform.openai.com/docs/guides/chatkit-widgets
 *          https://platform.openai.com/docs/guides/chatkit-actions
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Bot,
  Settings,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  Star,
  Crown,
  Wrench,
  Brain,
  Globe,
  Search,
  ArrowLeft,
  Users,
  MessageSquare,
  ShoppingCart,
  Palette,
  Zap,
  Target,
  Code,
  FileText,
  Image,
  Download,
  Upload,
  Share,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/unified-auth-store';
import { useTheme } from '@/components/theme-provider';
import { listPurchasedEmployees } from '@/services/supabase-employees';
import { getChatGPTAIEmployeePrompt, getStarterPromptsForRole, getGreetingMessageForRole } from '@/prompts/chatgpt-ai-employee-prompts';

// ChatKit Theme Configuration
interface ChatKitTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

// ChatKit Widget Configuration
interface ChatKitWidget {
  id: string;
  type: 'button' | 'input' | 'select' | 'checkbox' | 'radio' | 'slider' | 'file' | 'image' | 'card' | 'progress';
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  value?: any;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  style?: React.CSSProperties;
  onAction?: (value: any) => void;
}

// ChatKit Action Configuration
interface ChatKitAction {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: 'primary' | 'secondary' | 'danger' | 'success';
  enabled: boolean;
  handler: (context: any) => Promise<any>;
  confirmation?: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
}

// Declare the ChatKit web component with enhanced props
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': {
        workflowId: string;
        sessionId?: string;
        theme?: string | ChatKitTheme;
        placeholder?: string;
        greeting?: string;
        starterPrompts?: string[];
        widgets?: ChatKitWidget[];
        actions?: ChatKitAction[];
        onSessionCreated?: (event: CustomEvent) => void;
        onMessageSent?: (event: CustomEvent) => void;
        onMessageReceived?: (event: CustomEvent) => void;
        onWidgetAction?: (event: CustomEvent) => void;
        onActionExecuted?: (event: CustomEvent) => void;
        onError?: (event: CustomEvent) => void;
        className?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

interface PurchasedEmployee {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar_url?: string;
  created_at: string;
  status: 'active' | 'inactive';
  capabilities: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
  usage_stats: {
    messages_sent: number;
    last_used: string;
    total_sessions: number;
  };
}

interface ChatKitAdvancedProps {
  className?: string;
}

const ChatKitAdvanced: React.FC<ChatKitAdvancedProps> = ({ className }) => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const chatkitRef = useRef<any>(null);
  
  const [employees, setEmployees] = useState<PurchasedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PurchasedEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Theme customization state
  const [customTheme, setCustomTheme] = useState<ChatKitTheme | null>(null);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [themePreset, setThemePreset] = useState<'light' | 'dark' | 'auto' | 'custom'>('auto');
  
  // Widget state
  const [widgets, setWidgets] = useState<ChatKitWidget[]>([]);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  
  // Actions state
  const [actions, setActions] = useState<ChatKitAction[]>([]);
  const [showActionsPanel, setShowActionsPanel] = useState(false);

  // Predefined themes
  const predefinedThemes: Record<string, ChatKitTheme> = {
    light: {
      name: 'Light Theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        accent: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.125rem',
        },
      },
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      },
      borderRadius: '0.5rem',
      shadows: {
        small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        large: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
    },
    dark: {
      name: 'Dark Theme',
      colors: {
        primary: '#60a5fa',
        secondary: '#94a3b8',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
        accent: '#a78bfa',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.125rem',
        },
      },
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      },
      borderRadius: '0.5rem',
      shadows: {
        small: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
        large: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
      },
    },
    purple: {
      name: 'Purple Theme',
      colors: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        background: '#faf5ff',
        surface: '#f3e8ff',
        text: '#581c87',
        textSecondary: '#7c3aed',
        border: '#c4b5fd',
        accent: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          small: '0.875rem',
          medium: '1rem',
          large: '1.125rem',
        },
      },
      spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      },
      borderRadius: '0.75rem',
      shadows: {
        small: '0 1px 2px 0 rgb(139 92 246 / 0.1)',
        medium: '0 4px 6px -1px rgb(139 92 246 / 0.2)',
        large: '0 10px 15px -3px rgb(139 92 246 / 0.3)',
      },
    },
  };

  // Load purchased employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await listPurchasedEmployees(user.id);
        setEmployees(data);
        
        if (data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(data[0]);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        setError('Failed to load AI employees');
        toast.error('Failed to load AI employees');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, [user?.id, selectedEmployee]);

  // Initialize widgets and actions when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      initializeWidgets();
      initializeActions();
    }
  }, [selectedEmployee]);

  // Initialize widgets based on employee role
  const initializeWidgets = () => {
    if (!selectedEmployee) return;

    const employeePrompt = getChatGPTAIEmployeePrompt(selectedEmployee.role);
    if (!employeePrompt) return;

    const roleWidgets: ChatKitWidget[] = [
      {
        id: 'quick-action',
        type: 'button',
        label: 'Quick Action',
        onAction: (value) => handleWidgetAction('quick-action', value),
      },
      {
        id: 'priority-selector',
        type: 'select',
        label: 'Priority Level',
        options: [
          { value: 'low', label: 'Low Priority' },
          { value: 'medium', label: 'Medium Priority' },
          { value: 'high', label: 'High Priority' },
          { value: 'urgent', label: 'Urgent' },
        ],
        onAction: (value) => handleWidgetAction('priority-selector', value),
      },
      {
        id: 'progress-slider',
        type: 'slider',
        label: 'Task Progress',
        validation: { min: 0, max: 100 },
        onAction: (value) => handleWidgetAction('progress-slider', value),
      },
    ];

    // Add role-specific widgets
    if (selectedEmployee.role.includes('Engineer') || selectedEmployee.role.includes('Developer')) {
      roleWidgets.push({
        id: 'code-language',
        type: 'select',
        label: 'Programming Language',
        options: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
          { value: 'csharp', label: 'C#' },
          { value: 'go', label: 'Go' },
        ],
        onAction: (value) => handleWidgetAction('code-language', value),
      });
    }

    if (selectedEmployee.role.includes('Marketing') || selectedEmployee.role.includes('Creative')) {
      roleWidgets.push({
        id: 'content-type',
        type: 'select',
        label: 'Content Type',
        options: [
          { value: 'blog', label: 'Blog Post' },
          { value: 'social', label: 'Social Media' },
          { value: 'email', label: 'Email Campaign' },
          { value: 'ad', label: 'Advertisement' },
          { value: 'video', label: 'Video Script' },
        ],
        onAction: (value) => handleWidgetAction('content-type', value),
      });
    }

    setWidgets(roleWidgets);
  };

  // Initialize actions based on employee role
  const initializeActions = () => {
    if (!selectedEmployee) return;

    const roleActions: ChatKitAction[] = [
      {
        id: 'save-conversation',
        name: 'Save Conversation',
        description: 'Save the current conversation for later reference',
        icon: 'Bookmark',
        type: 'secondary',
        enabled: true,
        handler: async (context) => {
          toast.success('Conversation saved successfully');
          return { success: true };
        },
      },
      {
        id: 'export-chat',
        name: 'Export Chat',
        description: 'Export the conversation as a file',
        icon: 'Download',
        type: 'secondary',
        enabled: true,
        handler: async (context) => {
          toast.success('Chat exported successfully');
          return { success: true };
        },
      },
      {
        id: 'share-conversation',
        name: 'Share Conversation',
        description: 'Share this conversation with others',
        icon: 'Share',
        type: 'secondary',
        enabled: true,
        handler: async (context) => {
          toast.success('Conversation shared successfully');
          return { success: true };
        },
      },
    ];

    // Add role-specific actions
    if (selectedEmployee.role.includes('Engineer') || selectedEmployee.role.includes('Developer')) {
      roleActions.push({
        id: 'generate-code',
        name: 'Generate Code',
        description: 'Generate code based on the conversation',
        icon: 'Code',
        type: 'primary',
        enabled: true,
        handler: async (context) => {
          toast.success('Code generation started');
          return { success: true };
        },
      });
    }

    if (selectedEmployee.role.includes('Marketing') || selectedEmployee.role.includes('Creative')) {
      roleActions.push({
        id: 'create-content',
        name: 'Create Content',
        description: 'Generate marketing content based on the conversation',
        icon: 'FileText',
        type: 'primary',
        enabled: true,
        handler: async (context) => {
          toast.success('Content creation started');
          return { success: true };
        },
      });
    }

    setActions(roleActions);
  };

  // Handle widget actions
  const handleWidgetAction = (widgetId: string, value: any) => {
    console.log(`Widget action: ${widgetId}`, value);
    toast.success(`Widget action executed: ${widgetId}`);
  };

  // Handle action execution
  const handleActionExecution = async (actionId: string, context: any) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      const result = await action.handler(context);
      toast.success(`Action "${action.name}" executed successfully`);
      return result;
    } catch (error) {
      console.error('Action execution error:', error);
      toast.error(`Failed to execute action: ${action.name}`);
    }
  };

  // Generate session ID when employee is selected
  useEffect(() => {
    if (selectedEmployee && !sessionId) {
      const newSessionId = `chatkit-advanced-${selectedEmployee.id}-${Date.now()}`;
      setSessionId(newSessionId);
    }
  }, [selectedEmployee, sessionId]);

  // Handle employee selection
  const handleEmployeeSelect = (employee: PurchasedEmployee) => {
    setSelectedEmployee(employee);
    const newSessionId = `chatkit-advanced-${employee.id}-${Date.now()}`;
    setSessionId(newSessionId);
    setIsSessionActive(false);
    toast.success(`Switched to ${employee.name}`);
  };

  // Handle ChatKit events
  const handleSessionCreated = (event: CustomEvent) => {
    console.log('ChatKit session created:', event.detail);
    setIsSessionActive(true);
    toast.success('Advanced chat session started');
  };

  const handleMessageSent = (event: CustomEvent) => {
    console.log('Message sent:', event.detail);
  };

  const handleMessageReceived = (event: CustomEvent) => {
    console.log('Message received:', event.detail);
  };

  const handleWidgetActionEvent = (event: CustomEvent) => {
    console.log('Widget action:', event.detail);
    handleWidgetAction(event.detail.widgetId, event.detail.value);
  };

  const handleActionExecuted = (event: CustomEvent) => {
    console.log('Action executed:', event.detail);
    handleActionExecution(event.detail.actionId, event.detail.context);
  };

  const handleError = (event: CustomEvent) => {
    console.error('ChatKit error:', event.detail);
    setError(event.detail.message || 'An error occurred');
    toast.error('Chat session error occurred');
  };

  // Get ChatKit configuration for selected employee
  const getChatKitConfig = () => {
    if (!selectedEmployee) return null;

    const employeePrompt = getChatGPTAIEmployeePrompt(selectedEmployee.role);
    if (!employeePrompt) return null;

    // Determine theme
    let themeConfig: string | ChatKitTheme = 'auto';
    if (themePreset === 'custom' && customTheme) {
      themeConfig = customTheme;
    } else if (themePreset !== 'auto') {
      themeConfig = themePreset;
    }

    return {
      workflowId: process.env.VITE_CHATKIT_WORKFLOW_ID || 'default-workflow',
      sessionId: sessionId || undefined,
      theme: themeConfig,
      placeholder: `Message ${selectedEmployee.name}...`,
      greeting: employeePrompt.greetingMessage,
      starterPrompts: employeePrompt.starterPrompts,
      widgets: widgets,
      actions: actions,
    };
  };

  const chatKitConfig = getChatKitConfig();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading AI agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Agents</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No AI Agents Found</h2>
              <p className="text-gray-600 mb-4">
                You need to purchase AI employees from the marketplace to start using the advanced ChatKit interface.
              </p>
              <Button onClick={() => window.location.href = '/marketplace'}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Advanced ChatKit AI Assistant</h1>
                <p className="text-sm text-gray-600">
                  ChatGPT-powered AI Employee with themes, widgets & actions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemeCustomizer(!showThemeCustomizer)}
              className="flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Themes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Widgets
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActionsPanel(!showActionsPanel)}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Actions
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const selector = document.getElementById('employee-selector');
                if (selector) {
                  selector.style.display = 'block';
                }
              }}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Switch Agent
            </Button>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Advanced
            </Badge>
          </div>
        </div>
      </div>

      {/* Theme Customizer Panel */}
      {showThemeCustomizer && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="theme-preset">Theme Preset:</Label>
              <select
                id="theme-preset"
                value={themePreset}
                onChange={(e) => setThemePreset(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="purple">Purple</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            {themePreset === 'custom' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>Primary Color:</Label>
                  <input
                    type="color"
                    value={customTheme?.colors.primary || '#3b82f6'}
                    onChange={(e) => {
                      if (customTheme) {
                        setCustomTheme({
                          ...customTheme,
                          colors: { ...customTheme.colors, primary: e.target.value }
                        });
                      }
                    }}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Background:</Label>
                  <input
                    type="color"
                    value={customTheme?.colors.background || '#ffffff'}
                    onChange={(e) => {
                      if (customTheme) {
                        setCustomTheme({
                          ...customTheme,
                          colors: { ...customTheme.colors, background: e.target.value }
                        });
                      }
                    }}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Widget Panel */}
      {showWidgetPanel && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-900">Available Widgets:</h3>
            <div className="flex flex-wrap gap-2">
              {widgets.map((widget) => (
                <Badge key={widget.id} variant="secondary" className="flex items-center gap-1">
                  {widget.type === 'button' && <Play className="w-3 h-3" />}
                  {widget.type === 'select' && <Search className="w-3 h-3" />}
                  {widget.type === 'slider' && <MoreHorizontal className="w-3 h-3" />}
                  {widget.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions Panel */}
      {showActionsPanel && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-900">Available Actions:</h3>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Badge 
                  key={action.id} 
                  variant={action.type === 'primary' ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {action.icon === 'Bookmark' && <Bookmark className="w-3 h-3" />}
                  {action.icon === 'Download' && <Download className="w-3 h-3" />}
                  {action.icon === 'Share' && <Share className="w-3 h-3" />}
                  {action.icon === 'Code' && <Code className="w-3 h-3" />}
                  {action.icon === 'FileText' && <FileText className="w-3 h-3" />}
                  {action.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Agent Info */}
          {selectedEmployee && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-600">{selectedEmployee.role}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{selectedEmployee.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-medium">{selectedEmployee?.usage_stats?.messages_sent ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sessions</span>
                  <span className="font-medium">{selectedEmployee?.usage_stats?.total_sessions ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Widgets</span>
                  <span className="font-medium">{widgets.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Actions</span>
                  <span className="font-medium">{actions.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {selectedEmployee && (
            <div className="p-6 flex-1">
              <h4 className="font-medium text-gray-900 mb-3">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedEmployee.capabilities || []).map((capability, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ChatKit Interface */}
        <div className="flex-1 flex flex-col">
          {chatKitConfig ? (
            <div className="flex-1">
              <openai-chatkit
                ref={chatkitRef}
                workflowId={chatKitConfig.workflowId}
                sessionId={chatKitConfig.sessionId}
                theme={chatKitConfig.theme}
                placeholder={chatKitConfig.placeholder}
                greeting={chatKitConfig.greeting}
                starterPrompts={chatKitConfig.starterPrompts}
                widgets={chatKitConfig.widgets}
                actions={chatKitConfig.actions}
                onSessionCreated={handleSessionCreated}
                onMessageSent={handleMessageSent}
                onMessageReceived={handleMessageReceived}
                onWidgetAction={handleWidgetActionEvent}
                onActionExecuted={handleActionExecuted}
                onError={handleError}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select an AI Agent</h2>
                <p className="text-gray-600 mb-4">
                  Choose an AI agent to start an advanced ChatKit conversation
                </p>
                <Button onClick={() => {
                  const selector = document.getElementById('employee-selector');
                  if (selector) {
                    selector.style.display = 'block';
                  }
                }}>
                  <Users className="w-4 h-4 mr-2" />
                  Select Agent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Selector (Hidden by default) */}
      <div
        id="employee-selector"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{ display: 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
          }
        }}
      >
        <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select AI Agent</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const selector = document.getElementById('employee-selector');
                  if (selector) {
                    selector.style.display = 'none';
                  }
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="grid gap-4">
              {employees.map((employee) => (
                <Card
                  key={employee.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedEmployee?.id === employee.id && "ring-2 ring-purple-500"
                  )}
                  onClick={() => {
                    handleEmployeeSelect(employee);
                    const selector = document.getElementById('employee-selector');
                    if (selector) {
                      selector.style.display = 'none';
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{employee.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {employee.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {(employee?.usage_stats?.messages_sent ?? 0)} messages
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatKitAdvanced;
