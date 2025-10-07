import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, ExternalLink, Copy, AlertTriangle, Info } from 'lucide-react';

interface APISetupGuideProps {
  onClose?: () => void;
}

export function APISetupGuide({ onClose }: APISetupGuideProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const providers = [
    {
      name: 'OpenAI (ChatGPT)',
      key: 'VITE_OPENAI_API_KEY',
      url: 'https://platform.openai.com/api-keys',
      description: 'Most popular AI provider with GPT models',
      features: ['GPT-4', 'GPT-3.5', 'Function calling', 'Image analysis'],
      status: 'active'
    },
    {
      name: 'Anthropic (Claude)',
      key: 'VITE_ANTHROPIC_API_KEY',
      url: 'https://console.anthropic.com/',
      description: 'Advanced AI with long context and safety features',
      features: ['Claude 3.5 Sonnet', 'Long context', 'Safety controls', 'System instructions'],
      status: 'active'
    },
    {
      name: 'Google (Gemini)',
      key: 'VITE_GOOGLE_API_KEY',
      url: 'https://aistudio.google.com/app/apikey',
      description: 'Multimodal AI with image and text capabilities',
      features: ['Gemini 2.0', 'Multimodal', 'Image analysis', 'Real-time data'],
      status: 'active'
    },
    {
      name: 'Perplexity',
      key: 'VITE_PERPLEXITY_API_KEY',
      url: 'https://www.perplexity.ai/settings/api',
      description: 'AI with real-time web search capabilities',
      features: ['Web search', 'Real-time data', 'Up-to-date information', 'Research assistant'],
      status: 'active'
    }
  ];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envExample = `# AI Provider API Keys
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_GOOGLE_API_KEY=your_google_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_key_here

# Demo Mode (optional - enables mock responses when keys are missing)
VITE_DEMO_MODE=true`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI API Setup Guide</h1>
        <p className="text-muted-foreground">
          Configure API keys for all supported AI providers to enable full functionality
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Start:</strong> You only need to configure one API key to get started. 
          The app will work with demo mode for unconfigured providers.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">API Providers</TabsTrigger>
          <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => (
              <Card key={provider.name} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                      {provider.status === 'active' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {provider.key}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(provider.key, provider.key)}
                      >
                        {copiedKey === provider.key ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <a href={provider.url} target="_blank" rel="noopener noreferrer">
                      Get API Key
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Environment File</CardTitle>
              <CardDescription>
                Create a <code>.env</code> file in your project root
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {envExample}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(envExample, 'env')}
                >
                  {copiedKey === 'env' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Get API Keys</CardTitle>
              <CardDescription>
                Follow the links below to get your API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {providers.map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">{provider.description}</div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={provider.url} target="_blank" rel="noopener noreferrer">
                      Get Key
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3: Test Your Setup</CardTitle>
              <CardDescription>
                Start the development server and test the chat interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <code className="block bg-muted p-2 rounded text-sm">
                  npm run dev
                </code>
                <p className="text-sm text-muted-foreground">
                  Navigate to the chat interface and try sending a message with each AI provider.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium">"Invalid API key" Error</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        • Check if the key is correctly copied (no extra spaces)<br/>
                        • Verify the key is active in the provider's dashboard<br/>
                        • Ensure the key has the correct permissions
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium">"Rate limit exceeded" Error</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        • Wait a few minutes and try again<br/>
                        • Check your usage limits in the provider's dashboard<br/>
                        • Consider upgrading your plan if needed
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium">"Network error" Error</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        • Check your internet connection<br/>
                        • Verify firewall settings aren't blocking requests<br/>
                        • Try again in a few minutes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium">"Insufficient funds" Error</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        • Add credits to your OpenAI/Anthropic account<br/>
                        • Check billing information is up to date<br/>
                        • Set up billing alerts to avoid surprises
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Mode</CardTitle>
              <CardDescription>
                Enable demo mode to test the interface without API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  Add <code>VITE_DEMO_MODE=true</code> to your <code>.env</code> file to enable demo mode.
                  This will show mock responses instead of errors when API keys are missing.
                </p>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Demo mode is perfect for testing the interface and showing the app to others
                    without requiring API keys.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close Guide
          </Button>
        </div>
      )}
    </div>
  );
}