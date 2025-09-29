/**
 * Visual Workflow Designer Component
 * Node-based automation builder with real-time execution monitoring
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Bot,
  Brain,
  MessageSquare,
  Database,
  Globe,
  Code,
  Mail,
  Webhook,
  Calendar,
  Filter,
  BarChart3,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Search,
  Users,
  Shield,
  Key,
  Link,
  GitBranch,
  ArrowRight,
  ArrowDown,
  MoreVertical,
  X,
  Info,
  Warning,
  Sparkles,
  Target,
  Activity,
  Cpu,
  Network,
  Server,
  Cloud,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types for the workflow designer
interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  selected?: boolean;
  executing?: boolean;
  completed?: boolean;
  error?: string;
}

interface NodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  inputs?: NodePort[];
  outputs?: NodePort[];
}

interface NodePort {
  id: string;
  label: string;
  type: 'data' | 'control' | 'trigger';
  required?: boolean;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  animated?: boolean;
  selected?: boolean;
}

interface WorkflowExecution {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentNode?: string;
  nodeResults: Record<string, any>;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  nodeId: string;
  message: string;
  data?: any;
}

type NodeType = 
  | 'trigger'
  | 'ai_service'
  | 'data_processor' 
  | 'condition'
  | 'action'
  | 'integration'
  | 'notification'
  | 'delay'
  | 'webhook'
  | 'code'
  | 'http_request'
  | 'database'
  | 'file_processor'
  | 'email'
  | 'slack'
  | 'output';

interface NodeTemplate {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: string;
  defaultData: Partial<NodeData>;
  configSchema?: any; // JSON schema for configuration
}

interface VisualWorkflowDesignerProps {
  className?: string;
  workflowId?: string;
  onSave?: (workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  onExecute?: (workflowId: string) => void;
  readOnly?: boolean;
}

// Node templates for the designer
const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    id: 'schedule_trigger',
    type: 'trigger',
    label: 'Schedule Trigger',
    description: 'Execute workflow on a schedule',
    icon: Calendar,
    color: 'blue',
    category: 'Triggers',
    defaultData: {
      label: 'Schedule Trigger',
      config: { frequency: 'daily', time: '09:00' },
      outputs: [{ id: 'trigger_out', label: 'Triggered', type: 'control' }]
    }
  },
  {
    id: 'webhook_trigger',
    type: 'webhook',
    label: 'Webhook Trigger',
    description: 'Execute workflow when webhook is called',
    icon: Webhook,
    color: 'green',
    category: 'Triggers',
    defaultData: {
      label: 'Webhook Trigger',
      config: { method: 'POST', path: '/webhook' },
      outputs: [{ id: 'webhook_out', label: 'Data', type: 'data' }]
    }
  },
  
  // AI Services
  {
    id: 'openai_completion',
    type: 'ai_service',
    label: 'OpenAI Completion',
    description: 'Generate text using OpenAI models',
    icon: Brain,
    color: 'purple',
    category: 'AI Services',
    defaultData: {
      label: 'OpenAI Completion',
      config: { model: 'gpt-4', temperature: 0.7, maxTokens: 1000 },
      inputs: [{ id: 'prompt', label: 'Prompt', type: 'data', required: true }],
      outputs: [{ id: 'completion', label: 'Completion', type: 'data' }]
    }
  },
  {
    id: 'claude_analysis',
    type: 'ai_service',
    label: 'Claude Analysis',
    description: 'Analyze data using Claude models',
    icon: Cpu,
    color: 'orange',
    category: 'AI Services',
    defaultData: {
      label: 'Claude Analysis',
      config: { model: 'claude-3-opus', temperature: 0.3 },
      inputs: [{ id: 'data', label: 'Data', type: 'data', required: true }],
      outputs: [{ id: 'analysis', label: 'Analysis', type: 'data' }]
    }
  },

  // Data Processing
  {
    id: 'data_transformer',
    type: 'data_processor',
    label: 'Data Transformer',
    description: 'Transform and manipulate data',
    icon: Database,
    color: 'cyan',
    category: 'Data Processing',
    defaultData: {
      label: 'Data Transformer',
      config: { transformation: 'json_parse' },
      inputs: [{ id: 'input_data', label: 'Input', type: 'data', required: true }],
      outputs: [{ id: 'output_data', label: 'Output', type: 'data' }]
    }
  },
  {
    id: 'condition_check',
    type: 'condition',
    label: 'Condition',
    description: 'Branch workflow based on conditions',
    icon: GitBranch,
    color: 'yellow',
    category: 'Data Processing',
    defaultData: {
      label: 'Condition',
      config: { operator: 'equals', value: '' },
      inputs: [{ id: 'input', label: 'Input', type: 'data', required: true }],
      outputs: [
        { id: 'true', label: 'True', type: 'control' },
        { id: 'false', label: 'False', type: 'control' }
      ]
    }
  },

  // Actions
  {
    id: 'http_request',
    type: 'http_request',
    label: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    icon: Globe,
    color: 'indigo',
    category: 'Actions',
    defaultData: {
      label: 'HTTP Request',
      config: { method: 'GET', url: '', headers: {} },
      inputs: [{ id: 'url', label: 'URL', type: 'data' }],
      outputs: [{ id: 'response', label: 'Response', type: 'data' }]
    }
  },
  {
    id: 'email_send',
    type: 'email',
    label: 'Send Email',
    description: 'Send emails via configured email service',
    icon: Mail,
    color: 'red',
    category: 'Actions',
    defaultData: {
      label: 'Send Email',
      config: { subject: '', body: '', to: [] },
      inputs: [
        { id: 'to', label: 'To', type: 'data', required: true },
        { id: 'subject', label: 'Subject', type: 'data' },
        { id: 'body', label: 'Body', type: 'data' }
      ],
      outputs: [{ id: 'sent', label: 'Sent', type: 'control' }]
    }
  },
  {
    id: 'slack_message',
    type: 'slack',
    label: 'Slack Message',
    description: 'Send messages to Slack channels',
    icon: MessageSquare,
    color: 'green',
    category: 'Actions',
    defaultData: {
      label: 'Slack Message',
      config: { channel: '', message: '' },
      inputs: [
        { id: 'channel', label: 'Channel', type: 'data', required: true },
        { id: 'message', label: 'Message', type: 'data', required: true }
      ],
      outputs: [{ id: 'sent', label: 'Sent', type: 'control' }]
    }
  },

  // Utilities
  {
    id: 'delay',
    type: 'delay',
    label: 'Delay',
    description: 'Add delay between workflow steps',
    icon: Clock,
    color: 'gray',
    category: 'Utilities',
    defaultData: {
      label: 'Delay',
      config: { duration: 5, unit: 'seconds' },
      inputs: [{ id: 'trigger', label: 'Trigger', type: 'control' }],
      outputs: [{ id: 'delayed', label: 'After Delay', type: 'control' }]
    }
  },
  {
    id: 'code_executor',
    type: 'code',
    label: 'Code Executor',
    description: 'Execute custom JavaScript code',
    icon: Code,
    color: 'emerald',
    category: 'Utilities',
    defaultData: {
      label: 'Code Executor',
      config: { code: '// Your code here\nreturn input;' },
      inputs: [{ id: 'input', label: 'Input', type: 'data' }],
      outputs: [{ id: 'output', label: 'Output', type: 'data' }]
    }
  }
];

export const VisualWorkflowDesigner: React.FC<VisualWorkflowDesignerProps> = ({
  className,
  workflowId,
  onSave,
  onExecute,
  readOnly = false
}) => {
  // State management
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'pan'>('select');
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [nodeConfigDialog, setNodeConfigDialog] = useState<{ node: WorkflowNode; open: boolean }>({ 
    node: null as any, 
    open: false 
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Load workflow data
  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      // Load workflow from API
      const response = await fetch(`/api/workflows/${workflowId}`);
      return response.json();
    },
    enabled: !!workflowId
  });

  // Initialize with workflow data
  useEffect(() => {
    if (workflowData) {
      setNodes(workflowData.nodes || []);
      setEdges(workflowData.edges || []);
    }
  }, [workflowData]);

  // Node operations
  const addNode = useCallback((template: NodeTemplate, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: template.type,
      position,
      data: {
        ...template.defaultData,
        label: template.label
      }
    };

    setNodes(prev => [...prev, newNode]);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: WorkflowNode = {
        ...node,
        id: `node_${Date.now()}`,
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        selected: false
      };
      setNodes(prev => [...prev, newNode]);
    }
  }, [nodes]);

  // Edge operations
  const addEdge = useCallback((sourceId: string, targetId: string) => {
    const edgeId = `edge_${sourceId}_${targetId}`;
    const existingEdge = edges.find(edge => edge.id === edgeId);
    
    if (!existingEdge) {
      const newEdge: WorkflowEdge = {
        id: edgeId,
        source: sourceId,
        target: targetId
      };
      setEdges(prev => [...prev, newEdge]);
    }
  }, [edges]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    setSelectedEdges(prev => prev.filter(id => id !== edgeId));
  }, []);

  // Canvas operations
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
  }, []);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (selectedTool === 'pan' || event.ctrlKey || event.metaKey) {
      setIsPanning(true);
      setPanStart({ x: event.clientX - canvasPosition.x, y: event.clientY - canvasPosition.y });
    }
  }, [selectedTool, canvasPosition]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPanning) {
      setCanvasPosition({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setCanvasScale(prev => Math.max(0.1, Math.min(2, prev + delta)));
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasPosition({ x: 0, y: 0 });
    setCanvasScale(1);
  }, []);

  // Workflow execution
  const executeWorkflow = useCallback(async () => {
    if (!nodes.length) {
      toast.error('No nodes in workflow');
      return;
    }

    const newExecution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      status: 'running',
      startTime: new Date(),
      nodeResults: {},
      logs: []
    };

    setExecution(newExecution);
    setShowExecutionLogs(true);

    // Simulate workflow execution
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      toast.error('No trigger nodes found');
      return;
    }

    // Start execution from trigger nodes
    for (const triggerNode of triggerNodes) {
      await executeNodeSequence(triggerNode, newExecution);
    }

    setExecution(prev => prev ? { ...prev, status: 'completed', endTime: new Date() } : null);
    onExecute?.(workflowId || 'current-workflow');
  }, [nodes, workflowId, onExecute]);

  const executeNodeSequence = async (node: WorkflowNode, execution: WorkflowExecution) => {
    // Update node status
    updateNode(node.id, { executing: true });

    // Add log entry
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      nodeId: node.id,
      message: `Executing ${node.data.label}`
    });

    // Simulate node execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mark as completed
    updateNode(node.id, { executing: false, completed: true });
    execution.nodeResults[node.id] = { success: true, data: `Result from ${node.data.label}` };

    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      nodeId: node.id,
      message: `Completed ${node.data.label}`
    });

    // Execute connected nodes
    const connectedEdges = edges.filter(edge => edge.source === node.id);
    for (const edge of connectedEdges) {
      const nextNode = nodes.find(n => n.id === edge.target);
      if (nextNode) {
        await executeNodeSequence(nextNode, execution);
      }
    }
  };

  const pauseExecution = useCallback(() => {
    setExecution(prev => prev ? { ...prev, status: 'paused' } : null);
  }, []);

  const stopExecution = useCallback(() => {
    setExecution(null);
    // Reset all node states
    setNodes(prev => prev.map(node => ({ 
      ...node, 
      executing: false, 
      completed: false, 
      error: undefined 
    })));
  }, []);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflow = { nodes, edges };
    onSave?.(workflow);
    toast.success('Workflow saved successfully');
  }, [nodes, edges, onSave]);

  // Get node template by type
  const getNodeTemplate = useCallback((type: NodeType) => {
    return nodeTemplates.find(template => template.type === type);
  }, []);

  // Get node color
  const getNodeColor = useCallback((node: WorkflowNode) => {
    const template = getNodeTemplate(node.type);
    return template?.color || 'gray';
  }, [getNodeTemplate]);

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    return nodeTemplates.reduce((groups, template) => {
      const category = template.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
      return groups;
    }, {} as Record<string, NodeTemplate[]>);
  }, []);

  return (
    <div className={cn("h-full flex flex-col bg-slate-900", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">Workflow Designer</h2>
          
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === 'select' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTool('select')}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select Tool</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === 'pan' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTool('pan')}
                >
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pan Tool</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-slate-600 mx-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(0.1)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <span className="text-sm text-slate-400">{Math.round(canvasScale * 100)}%</span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(-0.1)}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCanvas}
                >
                  <Target className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Execution Controls */}
          {execution ? (
            <>
              <Badge className={cn(
                'text-xs',
                execution.status === 'running' && 'bg-blue-500/20 text-blue-400',
                execution.status === 'completed' && 'bg-green-500/20 text-green-400',
                execution.status === 'failed' && 'bg-red-500/20 text-red-400',
                execution.status === 'paused' && 'bg-yellow-500/20 text-yellow-400'
              )}>
                {execution.status}
              </Badge>

              {execution.status === 'running' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pauseExecution}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={stopExecution}
                className="text-red-400 hover:text-red-300"
              >
                <Square className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExecutionLogs(!showExecutionLogs)}
                className="text-slate-400 hover:text-white"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={executeWorkflow}
              disabled={!nodes.length}
              className="text-green-400 hover:text-green-300"
            >
              <Play className="h-4 w-4 mr-2" />
              Execute
            </Button>
          )}

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="text-slate-400 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={saveWorkflow}
            disabled={readOnly}
            className="text-blue-400 hover:text-blue-300"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        <AnimatePresence>
          {showNodePalette && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-800/50 border-r border-slate-700/50 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Node Palette</h3>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-4">
                    {Object.entries(groupedTemplates).map(([category, templates]) => (
                      <div key={category}>
                        <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                          {category}
                        </h4>
                        <div className="space-y-1">
                          {templates.map((template) => (
                            <NodePaletteItem
                              key={template.id}
                              template={template}
                              onAddNode={(template, position) => addNode(template, position)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-900">
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{
              backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
              backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
              backgroundPosition: `${canvasPosition.x}px ${canvasPosition.y}px`
            }}
          >
            {/* Render edges */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasScale})`
              }}
            >
              {edges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;

                const sourceX = sourceNode.position.x + 100; // Node width / 2
                const sourceY = sourceNode.position.y + 30; // Node height / 2
                const targetX = targetNode.position.x;
                const targetY = targetNode.position.y + 30;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`}
                      stroke={edge.selected ? '#3B82F6' : '#475569'}
                      strokeWidth={edge.selected ? 3 : 2}
                      fill="none"
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        edge.animated && 'animate-pulse'
                      )}
                      onClick={() => setSelectedEdges([edge.id])}
                    />
                    <circle
                      cx={targetX}
                      cy={targetY}
                      r="4"
                      fill={edge.selected ? '#3B82F6' : '#475569'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render nodes */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasScale})`
              }}
            >
              {nodes.map((node) => (
                <WorkflowNodeComponent
                  key={node.id}
                  node={node}
                  template={getNodeTemplate(node.type)}
                  selected={selectedNodes.includes(node.id)}
                  onSelect={(nodeId) => setSelectedNodes([nodeId])}
                  onMove={(nodeId, position) => updateNode(nodeId, { position })}
                  onDelete={(nodeId) => deleteNode(nodeId)}
                  onDuplicate={(nodeId) => duplicateNode(nodeId)}
                  onConfigure={(node) => setNodeConfigDialog({ node, open: true })}
                  onConnectTo={(sourceId, targetId) => addEdge(sourceId, targetId)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>

          {/* Minimap */}
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-slate-800/80 border border-slate-700/50 rounded-lg overflow-hidden">
            <div className="w-full h-full relative">
              <div className="text-xs text-slate-400 absolute top-1 left-2">Minimap</div>
              {/* Simplified minimap representation */}
              <div className="absolute inset-2 top-6">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute w-2 h-2 bg-blue-400 rounded-sm"
                    style={{
                      left: `${(node.position.x / 2000) * 100}%`,
                      top: `${(node.position.y / 1000) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <AnimatePresence>
          {showProperties && selectedNodes.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-800/50 border-l border-slate-700/50 overflow-hidden"
            >
              <PropertiesPanel
                nodes={nodes.filter(node => selectedNodes.includes(node.id))}
                onUpdateNode={updateNode}
                readOnly={readOnly}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Execution Logs Panel */}
      <AnimatePresence>
        {showExecutionLogs && execution && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50 bg-slate-800/50 overflow-hidden"
          >
            <ExecutionLogsPanel
              execution={execution}
              onClose={() => setShowExecutionLogs(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node Configuration Dialog */}
      <Dialog open={nodeConfigDialog.open} onOpenChange={(open) => setNodeConfigDialog({ ...nodeConfigDialog, open })}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Configure {nodeConfigDialog.node?.data.label}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Customize the settings for this node
            </DialogDescription>
          </DialogHeader>
          
          {nodeConfigDialog.node && (
            <NodeConfigForm
              node={nodeConfigDialog.node}
              onSave={(updatedNode) => {
                updateNode(updatedNode.id, updatedNode);
                setNodeConfigDialog({ node: null as any, open: false });
              }}
              onCancel={() => setNodeConfigDialog({ node: null as any, open: false })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Node Palette Item Component
interface NodePaletteItemProps {
  template: NodeTemplate;
  onAddNode: (template: NodeTemplate, position: { x: number; y: number }) => void;
}

const NodePaletteItem: React.FC<NodePaletteItemProps> = ({ template, onAddNode }) => {
  const IconComponent = template.icon;
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template));
  };

  const handleClick = () => {
    onAddNode(template, { x: 100, y: 100 });
  };

  return (
    <div
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors group"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        `bg-${template.color}-500/20 group-hover:bg-${template.color}-500/30`
      )}>
        <IconComponent className={cn("h-4 w-4", `text-${template.color}-400`)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{template.label}</p>
        <p className="text-xs text-slate-400 truncate">{template.description}</p>
      </div>
    </div>
  );
};

// Workflow Node Component
interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  template?: NodeTemplate;
  selected: boolean;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, position: { x: number; y: number }) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onConfigure: (node: WorkflowNode) => void;
  onConnectTo: (sourceId: string, targetId: string) => void;
  readOnly: boolean;
}

const WorkflowNodeComponent: React.FC<WorkflowNodeComponentProps> = ({
  node,
  template,
  selected,
  onSelect,
  onMove,
  onDelete,
  onDuplicate,
  onConfigure,
  onConnectTo,
  readOnly
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const IconComponent = template?.icon || Settings;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
    onSelect(node.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !readOnly) {
      onMove(node.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={cn(
        "absolute w-48 bg-slate-800 border-2 rounded-lg shadow-lg transition-all duration-200",
        selected ? "border-blue-500 shadow-blue-500/20" : "border-slate-600",
        node.executing && "border-yellow-500 shadow-yellow-500/20",
        node.completed && "border-green-500 shadow-green-500/20",
        node.error && "border-red-500 shadow-red-500/20",
        !readOnly && "cursor-move hover:shadow-xl"
      )}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Node Header */}
      <div className={cn(
        "flex items-center space-x-2 p-3 rounded-t-lg",
        template && `bg-${template.color}-500/10`
      )}>
        <div className={cn(
          "w-6 h-6 rounded flex items-center justify-center",
          template && `bg-${template.color}-500/20`
        )}>
          {node.executing ? (
            <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
          ) : node.completed ? (
            <CheckCircle className="h-3 w-3 text-green-400" />
          ) : node.error ? (
            <AlertCircle className="h-3 w-3 text-red-400" />
          ) : (
            <IconComponent className={cn("h-3 w-3", template && `text-${template.color}-400`)} />
          )}
        </div>
        <span className="text-sm font-medium text-white truncate flex-1">
          {node.data.label}
        </span>
        
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={() => onConfigure(node)} className="text-slate-300">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(node.id)} className="text-slate-300">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={() => onDelete(node.id)} className="text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Node Content */}
      <div className="p-3 pt-0">
        {node.data.description && (
          <p className="text-xs text-slate-400 mb-2 line-clamp-2">
            {node.data.description}
          </p>
        )}
        
        {/* Input/Output Ports */}
        <div className="space-y-1">
          {node.data.inputs?.map((input) => (
            <div key={input.id} className="flex items-center text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-slate-600 mr-2" />
              {input.label}
              {input.required && <span className="text-red-400 ml-1">*</span>}
            </div>
          ))}
          {node.data.outputs?.map((output) => (
            <div key={output.id} className="flex items-center justify-end text-xs text-slate-400">
              {output.label}
              <div className="w-2 h-2 rounded-full bg-slate-600 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Connection Points */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
        <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-800" />
      </div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
        <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-800" />
      </div>
    </div>
  );
};

// Properties Panel Component
interface PropertiesPanelProps {
  nodes: WorkflowNode[];
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  readOnly: boolean;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nodes, onUpdateNode, readOnly }) => {
  const node = nodes[0]; // For now, just show properties for the first selected node

  if (!node) return null;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Properties</h3>
      <div className="space-y-4">
        <div>
          <Label className="text-slate-300">Name</Label>
          <Input
            value={node.data.label}
            onChange={(e) => onUpdateNode(node.id, {
              data: { ...node.data, label: e.target.value }
            })}
            disabled={readOnly}
            className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
          />
        </div>
        
        <div>
          <Label className="text-slate-300">Description</Label>
          <Textarea
            value={node.data.description || ''}
            onChange={(e) => onUpdateNode(node.id, {
              data: { ...node.data, description: e.target.value }
            })}
            disabled={readOnly}
            className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-slate-300">Position</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input
              type="number"
              placeholder="X"
              value={node.position.x}
              onChange={(e) => onUpdateNode(node.id, {
                position: { ...node.position, x: parseInt(e.target.value) || 0 }
              })}
              disabled={readOnly}
              className="bg-slate-700/30 border-slate-600/30 text-white"
            />
            <Input
              type="number"
              placeholder="Y"
              value={node.position.y}
              onChange={(e) => onUpdateNode(node.id, {
                position: { ...node.position, y: parseInt(e.target.value) || 0 }
              })}
              disabled={readOnly}
              className="bg-slate-700/30 border-slate-600/30 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Execution Logs Panel Component
interface ExecutionLogsPanelProps {
  execution: WorkflowExecution;
  onClose: () => void;
}

const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({ execution, onClose }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">Execution Logs</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {execution.logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2 text-xs">
              <span className="text-slate-500 w-16 flex-shrink-0">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                log.level === 'error' && "bg-red-500",
                log.level === 'warning' && "bg-yellow-500",
                log.level === 'info' && "bg-blue-500"
              )} />
              <span className="text-slate-300 flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Node Configuration Form Component
interface NodeConfigFormProps {
  node: WorkflowNode;
  onSave: (node: WorkflowNode) => void;
  onCancel: () => void;
}

const NodeConfigForm: React.FC<NodeConfigFormProps> = ({ node, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    label: node.data.label,
    description: node.data.description || '',
    config: { ...node.data.config }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...node,
      data: {
        ...node.data,
        label: formData.label,
        description: formData.description,
        config: formData.config
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label className="text-slate-300">Label</Label>
        <Input
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
        />
      </div>
      
      <div>
        <Label className="text-slate-300">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 bg-slate-700/30 border-slate-600/30 text-white"
          rows={3}
        />
      </div>

      {/* Node-specific configuration fields would go here */}
      <div>
        <Label className="text-slate-300">Configuration</Label>
        <Textarea
          value={JSON.stringify(formData.config, null, 2)}
          onChange={(e) => {
            try {
              const config = JSON.parse(e.target.value);
              setFormData(prev => ({ ...prev, config }));
            } catch {
              // Invalid JSON, don't update
            }
          }}
          className="mt-1 bg-slate-700/30 border-slate-600/30 text-white font-mono text-xs"
          rows={8}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default VisualWorkflowDesigner;