/**
 * Integration Settings Panel Component
 * Comprehensive integration management for configuring external tools and API connections
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Globe,
  Brain,
  Bot,
  MessageSquare,
  Database,
  Code,
  Mail,
  Smartphone,
  Activity,
  TrendingUp,
  Cpu,
  Network,
  Shield,
  Key,
  Clock,
  DollarSign,
  BarChart3,
  Sparkles,
  Power,
  PowerOff,
  Webhook,
  Link,
  Server,
  Cloud,
  Lock,
  Unlock,
  Info,
  Warning,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  toolIntegrationManager, 
  type ToolIntegration, 
  type IntegrationType,
  type AuthenticationConfig,
  type RateLimit,
  type CostStructure,
  type UsageStats
} from '@/integrations/tool-integrations';

interface IntegrationSettingsPanelProps {
  className?: string;
  onIntegrationChange?: (integrations: ToolIntegration[]) => void;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  provider: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular?: boolean;
  comingSoon?: boolean;
  documentation?: string;
  defaultConfig: Partial<ToolIntegration>;
}

interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Integration templates for quick setup
const integrationTemplates: IntegrationTemplate[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'Access to GPT models for text generation, chat completion, and function calling',
    type: 'ai_service',
    provider: 'OpenAI',
    icon: Brain,
    color: 'emerald',
    popular: true,
    documentation: 'https://platform.openai.com/docs',
    defaultConfig: {
      name: 'OpenAI GPT',
      type: 'ai_service',
      capabilities: ['text_generation', 'chat_completion', 'function_calling'],
      rateLimit: {
        requestsPerMinute: 3500,
        requestsPerHour: 10000,
        requestsPerDay: 200000,
        concurrent: 10
      },
      cost: {
        type: 'per_token',
        amount: 0.00001,
        currency: 'USD',
        unit: 'token'
      }
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude models for reasoning, analysis, and complex problem solving',
    type: 'ai_service',
    provider: 'Anthropic',
    icon: Cpu,
    color: 'purple',
    popular: true,
    documentation: 'https://docs.anthropic.com',
    defaultConfig: {
      name: 'Anthropic Claude',
      type: 'ai_service',
      capabilities: ['reasoning', 'analysis', 'code_review'],
      rateLimit: {
        requestsPerMinute: 1000,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        concurrent: 5
      },
      cost: {
        type: 'per_token',
        amount: 0.000015,
        currency: 'USD',
        unit: 'token'
      }
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages, create channels, and manage Slack workspace communications',
    type: 'communication',
    provider: 'Slack',
    icon: MessageSquare,
    color: 'blue',
    popular: true,
    documentation: 'https://api.slack.com',
    defaultConfig: {
      name: 'Slack Integration',
      type: 'communication',
      capabilities: ['send_message', 'create_channel', 'upload_file'],
      rateLimit: {
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        concurrent: 3
      },
      cost: {
        type: 'flat_rate',
        amount: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Trigger and manage n8n workflows for advanced automation',
    type: 'automation',
    provider: 'n8n',
    icon: Zap,
    color: 'orange',
    documentation: 'https://docs.n8n.io',
    defaultConfig: {
      name: 'n8n Integration',
      type: 'automation',
      capabilities: ['workflow_execution', 'data_transformation'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        requestsPerDay: 20000,
        concurrent: 5
      },
      cost: {
        type: 'per_request',
        amount: 0.001,
        currency: 'USD'
      }
    }
  },
  {
    id: 'cursor',
    name: 'Cursor AI',
    description: 'AI-powered code generation and editing with Cursor',
    type: 'development',
    provider: 'Cursor',
    icon: Code,
    color: 'green',
    comingSoon: true,
    documentation: 'https://cursor.sh/docs',
    defaultConfig: {
      name: 'Cursor AI',
      type: 'development',
      capabilities: ['code_generation', 'code_editing', 'refactoring'],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        concurrent: 3
      },
      cost: {
        type: 'per_request',
        amount: 0.01,
        currency: 'USD'
      }
    }
  },
  {
    id: 'replit',
    name: 'Replit Agent',
    description: 'Code execution and development environment management',
    type: 'development',
    provider: 'Replit',
    icon: Server,
    color: 'cyan',
    comingSoon: true,
    documentation: 'https://replit.com/docs',
    defaultConfig: {
      name: 'Replit Agent',
      type: 'development',
      capabilities: ['code_execution', 'environment_setup', 'deployment'],
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 5000,
        concurrent: 2
      },
      cost: {
        type: 'per_minute',
        amount: 0.05,
        currency: 'USD'
      }
    }
  }
];

export const IntegrationSettingsPanel: React.FC<IntegrationSettingsPanelProps> = ({
  className,
  onIntegrationChange
}) => {
  // State management
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<ToolIntegration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Map<string, ConnectionTestResult>>(new Map());

  const queryClient = useQueryClient();

  // Fetch integrations
  const { data: integrations = [], isLoading, error } = useQuery<ToolIntegration[]>({
    queryKey: ['integrations'],
    queryFn: () => toolIntegrationManager.getAllIntegrations(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  });

  // Mutations
  const createIntegrationMutation = useMutation({
    mutationFn: async (integration: ToolIntegration) => {
      await toolIntegrationManager.registerIntegration(integration);
      return integration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setShowCreateDialog(false);
      setSelectedTemplate(null);
      toast.success('Integration created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async (integration: ToolIntegration) => {
      await toolIntegrationManager.registerIntegration(integration);
      return integration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setEditingIntegration(null);
      setShowConfigDialog(false);
      toast.success('Integration updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    }
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ integrationId, isActive }: { integrationId: string; isActive: boolean }) => {
      if (isActive) {
        await toolIntegrationManager.deactivateIntegration(integrationId);
      } else {
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
          await toolIntegrationManager.registerIntegration({ ...integration, isActive: true });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration status updated');
    }
  });

  // Filter integrations
  const filteredIntegrations = React.useMemo(() => {
    return integrations.filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || integration.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [integrations, searchQuery, typeFilter]);

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    return integrationTemplates.filter(template => {
      const existingIntegration = integrations.find(i => i.id === template.id);
      return !existingIntegration; // Only show templates that aren't already configured
    });
  }, [integrations]);

  // Handlers
  const handleCreateFromTemplate = useCallback((template: IntegrationTemplate) => {
    setSelectedTemplate(template);
    setShowCreateDialog(true);
  }, []);

  const handleEditIntegration = useCallback((integration: ToolIntegration) => {
    setEditingIntegration(integration);
    setShowConfigDialog(true);
  }, []);

  const handleTestConnection = useCallback(async (integration: ToolIntegration) => {
    setTestingConnection(integration.id);
    
    try {
      const startTime = Date.now();
      const result = await toolIntegrationManager.executeTool(
        integration.id,
        'test_connection',
        {},
        {
          userId: 'system',
          priority: 'low',
          maxRetries: 1,
          timeout: 5000
        }
      );
      
      const responseTime = Date.now() - startTime;
      const testResult: ConnectionTestResult = {
        success: result.success,
        responseTime,
        error: result.error,
        metadata: result.metadata
      };
      
      setConnectionResults(prev => new Map(prev.set(integration.id, testResult)));
      
      if (result.success) {
        toast.success(`Connection to ${integration.name} successful!`);
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      const testResult: ConnectionTestResult = {
        success: false,
        responseTime: 0,
        error: (error as Error).message
      };
      
      setConnectionResults(prev => new Map(prev.set(integration.id, testResult)));
      toast.error(`Connection test failed: ${(error as Error).message}`);
    } finally {
      setTestingConnection(null);
    }
  }, []);

  // Utility functions
  const getTypeColor = (type: IntegrationType) => {
    switch (type) {
      case 'ai_service': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'automation': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'communication': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'development': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'data_processing': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      case 'monitoring': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'analytics': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTemplateColor = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'purple': return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
      case 'blue': return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'orange': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'green': return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'cyan': return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400';
      case 'indigo': return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400';
      case 'red': return 'bg-red-500/20 border-red-500/30 text-red-400';
      default: return 'bg-slate-500/20 border-slate-500/30 text-slate-400';
    }
  };

  const formatCost = (cost: CostStructure) => {
    const currencySymbol = cost.currency === 'USD' ? '$' : cost.currency;
    if (cost.type === 'flat_rate' && cost.amount === 0) {
      return 'Free';
    }
    return `${currencySymbol}${cost.amount}${cost.unit ? `/${cost.unit}` : ''}`;
  };

  const formatUsageStats = (stats: UsageStats) => {
    const successRate = stats.totalRequests > 0 ? 
      ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) : 0;
    return {
      requests: stats.totalRequests.toLocaleString(),
      successRate: `${successRate}%`,
      avgResponseTime: `${stats.averageResponseTime.toFixed(0)}ms`,
      totalCost: `$${stats.totalCost.toFixed(2)}`
    };
  };

  // Notify parent of integration changes
  useEffect(() => {
    onIntegrationChange?.(integrations);
  }, [integrations, onIntegrationChange]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Integration Settings</h1>
          <p className="text-slate-400 mt-1">
            Configure and manage external tool integrations for your AI workforce
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['integrations'] })}
            disabled={isLoading}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Integrations</p>
                <p className="text-xl font-semibold text-white">{integrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active</p>
                <p className="text-xl font-semibold text-white">
                  {integrations.filter(i => i.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-xl font-semibold text-white">
                  {integrations.length > 0 ? 
                    ((integrations.reduce((acc, i) => acc + (i.usageStats.successfulRequests / Math.max(1, i.usageStats.totalRequests)), 0) / integrations.length) * 100).toFixed(1) + '%' : 
                    '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Requests</p>
                <p className="text-xl font-semibold text-white">
                  {integrations.reduce((acc, i) => acc + i.usageStats.totalRequests, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700">
              Templates
            </TabsTrigger>
            <TabsTrigger value="configured" className="data-[state=active]:bg-slate-700">
              Configured
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Integration Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['ai_service', 'automation', 'communication', 'development'].map((type) => {
                      const count = integrations.filter(i => i.type === type).length;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 capitalize">
                            {type.replace('_', ' ')}
                          </span>
                          <Badge className={cn('text-xs border', getTypeColor(type as IntegrationType))}>
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Available Templates</CardTitle>
                  <CardDescription>
                    Ready-to-use integration templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredTemplates.slice(0, 4).map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <div key={template.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border",
                              getTemplateColor(template.color)
                            )}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="text-sm text-slate-300">{template.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCreateFromTemplate(template)}
                            className="text-blue-400 hover:text-blue-300"
                            disabled={template.comingSoon}
                          >
                            {template.comingSoon ? 'Soon' : 'Add'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {filteredTemplates.length > 4 && (
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedTab('templates')}
                      className="w-full mt-3 text-slate-400 hover:text-white"
                    >
                      View All Templates
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrationTemplates.map((template) => {
                const IconComponent = template.icon;
                const isConfigured = integrations.some(i => i.id === template.id);
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className={cn(
                      "bg-slate-800/50 border-slate-700/50 backdrop-blur-xl transition-all duration-200 group relative",
                      !template.comingSoon && !isConfigured && "hover:bg-slate-800/70 cursor-pointer",
                      isConfigured && "opacity-50"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                            getTemplateColor(template.color)
                          )}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {template.popular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                            {template.comingSoon && (
                              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                                Soon
                              </Badge>
                            )}
                            {isConfigured && (
                              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                Configured
                              </Badge>
                            )}
                          </div>
                        </div>

                        <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Provider:</span>
                            <span className="text-slate-300">{template.provider}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Type:</span>
                            <Badge className={cn('text-xs border', getTypeColor(template.type))}>
                              {template.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-slate-400 hover:text-white"
                          >
                            <a href={template.documentation} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Docs
                            </a>
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleCreateFromTemplate(template)}
                            disabled={template.comingSoon || isConfigured}
                            className={cn(
                              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                              (template.comingSoon || isConfigured) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isConfigured ? 'Configured' : template.comingSoon ? 'Coming Soon' : 'Configure'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="configured" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search integrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
                    />
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48 bg-slate-700/30 border-slate-600/30 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ai_service">AI Service</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Integrations List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredIntegrations.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                      <Settings className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery || typeFilter !== 'all' ? 'No integrations found' : 'No integrations configured'}
                    </h3>
                    <p className="text-slate-400 text-center mb-6">
                      {searchQuery || typeFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Get started by configuring your first integration'
                      }
                    </p>
                    {!searchQuery && typeFilter === 'all' && (
                      <Button 
                        onClick={() => setSelectedTab('templates')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Browse Templates
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredIntegrations.map((integration) => {
                  const connectionResult = connectionResults.get(integration.id);
                  const stats = formatUsageStats(integration.usageStats);
                  
                  return (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-200 group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {integration.name}
                                </h3>
                                <Badge className={cn('text-xs border', getTypeColor(integration.type))}>
                                  {integration.type.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={integration.isActive}
                                    onCheckedChange={(checked) => 
                                      toggleIntegrationMutation.mutate({ 
                                        integrationId: integration.id, 
                                        isActive: integration.isActive 
                                      })
                                    }
                                    disabled={toggleIntegrationMutation.isPending}
                                  />
                                  <span className={cn(
                                    "text-xs",
                                    integration.isActive ? "text-green-400" : "text-slate-400"
                                  )}>
                                    {integration.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                {integration.description}
                              </p>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500">Provider:</span>
                                  <p className="text-slate-300 font-medium">{integration.provider}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">Requests:</span>
                                  <p className="text-slate-300 font-medium">{stats.requests}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">Success Rate:</span>
                                  <p className="text-slate-300 font-medium">{stats.successRate}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">Cost:</span>
                                  <p className="text-slate-300 font-medium">{formatCost(integration.cost)}</p>
                                </div>
                              </div>

                              {/* Connection Status */}
                              {connectionResult && (
                                <div className={cn(
                                  "mt-3 p-2 rounded-lg text-xs",
                                  connectionResult.success 
                                    ? "bg-green-500/20 text-green-400" 
                                    : "bg-red-500/20 text-red-400"
                                )}>
                                  {connectionResult.success 
                                    ? `Connection successful (${connectionResult.responseTime}ms)`
                                    : `Connection failed: ${connectionResult.error}`
                                  }
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTestConnection(integration)}
                                    disabled={testingConnection === integration.id || !integration.isActive}
                                    className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {testingConnection === integration.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <TestTube className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Test Connection</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditIntegration(integration)}
                                    className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Configure</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create/Edit Integration Dialog */}
      <Dialog open={showCreateDialog || showConfigDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowConfigDialog(false);
          setSelectedTemplate(null);
          setEditingIntegration(null);
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingIntegration ? `Configure ${editingIntegration.name}` : `Configure ${selectedTemplate?.name}`}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingIntegration ? 
                'Update the configuration for this integration' :
                'Set up this integration with your API credentials and preferences'
              }
            </DialogDescription>
          </DialogHeader>
          
          <IntegrationConfigForm
            template={selectedTemplate}
            existingIntegration={editingIntegration}
            onSubmit={(integration) => {
              if (editingIntegration) {
                updateIntegrationMutation.mutate(integration);
              } else {
                createIntegrationMutation.mutate(integration);
              }
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setShowConfigDialog(false);
              setSelectedTemplate(null);
              setEditingIntegration(null);
            }}
            isLoading={createIntegrationMutation.isPending || updateIntegrationMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Integration Configuration Form Component
interface IntegrationConfigFormProps {
  template?: IntegrationTemplate | null;
  existingIntegration?: ToolIntegration | null;
  onSubmit: (integration: ToolIntegration) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const IntegrationConfigForm: React.FC<IntegrationConfigFormProps> = ({
  template,
  existingIntegration,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState(() => {
    if (existingIntegration) {
      return {
        name: existingIntegration.name,
        description: existingIntegration.description,
        apiKey: '',
        baseUrl: existingIntegration.config.baseUrl || '',
        isActive: existingIntegration.isActive
      };
    } else if (template) {
      return {
        name: template.name,
        description: template.description,
        apiKey: '',
        baseUrl: '',
        isActive: true
      };
    }
    return {
      name: '',
      description: '',
      apiKey: '',
      baseUrl: '',
      isActive: true
    };
  });

  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const integration: ToolIntegration = {
      id: existingIntegration?.id || template?.id || `integration-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: existingIntegration?.type || template?.type || 'ai_service',
      provider: existingIntegration?.provider || template?.provider || 'Custom',
      version: existingIntegration?.version || '1.0.0',
      config: {
        ...existingIntegration?.config,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl
      },
      isActive: formData.isActive,
      authentication: {
        type: 'api_key',
        config: { key: formData.apiKey }
      },
      capabilities: existingIntegration?.capabilities || template?.defaultConfig.capabilities || [],
      rateLimit: existingIntegration?.rateLimit || template?.defaultConfig.rateLimit || {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        concurrent: 5
      },
      cost: existingIntegration?.cost || template?.defaultConfig.cost || {
        type: 'per_request',
        amount: 0,
        currency: 'USD'
      },
      usageStats: existingIntegration?.usageStats || {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalCost: 0
      }
    };

    onSubmit(integration);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="name" className="text-slate-300">Integration Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., OpenAI GPT-4"
            className="mt-2 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-slate-300">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this integration does..."
            className="mt-2 min-h-[80px] bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
          />
        </div>
        
        <div>
          <Label htmlFor="apiKey" className="text-slate-300">API Key *</Label>
          <div className="relative mt-2">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key..."
              className="pr-10 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="baseUrl" className="text-slate-300">Base URL</Label>
          <Input
            id="baseUrl"
            value={formData.baseUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
            placeholder="https://api.example.com"
            className="mt-2 bg-slate-700/30 border-slate-600/30 text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive" className="text-slate-300">
            Enable integration immediately
          </Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="text-slate-400 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name.trim() || !formData.apiKey.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : existingIntegration ? (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Update Integration
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Integration
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default IntegrationSettingsPanel;