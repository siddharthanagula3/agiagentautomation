import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Particles } from '@/components/ui/particles';
import {
  Code,
  Search,
  Database,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Webhook,
  Settings,
  Plus,
  Check,
  Zap,
  Terminal,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { toolExecutorService } from '@/services/tool-executor-service';

const MCPToolsPage: React.FC = () => {
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const toolCategories = [
    {
      name: 'Research & Search',
      icon: Search,
      tools: [
        {
          id: 'web_search',
          name: 'Web Search',
          description: 'Search the web for current information using multiple search engines',
          icon: Globe,
          enabled: true,
          config: {
            engine: 'google',
            maxResults: 5,
            safeSearch: true
          }
        },
        {
          id: 'knowledge_base',
          name: 'Knowledge Base',
          description: 'Search through your uploaded documents and knowledge base',
          icon: Database,
          enabled: false,
          config: {}
        }
      ]
    },
    {
      name: 'Code & Development',
      icon: Code,
      tools: [
        {
          id: 'code_interpreter',
          name: 'Code Interpreter',
          description: 'Execute Python, JavaScript, and TypeScript code in a secure sandbox',
          icon: Terminal,
          enabled: true,
          config: {
            timeout: 30,
            memoryLimit: '512MB',
            allowedPackages: ['numpy', 'pandas', 'matplotlib']
          }
        },
        {
          id: 'github_integration',
          name: 'GitHub',
          description: 'Create repos, commit code, create PRs, and manage issues',
          icon: Code,
          enabled: false,
          config: {
            apiKey: '',
            defaultOrg: ''
          }
        }
      ]
    },
    {
      name: 'Data & Analytics',
      icon: BarChart3,
      tools: [
        {
          id: 'create_visualization',
          name: 'Data Visualization',
          description: 'Create interactive charts and graphs from data',
          icon: BarChart3,
          enabled: true,
          config: {
            defaultTheme: 'dark',
            exportFormats: ['png', 'svg', 'pdf']
          }
        },
        {
          id: 'analyze_file',
          name: 'File Analysis',
          description: 'Analyze CSV, Excel, PDF, and image files',
          icon: FileText,
          enabled: true,
          config: {
            maxFileSize: '50MB',
            supportedFormats: ['csv', 'xlsx', 'pdf', 'png', 'jpg']
          }
        }
      ]
    },
    {
      name: 'Integrations',
      icon: Webhook,
      tools: [
        {
          id: 'api_call',
          name: 'API Calls',
          description: 'Make HTTP requests to external APIs',
          icon: Webhook,
          enabled: true,
          config: {
            timeout: 30,
            followRedirects: true,
            maxRetries: 3
          }
        },
        {
          id: 'slack_integration',
          name: 'Slack',
          description: 'Send messages and interact with Slack workspaces',
          icon: Settings,
          enabled: false,
          config: {
            webhookUrl: '',
            defaultChannel: ''
          }
        }
      ]
    }
  ];

  const toggleTool = (toolId: string) => {
    setEnabledTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
        toast.success('Tool disabled');
      } else {
        newSet.add(toolId);
        toast.success('Tool enabled');
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Particles className="absolute inset-0 -z-10" quantity={40} />

      {/* Header */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">MCP Tools</h1>
              </div>
              <p className="text-muted-foreground">
                Configure and manage Model Context Protocol tools for your AI employees
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Custom MCP Tool</DialogTitle>
                  <DialogDescription>
                    Create a custom tool using the Model Context Protocol specification
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Tool Name</Label>
                    <Input placeholder="my_custom_tool" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input placeholder="What does this tool do?" />
                  </div>
                  <div>
                    <Label>Input Schema (JSON)</Label>
                    <textarea
                      className="w-full h-32 p-3 rounded-lg border border-border bg-background font-mono text-sm"
                      placeholder={'{\n  "type": "object",\n  "properties": {},\n  "required": []\n}'}
                    />
                  </div>
                  <div>
                    <Label>Endpoint URL</Label>
                    <Input placeholder="https://api.example.com/tool" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Tool</Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <Tabs defaultValue="all" className="space-y-8">
            <TabsList className="glass">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="enabled">Enabled</TabsTrigger>
              <TabsTrigger value="disabled">Disabled</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              {toolCategories.map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <category.icon className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.tools.map((tool) => (
                      <Card
                        key={tool.id}
                        className="p-6 border-2 border-border/50 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <tool.icon className="h-6 w-6 text-primary" />
                          </div>
                          <Switch
                            checked={enabledTools.has(tool.id)}
                            onCheckedChange={() => toggleTool(tool.id)}
                          />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {tool.description}
                        </p>
                        {enabledTools.has(tool.id) && (
                          <Badge className="gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => setSelectedTool(tool.id)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="enabled">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {enabledTools.size} tool{enabledTools.size !== 1 ? 's' : ''} enabled
                </p>
              </div>
            </TabsContent>

            <TabsContent value="disabled">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No disabled tools</p>
              </div>
            </TabsContent>

            <TabsContent value="custom">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No custom tools created yet
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Tool
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default MCPToolsPage;
