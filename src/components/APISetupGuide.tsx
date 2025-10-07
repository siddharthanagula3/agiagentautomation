import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Settings,
  Bot,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface APISetupGuideProps {
  onClose?: () => void;
}

const APISetupGuide: React.FC<APISetupGuideProps> = ({ onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiProviders = [
    {
      name: 'OpenAI (ChatGPT)',
      icon: '🤖',
      description: 'Most popular AI model, great for general tasks',
      url: 'https://platform.openai.com/api-keys',
      envVar: 'VITE_OPENAI_API_KEY',
      cost: '$0.01-0.06 per 1K tokens',
      free: false
    },
    {
      name: 'Anthropic (Claude)',
      icon: '🧠',
      description: 'Advanced reasoning and analysis',
      url: 'https://console.anthropic.com/',
      envVar: 'VITE_ANTHROPIC_API_KEY',
      cost: '$0.003-0.015 per 1K tokens',
      free: false
    },
    {
      name: 'Google (Gemini)',
      icon: '💎',
      description: 'Google\'s latest AI model with free tier',
      url: 'https://aistudio.google.com/app/apikey',
      envVar: 'VITE_GOOGLE_API_KEY',
      cost: 'Free tier available',
      free: true
    },
    {
      name: 'Perplexity',
      icon: '🔍',
      description: 'Real-time web search and information',
      url: 'https://www.perplexity.ai/settings/api',
      envVar: 'VITE_PERPLEXITY_API_KEY',
      cost: '$0.20 per 1M tokens',
      free: false
    }
  ];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envExample = `# AI API Keys Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Demo Mode (set to true to use mock responses)
VITE_DEMO_MODE=false`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Key className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI API Setup Guide</h1>
            <p className="text-muted-foreground">Configure your AI providers to unlock the full potential</p>
          </div>
        </div>
      </motion.div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Start:</strong> You can enable demo mode by setting <code>VITE_DEMO_MODE=true</code> in your .env file to test the application without API keys.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apiProviders.map((provider, index) => (
          <motion.div
            key={provider.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  {provider.free && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Free Tier
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cost:</span>
                  <span className="text-sm font-medium">{provider.cost}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Environment Variable:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(provider.envVar, provider.name)}
                    >
                      {copiedKey === provider.name ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="block p-2 bg-muted rounded text-sm font-mono">
                    {provider.envVar}
                  </code>
                </div>

                <Button 
                  asChild 
                  className="w-full"
                  variant="outline"
                >
                  <a 
                    href={provider.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Get API Key
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Configuration
            </CardTitle>
            <CardDescription>
              Create a .env file in your project root with the following configuration:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(envExample, 'env')}
              >
                {copiedKey === 'env' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {envExample}
              </pre>
            </div>
            
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode:</strong> Set <code>VITE_DEMO_MODE=true</code> to use mock responses without API keys.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Ready to get started?</span>
        </div>
        <p className="text-muted-foreground">
          After configuring your API keys, restart your development server to see the changes take effect.
        </p>
        {onClose && (
          <Button onClick={onClose} className="gradient-primary text-white">
            Got it!
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default APISetupGuide;
