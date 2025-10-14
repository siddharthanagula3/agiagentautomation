/**
 * API Reference Page
 * Comprehensive documentation for the AGI Agent Automation API
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@shared/ui/accordion';
import {
  Code,
  Copy,
  Play,
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
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    description: string;
    schema: unknown;
  };
  responses: Array<{
    status: number;
    description: string;
    schema?: unknown;
  }>;
  examples?: Array<{
    title: string;
    request?: string;
    response?: string;
  }>;
}

const APIReferencePage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('GET');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');

  const apiEndpoints: Record<string, APIEndpoint[]> = {
    'Authentication': [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user and return access token',
        requestBody: {
          type: 'application/json',
          description: 'User credentials',
          schema: {
            email: 'string',
            password: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Authentication successful',
            schema: {
              access_token: 'string',
              refresh_token: 'string',
              user: 'object',
            },
          },
          {
            status: 401,
            description: 'Invalid credentials',
          },
        ],
        examples: [
          {
            title: 'Login Request',
            request: `{
  "email": "user@example.com",
  "password": "password123"
}`,
            response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}`,
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user account',
        requestBody: {
          type: 'application/json',
          description: 'User registration data',
          schema: {
            email: 'string',
            password: 'string',
            name: 'string',
          },
        },
        responses: [
          {
            status: 201,
            description: 'User created successfully',
          },
          {
            status: 400,
            description: 'Validation error',
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user and invalidate tokens',
        responses: [
          {
            status: 200,
            description: 'Logout successful',
          },
        ],
      },
    ],
    'AI Employees': [
      {
        method: 'GET',
        path: '/api/employees',
        description: 'Get list of available AI employees',
        parameters: [
          {
            name: 'category',
            type: 'string',
            required: false,
            description: 'Filter by employee category',
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of employees to return',
          },
          {
            name: 'offset',
            type: 'number',
            required: false,
            description: 'Number of employees to skip',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'List of AI employees',
            schema: {
              employees: 'array',
              total: 'number',
              limit: 'number',
              offset: 'number',
            },
          },
        ],
        examples: [
          {
            title: 'Get All Employees',
            request: 'GET /api/employees',
            response: `{
  "employees": [
    {
      "id": "emp_001",
      "name": "Alex the Developer",
      "category": "development",
      "skills": ["JavaScript", "React", "Node.js"],
      "price": 29.99,
      "description": "Expert full-stack developer"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}`,
          },
        ],
      },
    {
      method: 'POST',
        path: '/api/employees/purchase',
        description: 'Purchase an AI employee',
        requestBody: {
          type: 'application/json',
          description: 'Employee purchase data',
          schema: {
            employee_id: 'string',
            payment_method_id: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Employee purchased successfully',
          },
          {
            status: 400,
            description: 'Invalid request or employee already purchased',
          },
        ],
    },
    {
      method: 'GET',
        path: '/api/employees/purchased',
        description: 'Get list of purchased AI employees',
        responses: [
          {
            status: 200,
            description: 'List of purchased employees',
          },
        ],
      },
    ],
    'Chat': [
    {
      method: 'POST',
        path: '/api/chat/message',
        description: 'Send a message to an AI employee',
        requestBody: {
          type: 'application/json',
          description: 'Chat message data',
          schema: {
            employee_id: 'string',
            message: 'string',
            session_id: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Message sent and response received',
            schema: {
              response: 'string',
              session_id: 'string',
              timestamp: 'string',
            },
          },
        ],
        examples: [
          {
            title: 'Send Chat Message',
            request: `{
  "employee_id": "emp_001",
  "message": "Hello, can you help me with React?",
  "session_id": "session_123"
}`,
            response: `{
  "response": "Hello! I'd be happy to help you with React. What specific aspect would you like to work on?",
  "session_id": "session_123",
  "timestamp": "2024-01-10T10:30:00Z"
}`,
          },
        ],
    },
    {
      method: 'GET',
        path: '/api/chat/sessions',
        description: 'Get chat sessions for a user',
        responses: [
          {
            status: 200,
            description: 'List of chat sessions',
          },
        ],
    },
    {
      method: 'GET',
        path: '/api/chat/sessions/{session_id}/messages',
        description: 'Get messages for a specific chat session',
        parameters: [
          {
            name: 'session_id',
            type: 'string',
            required: true,
            description: 'Chat session ID',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'List of messages in the session',
          },
        ],
      },
    ],
    'Billing': [
      {
        method: 'GET',
        path: '/api/billing/subscription',
        description: 'Get user subscription details',
        responses: [
          {
            status: 200,
            description: 'Subscription information',
            schema: {
              plan: 'string',
              status: 'string',
              current_period_end: 'string',
              cancel_at_period_end: 'boolean',
            },
          },
        ],
    },
    {
      method: 'POST',
        path: '/api/billing/subscription',
        description: 'Create or update subscription',
        requestBody: {
          type: 'application/json',
          description: 'Subscription data',
          schema: {
            plan_id: 'string',
            payment_method_id: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Subscription created/updated successfully',
          },
        ],
      },
      {
        method: 'DELETE',
        path: '/api/billing/subscription',
        description: 'Cancel subscription',
        responses: [
          {
            status: 200,
            description: 'Subscription cancelled successfully',
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/billing/invoices',
        description: 'Get billing invoices',
        responses: [
          {
            status: 200,
            description: 'List of invoices',
          },
        ],
      },
    ],
    'User Management': [
      {
        method: 'GET',
        path: '/api/user/profile',
        description: 'Get user profile information',
        responses: [
          {
            status: 200,
            description: 'User profile data',
          },
        ],
      },
      {
        method: 'PUT',
        path: '/api/user/profile',
        description: 'Update user profile',
        requestBody: {
          type: 'application/json',
          description: 'Profile update data',
          schema: {
            name: 'string',
            avatar: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Profile updated successfully',
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/user/settings',
        description: 'Get user settings',
        responses: [
          {
            status: 200,
            description: 'User settings',
          },
        ],
      },
      {
        method: 'PUT',
        path: '/api/user/settings',
        description: 'Update user settings',
        requestBody: {
          type: 'application/json',
          description: 'Settings update data',
          schema: {
            theme: 'string',
            notifications: 'boolean',
            language: 'string',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Settings updated successfully',
          },
        ],
      },
    ],
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleTestEndpoint = async () => {
    if (!selectedPath) return;

    try {
      // Simulate API call
      setResponse('Loading...');
      
      // In a real implementation, this would make an actual API call
      setTimeout(() => {
        setResponse(`{
  "message": "This is a simulated response",
  "timestamp": "${new Date().toISOString()}",
  "method": "${selectedMethod}",
  "path": "${selectedPath}"
}`);
      }, 1000);
    } catch (error) {
      setResponse(`Error: ${error}`);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Comprehensive documentation for the AGI Agent Automation API
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              REST API
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              JWT Authentication
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time Updates
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Supabase Backend
            </Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Endpoints List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(apiEndpoints).map(([category, endpoints]) => (
                    <Accordion key={category} type="single" collapsible>
                      <AccordionItem value={category}>
                        <AccordionTrigger className="text-sm font-medium">
                          {category}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 pl-4">
                            {endpoints.map((endpoint, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSelectedEndpoint(`${endpoint.method} ${endpoint.path}`);
                                  setSelectedMethod(endpoint.method);
                                  setSelectedPath(endpoint.path);
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded-md text-sm hover:bg-muted transition-colors",
                                  selectedEndpoint === `${endpoint.method} ${endpoint.path}` && "bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={getMethodColor(endpoint.method)}>
                                    {endpoint.method}
                                  </Badge>
                                  <span className="truncate">{endpoint.path}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                  </div>
              </CardContent>
                </Card>
          </div>

          {/* API Documentation */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="documentation" className="space-y-6">
              <TabsList>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="testing">API Testing</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="documentation" className="space-y-6">
                {selectedEndpoint ? (
                  (() => {
                    const [method, path] = selectedEndpoint.split(' ');
                    const endpoint = Object.values(apiEndpoints)
                      .flat()
                      .find(ep => ep.method === method && ep.path === path);
                    
                    if (!endpoint) return null;

                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Badge className={getMethodColor(endpoint.method)}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-lg">{endpoint.path}</code>
                          </CardTitle>
                          <p className="text-muted-foreground">{endpoint.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Parameters</h3>
                              <div className="space-y-2">
                                {endpoint.parameters.map((param, index) => (
                                  <div key={index} className="p-3 border rounded-md">
                                    <div className="flex items-center gap-2 mb-1">
                                      <code className="text-sm font-mono">{param.name}</code>
                                      <Badge variant="outline">{param.type}</Badge>
                                      {param.required && (
                                        <Badge variant="destructive">Required</Badge>
                                      )}
            </div>
                                    <p className="text-sm text-muted-foreground">{param.description}</p>
              </div>
                                ))}
              </div>
              </div>
                          )}

                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Request Body</h3>
                              <div className="p-3 border rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{endpoint.requestBody.type}</Badge>
              </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {endpoint.requestBody.description}
                                </p>
                                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                                  <code>{JSON.stringify(endpoint.requestBody.schema, null, 2)}</code>
                                </pre>
            </div>
        </div>
                          )}

                          {/* Responses */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Responses</h3>
                            <div className="space-y-2">
                              {endpoint.responses.map((response, index) => (
                                <div key={index} className="p-3 border rounded-md">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{response.status}</Badge>
                                    <span className="text-sm font-medium">{response.description}</span>
                                  </div>
                                  {response.schema && (
                                    <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto mt-2">
                                      <code>{JSON.stringify(response.schema, null, 2)}</code>
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Select an Endpoint</h3>
                      <p className="text-muted-foreground">
                        Choose an API endpoint from the list to view its documentation
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="testing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      API Testing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="method">Method</Label>
                        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="path">Path</Label>
                        <Input
                          id="path"
                          value={selectedPath}
                          onChange={(e) => setSelectedPath(e.target.value)}
                          placeholder="/api/endpoint"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="request-body">Request Body (JSON)</Label>
                      <Textarea
                        id="request-body"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder="Enter JSON request body..."
                        rows={6}
                      />
                    </div>

                    <Button onClick={handleTestEndpoint} className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Test Endpoint
                    </Button>

                    {response && (
                      <div>
                        <Label>Response</Label>
                        <div className="relative">
                          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                            <code>{response}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyCode(response)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                  </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="examples" className="space-y-6">
                {selectedEndpoint ? (
                  (() => {
                    const [method, path] = selectedEndpoint.split(' ');
                    const endpoint = Object.values(apiEndpoints)
                      .flat()
                      .find(ep => ep.method === method && ep.path === path);
                    
                    if (!endpoint || !endpoint.examples) return null;

                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Code Examples
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {endpoint.examples.map((example, index) => (
                            <div key={index} className="space-y-4">
                              <h3 className="text-lg font-semibold">{example.title}</h3>
                              
                              {example.request && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label>Request</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopyCode(example.request!)}
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </Button>
                                  </div>
                                  <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                                    <code>{example.request}</code>
                                  </pre>
                                </div>
                              )}

                              {example.response && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label>Response</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopyCode(example.response!)}
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </Button>
                                  </div>
                                  <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                                    <code>{example.response}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })()
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Select an Endpoint</h3>
                      <p className="text-muted-foreground">
                        Choose an API endpoint to view code examples
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the dashboard and include it in the Authorization header.
                </p>
                <code className="text-xs bg-muted p-2 rounded block">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">2. Make Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Use the endpoints above to interact with AI employees and manage your account.
                </p>
                <code className="text-xs bg-muted p-2 rounded block">
                  curl -H "Authorization: Bearer YOUR_API_KEY" https://api.agiagentautomation.com/employees
                </code>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">3. Handle Responses</h3>
                <p className="text-sm text-muted-foreground">
                  All responses are in JSON format with appropriate HTTP status codes.
                </p>
                <code className="text-xs bg-muted p-2 rounded block">
                  {`{ "success": true, "data": {...} }`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
    </div>
  );
};

export default APIReferencePage;