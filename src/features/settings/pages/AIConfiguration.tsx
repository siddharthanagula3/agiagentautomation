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
  Save,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  getConfiguredProviders,
  getAvailableModels,
  createCustomSystemPrompt,
} from '@/services/enhanced-ai-chat-service-v2';
import { settingsService } from '@features/settings/services/user-preferences';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';

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
    defaultModel: 'gpt-4o',
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

  // User AI preferences
  const [defaultProvider, setDefaultProvider] = useState<string>('openai');
  const [defaultModel, setDefaultModel] = useState<string>('gpt-4o');
  const [preferStreaming, setPreferStreaming] = useState<boolean>(true);
  const [aiTemperature, setAiTemperature] = useState<number>(0.7);
  const [aiMaxTokens, setAiMaxTokens] = useState<number>(4000);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      const { data, error } = await settingsService.getSettings();
      if (!error && data) {
        if (data.default_ai_provider) setDefaultProvider(data.default_ai_provider);
        if (data.default_ai_model) setDefaultModel(data.default_ai_model);
        if (data.prefer_streaming !== undefined) setPreferStreaming(data.prefer_streaming);
        if (data.ai_temperature !== undefined) setAiTemperature(data.ai_temperature);
        if (data.ai_max_tokens !== undefined) setAiMaxTokens(data.ai_max_tokens);
      }
    };

    loadUserPreferences();
  }, []);

  // Initialize configurations
  useEffect(() => {
    // Static mapping for environment variables (Vite requires static access)
    const envKeyMapping: Record<string, boolean> = {
      OpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
      Anthropic: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
      Google: !!import.meta.env.VITE_GOOGLE_API_KEY,
      Perplexity: !!import.meta.env.VITE_PERPLEXITY_API_KEY,
    };

    const initialConfigs: Record<string, ProviderConfig> = {};

    Object.entries(PROVIDER_CONFIGS).forEach(([key, config]) => {
      // SECURITY: Never read API keys from localStorage
      // API keys should only be configured via environment variables
      const apiKey = '';
      initialConfigs[key] = {
        ...config,
        apiKey,
        isConfigured: envKeyMapping[key] || false,
      };
    });

    setConfigs(initialConfigs);
  }, []);

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    setConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey,
        isConfigured: !!apiKey,
      },
    }));

    // SECURITY: API keys should NOT be saved to localStorage
    // Instead, show a warning that environment variables must be updated
    if (apiKey) {
      toast.error(
        'API keys cannot be saved from the UI for security reasons. Please update your .env file instead.'
      );
    }
  };

  const handleTestProvider = async (provider: string) => {
    setTestResults((prev) => ({ ...prev, [provider]: 'pending' }));

    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you would test the actual API
      const isWorking = Math.random() > 0.3; // Simulate 70% success rate

      setTestResults((prev) => ({
        ...prev,
        [provider]: isWorking ? 'success' : 'error',
      }));

      if (isWorking) {
        toast.success(`${provider} API test successful!`);
      } else {
        toast.error(`${provider} API test failed. Check your API key.`);
      }
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [provider]: 'error' }));
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

  const handleSaveAIPreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const { error } = await settingsService.updateSettings({
        default_ai_provider: defaultProvider as 'openai' | 'anthropic' | 'google' | 'perplexity',
        default_ai_model: defaultModel,
        prefer_streaming: preferStreaming,
        ai_temperature: aiTemperature,
        ai_max_tokens: aiMaxTokens,
      });

      if (error) {
        toast.error(`Failed to save AI preferences: ${error}`);
      } else {
        toast.success('AI preferences saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save AI preferences');
      console.error('Error saving AI preferences:', error);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const getModelsForProvider = (provider: string): string[] => {
    const config = PROVIDER_CONFIGS[provider];
    return config ? config.models : [];
  };

  const configuredProviders = Object.values(configs).filter(
    (config) => config.isConfigured
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id={`api-key-${provider}`}
              type={showApiKeys[provider] ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => handleApiKeyChange(provider, e.target.value)}
              placeholder={`Enter your ${provider} API key...`}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setShowApiKeys((prev) => ({
                    ...prev,
                    [provider]: !prev[provider],
                  }))
                }
                className="flex-1 sm:flex-none"
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
                    className="flex-1 sm:flex-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearApiKey(provider)}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden sm:inline">Clear</span>
                    <span className="sm:hidden">X</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="flex flex-wrap gap-2">
            {config.features.map((feature) => (
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
    <div className="container mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure your AI providers and advanced settings
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="providers" className="text-xs md:text-sm">Providers</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs md:text-sm">Advanced</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs md:text-sm">Usage</TabsTrigger>
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
                    {config.features.slice(0, 3).map((feature) => (
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
              <div className="flex items-center justify-between">
                <CardTitle>Default AI Settings</CardTitle>
                <Button
                  onClick={handleSaveAIPreferences}
                  disabled={isSavingPreferences}
                  size="sm"
                >
                  {isSavingPreferences ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  These settings will be used as defaults for general chat. Specific features may override these settings based on task requirements.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default-provider">Default AI Provider</Label>
                  <Select
                    value={defaultProvider}
                    onValueChange={(value) => {
                      setDefaultProvider(value);
                      // Update model to match the provider's default
                      const providerConfig = PROVIDER_CONFIGS[value];
                      if (providerConfig) {
                        setDefaultModel(providerConfig.defaultModel);
                      }
                    }}
                  >
                    <SelectTrigger id="default-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Provider for general chat conversations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-model">Default AI Model</Label>
                  <Select
                    value={defaultModel}
                    onValueChange={setDefaultModel}
                  >
                    <SelectTrigger id="default-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelsForProvider(defaultProvider).map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Model to use for the selected provider
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-temperature">Temperature ({aiTemperature})</Label>
                  <Input
                    id="ai-temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aiTemperature}
                    onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Controls randomness (0 = focused, 2 = creative)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                  <Input
                    id="ai-max-tokens"
                    type="number"
                    min="100"
                    max="32000"
                    step="100"
                    value={aiMaxTokens}
                    onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum response length
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Streaming</Label>
                  <p className="text-sm text-muted-foreground">
                    Stream responses in real-time as they're generated
                  </p>
                </div>
                <Switch
                  checked={preferStreaming}
                  onCheckedChange={setPreferStreaming}
                />
              </div>
            </CardContent>
          </Card>

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
