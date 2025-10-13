/**
 * Developer Guide Page
 * Comprehensive guide for developers integrating with AGI Agent Automation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Code,
  Copy,
  Book,
  Globe,
  Shield,
  Zap,
  Database,
  Users,
  Bot,
  MessageSquare,
  CreditCard,
  Settings,
  FileText,
  ChevronRight,
  ExternalLink,
  Download,
  Play,
  Terminal,
  GitBranch,
  Package,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeExample {
  language: string;
  title: string;
  code: string;
  description: string;
}

interface SDKInfo {
  name: string;
  language: string;
  version: string;
  installCommand: string;
  description: string;
  features: string[];
}

const DeveloperGuidePage: React.FC = () => {
  const [selectedSDK, setSelectedSDK] = useState<string>('javascript');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const sdks: Record<string, SDKInfo> = {
    javascript: {
      name: 'JavaScript SDK',
      language: 'JavaScript/TypeScript',
      version: '1.0.0',
      installCommand: 'npm install @agi-agent-automation/sdk',
      description: 'Official JavaScript SDK for Node.js and browser environments',
      features: [
        'TypeScript support',
        'Promise-based API',
        'Automatic retry logic',
        'Request/response interceptors',
        'Built-in error handling',
      ],
    },
    python: {
      name: 'Python SDK',
      language: 'Python',
      version: '1.0.0',
      installCommand: 'pip install agi-agent-automation',
      description: 'Official Python SDK for server-side applications',
      features: [
        'Async/await support',
        'Type hints',
        'Automatic retry logic',
        'Request/response interceptors',
        'Built-in error handling',
      ],
    },
    php: {
      name: 'PHP SDK',
      language: 'PHP',
      version: '1.0.0',
      installCommand: 'composer require agi-agent-automation/sdk',
      description: 'Official PHP SDK for web applications',
      features: [
        'PSR-4 autoloading',
        'Guzzle HTTP client',
        'Automatic retry logic',
        'Request/response interceptors',
        'Built-in error handling',
      ],
    },
  };

  const codeExamples: Record<string, CodeExample[]> = {
    javascript: [
      {
        language: 'javascript',
        title: 'Basic Setup',
        description: 'Initialize the SDK with your API key',
        code: `import { AGIAgentClient } from '@agi-agent-automation/sdk';

const client = new AGIAgentClient({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://api.agiagentautomation.com'
});`,
      },
      {
        language: 'javascript',
        title: 'List AI Employees',
        description: 'Get a list of available AI employees',
        code: `// Get all employees
const employees = await client.employees.list();

// Filter by category
const developers = await client.employees.list({
  category: 'development'
});

// Pagination
const page = await client.employees.list({
  limit: 10,
  offset: 0
});`,
      },
      {
        language: 'javascript',
        title: 'Purchase an Employee',
        description: 'Purchase an AI employee for your account',
        code: `const purchase = await client.employees.purchase({
  employeeId: 'emp_001',
  paymentMethodId: 'pm_1234567890'
});

console.log('Employee purchased:', purchase.id);`,
      },
      {
        language: 'javascript',
        title: 'Send Chat Message',
        description: 'Send a message to an AI employee',
        code: `const response = await client.chat.sendMessage({
  employeeId: 'emp_001',
  message: 'Hello, can you help me with React?',
  sessionId: 'session_123'
});

console.log('AI Response:', response.message);`,
      },
      {
        language: 'javascript',
        title: 'Handle Webhooks',
        description: 'Set up webhook handling for real-time updates',
        code: `import express from 'express';
import { WebhookHandler } from '@agi-agent-automation/sdk';

const app = express();
const webhookHandler = new WebhookHandler('your-webhook-secret');

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const event = webhookHandler.verify(req.body, req.headers['stripe-signature']);
    
    switch (event.type) {
      case 'employee.purchased':
        console.log('Employee purchased:', event.data);
        break;
      case 'chat.message.received':
        console.log('New message:', event.data);
        break;
    }
    
    res.json({received: true});
  } catch (err) {
    res.status(400).send('Webhook Error');
  }
});`,
      },
    ],
    python: [
      {
        language: 'python',
        title: 'Basic Setup',
        description: 'Initialize the SDK with your API key',
        code: `from agi_agent_automation import AGIAgentClient

client = AGIAgentClient(
    api_key='your-api-key-here',
    base_url='https://api.agiagentautomation.com'
)`,
      },
      {
        language: 'python',
        title: 'List AI Employees',
        description: 'Get a list of available AI employees',
        code: `# Get all employees
employees = client.employees.list()

# Filter by category
developers = client.employees.list(category='development')

# Pagination
page = client.employees.list(limit=10, offset=0)`,
      },
      {
        language: 'python',
        title: 'Purchase an Employee',
        description: 'Purchase an AI employee for your account',
        code: `purchase = client.employees.purchase(
    employee_id='emp_001',
    payment_method_id='pm_1234567890'
)

print(f'Employee purchased: {purchase.id}')`,
      },
      {
        language: 'python',
        title: 'Send Chat Message',
        description: 'Send a message to an AI employee',
        code: `response = client.chat.send_message(
    employee_id='emp_001',
    message='Hello, can you help me with React?',
    session_id='session_123'
)

print(f'AI Response: {response.message}')`,
      },
    ],
    php: [
      {
        language: 'php',
        title: 'Basic Setup',
        description: 'Initialize the SDK with your API key',
        code: `<?php
use AGIAgentAutomation\\Client;

$client = new Client([
    'api_key' => 'your-api-key-here',
    'base_url' => 'https://api.agiagentautomation.com'
]);`,
      },
      {
        language: 'php',
        title: 'List AI Employees',
        description: 'Get a list of available AI employees',
        code: `<?php
// Get all employees
$employees = $client->employees()->list();

// Filter by category
$developers = $client->employees()->list(['category' => 'development']);

// Pagination
$page = $client->employees()->list(['limit' => 10, 'offset' => 0]);`,
      },
      {
        language: 'php',
        title: 'Purchase an Employee',
        description: 'Purchase an AI employee for your account',
        code: `<?php
$purchase = $client->employees()->purchase([
    'employee_id' => 'emp_001',
    'payment_method_id' => 'pm_1234567890'
]);

echo "Employee purchased: " . $purchase->id;`,
      },
      {
        language: 'php',
        title: 'Send Chat Message',
        description: 'Send a message to an AI employee',
        code: `<?php
$response = $client->chat()->sendMessage([
    'employee_id' => 'emp_001',
    'message' => 'Hello, can you help me with React?',
    'session_id' => 'session_123'
]);

echo "AI Response: " . $response->message;`,
      },
    ],
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleGenerateApiKey = () => {
    // Simulate API key generation
    const generatedKey = 'agi_' + Math.random().toString(36).substr(2, 32);
    setApiKey(generatedKey);
    toast.success('API key generated');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Developer Guide</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Everything you need to integrate AGI Agent Automation into your application
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Official SDKs
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure API
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              RESTful API
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="sdks">SDKs</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    1. Get API Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign up for an account and generate your API key from the dashboard.
                  </p>
                  <Button className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get API Key
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    2. Install SDK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred language and install the official SDK.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    View SDKs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    3. Start Building
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Follow our examples and start integrating AI employees into your app.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    View Examples
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">JavaScript</Badge>
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">Browser</Badge>
                  </div>
                  <div className="relative">
                    <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{`// Install the SDK
npm install @agi-agent-automation/sdk

// Initialize the client
import { AGIAgentClient } from '@agi-agent-automation/sdk';

const client = new AGIAgentClient({
  apiKey: 'your-api-key-here'
});

// List available AI employees
const employees = await client.employees.list();
console.log(employees);`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopyCode(`// Install the SDK
npm install @agi-agent-automation/sdk

// Initialize the client
import { AGIAgentClient } from '@agi-agent-automation/sdk';

const client = new AGIAgentClient({
  apiKey: 'your-api-key-here'
});

// List available AI employees
const employees = await client.employees.list();
console.log(employees);`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(sdks).map(([key, sdk]) => (
                <Card key={key} className={cn(
                  "cursor-pointer transition-all",
                  selectedSDK === key && "ring-2 ring-primary"
                )} onClick={() => setSelectedSDK(key)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">{sdk.language}</Badge>
                      {sdk.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{sdk.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Version:</strong> {sdk.version}
                      </div>
                      <div className="text-sm">
                        <strong>Install:</strong>
                      </div>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {sdk.installCommand}
                      </code>
                      <div className="text-sm">
                        <strong>Features:</strong>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {sdk.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedSDK && (
              <Card>
                <CardHeader>
                  <CardTitle>{sdks[selectedSDK].name} - Installation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Installation Command</Label>
                      <div className="relative">
                        <Input
                          value={sdks[selectedSDK].installCommand}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => handleCopyCode(sdks[selectedSDK].installCommand)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Basic Usage</Label>
                      <div className="relative">
                        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{codeExamples[selectedSDK][0]?.code || 'No example available'}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode(codeExamples[selectedSDK][0]?.code || '')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  API Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">API Key Management</h3>
                  <p className="text-muted-foreground mb-4">
                    All API requests require authentication using your API key. You can generate and manage your API keys from the dashboard.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="api-key">Your API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Generate or enter your API key"
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button onClick={handleGenerateApiKey}>
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Using Your API Key</h3>
                  <p className="text-muted-foreground mb-4">
                    Include your API key in the Authorization header of all requests:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>HTTP Header</Label>
                      <div className="relative">
                        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{`Authorization: Bearer your-api-key-here`}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode('Authorization: Bearer your-api-key-here')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>cURL Example</Label>
                      <div className="relative">
                        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{`curl -H "Authorization: Bearer your-api-key-here" \\
     https://api.agiagentautomation.com/employees`}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopyCode(`curl -H "Authorization: Bearer your-api-key-here" \\
     https://api.agiagentautomation.com/employees`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Security Best Practices</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Never expose your API key in client-side code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Use environment variables to store API keys</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Rotate your API keys regularly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Use different API keys for different environments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">What are Webhooks?</h3>
                  <p className="text-muted-foreground mb-4">
                    Webhooks allow you to receive real-time notifications when events occur in your account. 
                    This enables you to build reactive applications that respond to changes immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Available Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Employee Events</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• employee.purchased</li>
                        <li>• employee.activated</li>
                        <li>• employee.deactivated</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Chat Events</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• chat.message.sent</li>
                        <li>• chat.message.received</li>
                        <li>• chat.session.started</li>
                        <li>• chat.session.ended</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Billing Events</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• subscription.created</li>
                        <li>• subscription.updated</li>
                        <li>• subscription.cancelled</li>
                        <li>• invoice.paid</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">User Events</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• user.created</li>
                        <li>• user.updated</li>
                        <li>• user.deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Webhook Payload Example</h3>
                  <div className="relative">
                    <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                      <code>{`{
  "id": "evt_1234567890",
  "type": "employee.purchased",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "emp_001",
      "name": "Alex the Developer",
      "category": "development",
      "user_id": "user_123",
      "purchased_at": "2024-01-10T10:30:00Z"
    }
  }
}`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopyCode(`{
  "id": "evt_1234567890",
  "type": "employee.purchased",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "emp_001",
      "name": "Alex the Developer",
      "category": "development",
      "user_id": "user_123",
      "purchased_at": "2024-01-10T10:30:00Z"
    }
  }
}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Setting Up Webhooks</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>1. Create a webhook endpoint</Label>
                      <p className="text-sm text-muted-foreground">
                        Create a public HTTPS endpoint that can receive POST requests.
                      </p>
                    </div>
                    <div>
                      <Label>2. Configure in dashboard</Label>
                      <p className="text-sm text-muted-foreground">
                        Add your webhook URL in the dashboard and select the events you want to receive.
                      </p>
                    </div>
                    <div>
                      <Label>3. Verify webhook signature</Label>
                      <p className="text-sm text-muted-foreground">
                        Always verify the webhook signature to ensure the request is from AGI Agent Automation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="space-y-6">
              {selectedSDK && codeExamples[selectedSDK]?.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      {example.title}
                    </CardTitle>
                    <p className="text-muted-foreground">{example.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(example.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperGuidePage;
