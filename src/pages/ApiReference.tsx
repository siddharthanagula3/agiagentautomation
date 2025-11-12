/**
 * API Reference Page - Comprehensive API Documentation
 * Details about API endpoints, authentication, and usage examples
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Code,
  Key,
  Globe,
  FileText,
  BookOpen,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SEOHead } from '@shared/components/seo/SEOHead';
import { toast } from 'sonner';

const ApiReferencePage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/chat/completion',
      description: 'Send a chat message and get AI response',
      auth: 'Bearer Token',
      example: `curl -X POST https://api.agiagentautomation.com/api/chat/completion \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "model": "gpt-4",
    "session_id": "optional-session-id"
  }'`,
    },
    {
      method: 'GET',
      path: '/api/sessions',
      description: 'Get all chat sessions for the authenticated user',
      auth: 'Bearer Token',
      example: `curl -X GET https://api.agiagentautomation.com/api/sessions \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      method: 'GET',
      path: '/api/sessions/:id/messages',
      description: 'Get all messages for a specific session',
      auth: 'Bearer Token',
      example: `curl -X GET https://api.agiagentautomation.com/api/sessions/session-id/messages \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
    {
      method: 'POST',
      path: '/api/employees/hire',
      description: 'Hire an AI employee',
      auth: 'Bearer Token',
      example: `curl -X POST https://api.agiagentautomation.com/api/employees/hire \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "employee_id": "code-reviewer"
  }'`,
    },
  ];

  const authenticationInfo = {
    title: 'Authentication',
    description:
      'All API requests require authentication using a Bearer token. You can generate an API key in your account settings.',
    steps: [
      'Go to Settings → API Keys',
      'Click "Generate New API Key"',
      'Copy the API key (it will only be shown once)',
      'Include it in the Authorization header: Authorization: Bearer YOUR_API_KEY',
    ],
  };

  const rateLimits = [
    { plan: 'Free', requests: '100 requests/hour', tokens: '1M tokens/month' },
    { plan: 'Pro', requests: '1,000 requests/hour', tokens: '10M tokens/month' },
    { plan: 'Enterprise', requests: 'Unlimited', tokens: 'Custom' },
  ];

  return (
    <>
      <SEOHead
        title="API Reference | AGI Agent Automation"
        description="Complete API documentation for integrating AGI Agent Automation into your applications."
        keywords={['API', 'documentation', 'integration', 'REST API', 'developer']}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 px-4 py-2">
                <Code className="mr-2 h-4 w-4" />
                Developer Resources
              </Badge>
              <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
                API Reference
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                Integrate AGI Agent Automation into your applications with our comprehensive REST
                API. Build powerful AI-powered features with ease.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://docs.mgx.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Button>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Full API Docs
                  </Button>
                </a>
                <a href="/documentation">
                  <Button variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Documentation
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>

              {/* API Endpoints */}
              <TabsContent value="endpoints" className="space-y-6">
                <div>
                  <h2 className="mb-6 text-3xl font-bold">API Endpoints</h2>
                  <div className="space-y-6">
                    {apiEndpoints.map((endpoint, index) => (
                      <motion.div
                        key={endpoint.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="border-border">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant={
                                    endpoint.method === 'POST'
                                      ? 'default'
                                      : endpoint.method === 'GET'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                >
                                  {endpoint.method}
                                </Badge>
                                <code className="text-lg font-mono">{endpoint.path}</code>
                              </div>
                            </div>
                            <CardTitle className="mt-4">{endpoint.description}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="relative">
                              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                                <code>{endpoint.example}</code>
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2"
                                onClick={() => copyToClipboard(endpoint.example, endpoint.path)}
                              >
                                {copiedCode === endpoint.path ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Authentication */}
              <TabsContent value="authentication" className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {authenticationInfo.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-6 text-muted-foreground">
                      {authenticationInfo.description}
                    </p>
                    <div className="space-y-3">
                      {authenticationInfo.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-1">
                            {index + 1}
                          </Badge>
                          <p className="text-muted-foreground">{step}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-lg bg-muted p-4">
                      <p className="mb-2 text-sm font-semibold">Example Header:</p>
                      <code className="text-sm">
                        Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxx
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rate Limits */}
              <TabsContent value="rate-limits" className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Rate Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-6 text-muted-foreground">
                      Rate limits are applied per API key and vary by plan. Exceeding limits will
                      result in a 429 Too Many Requests response.
                    </p>
                    <div className="space-y-4">
                      {rateLimits.map((limit) => (
                        <div
                          key={limit.plan}
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
                          <div>
                            <h3 className="font-semibold">{limit.plan} Plan</h3>
                            <p className="text-sm text-muted-foreground">
                              {limit.requests} • {limit.tokens}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Examples */}
              <TabsContent value="examples" className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="mb-3 font-semibold">JavaScript/TypeScript</h3>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                          <code>{`const response = await fetch('https://api.agiagentautomation.com/api/chat/completion', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    model: 'gpt-4',
  }),
});

const data = await response.json();
console.log(data);`}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() =>
                            copyToClipboard(
                              `const response = await fetch('https://api.agiagentautomation.com/api/chat/completion', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    model: 'gpt-4',
  }),
});

const data = await response.json();
console.log(data);`,
                              'js-example'
                            )
                          }
                        >
                          {copiedCode === 'js-example' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">Python</h3>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                          <code>{`import requests

response = requests.post(
    'https://api.agiagentautomation.com/api/chat/completion',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'message': 'Hello, how can you help me?',
        'model': 'gpt-4',
    }
)

data = response.json()
print(data)`}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() =>
                            copyToClipboard(
                              `import requests

response = requests.post(
    'https://api.agiagentautomation.com/api/chat/completion',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'message': 'Hello, how can you help me?',
        'model': 'gpt-4',
    }
)

data = response.json()
print(data)`,
                              'python-example'
                            )
                          }
                        >
                          {copiedCode === 'python-example' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <a
                    href="https://docs.mgx.dev/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">Full API Documentation</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete API reference with all endpoints
                      </p>
                    </div>
                  </a>
                  <a
                    href="/documentation"
                    className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <BookOpen className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">Platform Documentation</h3>
                      <p className="text-sm text-muted-foreground">
                        Guides and tutorials for using the platform
                      </p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default ApiReferencePage;
