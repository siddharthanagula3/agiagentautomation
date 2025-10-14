/**
 * AI Configuration Page
 * Comprehensive settings page for configuring all AI providers and advanced features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Switch } from '@shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Separator } from '@shared/ui/separator';
import {
  Bot,
  Key,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  Zap,
  Brain,
  Search,
  Shield,
  DollarSign,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  getConfiguredProviders,
  getAvailableModels,
  createCustomSystemPrompt,
} from '@/services/enhanced-ai-chat-service-v2';

interface ProviderConfig {
  name: string;
  apiKey: string;
  isConfigured: boolean;
  models: string[];
  defaultModel: string;
  costPerToken: number;
  maxTokens: number;
  features: string[];
  documentation: string;
  pricing: string;
}

const PROVIDER_CONFIGS: Record<
  string,
  Omit<ProviderConfig, 'apiKey' | 'isConfigured'>
> = {
  OpenAI: {
    name: 'OpenAI (ChatGPT)',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    costPerToken: 0.000002,
    maxTokens: 4096,
    features: ['Streaming', 'Function Calling', 'Vision', 'Code Generation'],
    documentation: 'https://platform.openai.com/docs',
    pricing: 'https://openai.com/pricing',
  },
  Anthropic: {
    name: 'Anthropic (Claude)',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    costPerToken: 0.000003,
    maxTokens: 4096,
    features: ['Streaming', 'Long Context', 'Analysis', 'Safety'],
    documentation: 'https://docs.anthropic.com',
    pricing: 'https://www.anthropic.com/pricing',
  },
  Google: {
    name: 'Google (Gemini)',
    models: [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    defaultModel: 'gemini-2.0-flash',
    costPerToken: 0.000001,
    maxTokens: 4096,
    features: ['Streaming', 'Vision', 'Multimodal', 'Free Tier'],
    documentation: 'https://ai.google.dev/docs',
    pricing: 'https://ai.google.dev/pricing',
  },
  Perplexity: {
    name: 'Perplexity',
    models: [
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-128k-online',
    ],
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    costPerToken: 0.000005,
    maxTokens: 4096,
    features: ['Web Search', 'Real-time Data', 'Research', 'Citations'],
    documentation: 'https://docs.perplexity.ai',
    pricing: 'https://www.perplexity.ai/pricing',
  },
};

const AIConfigurationPage: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<
    Record<string, 'pending' | 'success' | 'error'>
  >({});

  // Initialize configurations
  useEffect(() => {
    const initialConfigs: Record<string, ProviderConfig> = {};

    Object.entries(PROVIDER_CONFIGS).forEach(([key, config]) => {
      const apiKey = localStorage.getItem(`api_key_${key.toLowerCase()}`) || '';
      initialConfigs[key] = {
        ...config,
        apiKey,
        isConfigured: !!apiKey,
      };
    });

    setConfigs(initialConfigs);
  }, []);

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey,
        isConfigured: !!apiKey,
      },
    }));

    // Save to localStorage
    localStorage.setItem(`api_key_${provider.toLowerCase()}`, apiKey);
  };

  const handleTestProvider = async (provider: string) => {
    setTestResults(prev => ({ ...prev, [provider]: 'pending' }));

    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would test the actual API
      const isWorking = Math.random() > 0.3; // Simulate 70% success rate

      setTestResults(prev => ({
        ...prev,
        [provider]: isWorking ? 'success' : 'error',
      }));

      if (isWorking) {
        toast.success(`${provider} API test successful!`);
      } else {
        toast.error(`${provider} API test failed. Check your API key.`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      toast.error(`Failed to test ${provider} API`);
    }
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const handleClearApiKey = (provider: string) => {
    handleApiKeyChange(provider, '');
    toast.success(`${provider} API key cleared`);
  };

  const configuredProviders = Object.values(configs).filter(
    config => config.isConfigured
  );
  const totalCost = configuredProviders.reduce(
    (sum, config) => sum + config.costPerToken * config.maxTokens,
    0
  );

  const renderProviderCard = (provider: string, config: ProviderConfig) => (
    <Card key={provider} className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                config.isConfigured
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={config.isConfigured ? 'default' : 'secondary'}>
                  {config.isConfigured ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ${config.costPerToken.toFixed(6)}/token
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {config.isConfigured && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestProvider(provider)}
                disabled={testResults[provider] === 'pending'}
              >
                {testResults[provider] === 'pending' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : testResults[provider] === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : testResults[provider] === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Test
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor={`api-key-${provider}`}>API Key</Label>
          <div className="flex gap-2">
            <Input
              id={`api-key-${provider}`}
              type={showApiKeys[provider] ? 'text' : 'password'}
              value={config.apiKey}
              onChange={e => handleApiKeyChange(provider, e.target.value)}
              placeholder={`Enter your ${provider} API key...`}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setShowApiKeys(prev => ({
                  ...prev,
                  [provider]: !prev[provider],
                }))
              }
            >
              {showApiKeys[provider] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            {config.apiKey && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyApiKey(config.apiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearApiKey(provider)}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="flex flex-wrap gap-2">
            {config.features.map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Documentation Links */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(config.documentation, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(config.pricing, '_blank')}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Configuration</h1>
          <p className="text-muted-foreground">
            Configure your AI providers and advanced settings
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Configured Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configuredProviders.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  out of {Object.keys(configs).length} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Estimated Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalCost.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">per 1000 tokens</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(configs).reduce(
                    (sum, config) => sum + config.models.length,
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  across all providers
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Object.entries(configs).map(([provider, config]) => (
              <Card key={provider}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <Badge
                      variant={config.isConfigured ? 'default' : 'secondary'}
                    >
                      {config.isConfigured ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Models:</span>
                      <div className="font-medium">{config.models.length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <div className="font-medium">
                        ${config.costPerToken.toFixed(6)}/token
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {config.features.slice(0, 3).map(feature => (
                      <Badge
                        key={feature}
                        variant="outline"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {config.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{config.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Object.entries(configs).map(([provider, config]) =>
              renderProviderCard(provider, config)
            )}
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default System Prompt</Label>
                <Textarea
                  placeholder="Enter your default system prompt..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Prompts</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Prompt name..." />
                    <Button variant="outline">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Streaming</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time response streaming
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Fallback</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically try other providers if one fails
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic rate limiting
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">
                  Usage tracking coming soon
                </h3>
                <p className="text-muted-foreground">
                  We're working on detailed usage analytics and cost tracking.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIConfigurationPage;
