/**
 * Autonomous Workflows Page
 * Manage proactive and autonomous workflows
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autonomousWorkflowService, type AutonomousWorkflow, type StandingOrder } from '@/services/autonomous-workflow-service';
import { toast } from 'sonner';

interface AutonomousWorkflowsPageProps {
  className?: string;
}

export const AutonomousWorkflowsPage: React.FC<AutonomousWorkflowsPageProps> = ({ className }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch standing orders
  const { data: standingOrders = [], isLoading } = useQuery<StandingOrder[]>({
    queryKey: ['standing-orders'],
    queryFn: () => autonomousWorkflowService.getStandingOrders('current-user-id'),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create standing order mutation
  const createStandingOrderMutation = useMutation({
    mutationFn: async (orderData: {
      name: string;
      description: string;
      workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'>;
    }) => {
      return autonomousWorkflowService.createStandingOrder(
        'current-user-id',
        orderData.name,
        orderData.description,
        orderData.workflow
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] });
      setShowCreateForm(false);
      toast.success('Standing order created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create standing order');
      console.error('Create standing order error:', error);
    },
  });

  // Toggle standing order mutation
  const toggleStandingOrderMutation = useMutation({
    mutationFn: async ({ orderId, isActive }: { orderId: string; isActive: boolean }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] });
    },
  });

  const getStatusIcon = (status: AutonomousWorkflow['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: AutonomousWorkflow['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getFrequencyIcon = (frequency: AutonomousWorkflow['schedule']['frequency']) => {
    switch (frequency) {
      case 'hourly':
        return <Clock className="h-4 w-4" />;
      case 'daily':
        return <Calendar className="h-4 w-4" />;
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      case 'monthly':
        return <Calendar className="h-4 w-4" />;
      case 'custom':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatNextRun = (nextRun?: Date) => {
    if (!nextRun) return 'Not scheduled';
    
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Running now';
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    return `In ${days}d`;
  };

  const handleCreateStandingOrder = (formData: {
    name: string;
    description: string;
    frequency: AutonomousWorkflow['schedule']['frequency'];
    time?: string;
  }) => {
    const workflow: Omit<AutonomousWorkflow, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      description: formData.description,
      trigger: {
        type: 'schedule',
        config: {},
      },
      actions: [
        {
          id: 'action-1',
          type: 'ai_task',
          config: {
            task: 'Analyze data and generate insights',
            model: 'gpt-4',
          },
        },
        {
          id: 'action-2',
          type: 'notification',
          config: {
            type: 'email',
            subject: 'Daily Analysis Report',
            template: 'analysis-report',
          },
        },
      ],
      conditions: [],
      schedule: {
        frequency: formData.frequency,
        time: formData.time,
      },
      status: 'active',
      runCount: 0,
      successRate: 0,
    };

    createStandingOrderMutation.mutate({
      name: formData.name,
      description: formData.description,
      workflow,
    });
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Autonomous Workflows</h1>
          <p className="text-muted-foreground">
            Set up proactive automation that runs without your intervention
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Standing Order
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Standing Order</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingOrderForm
              onSubmit={handleCreateStandingOrder}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createStandingOrderMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Standing Orders */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : standingOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Standing Orders</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first standing order to automate recurring tasks.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Standing Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          standingOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{order.name}</h3>
                      <Badge className={cn('text-xs', getStatusColor(order.workflow.status))}>
                        {order.workflow.status}
                      </Badge>
                      {order.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{order.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {getFrequencyIcon(order.workflow.schedule.frequency)}
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">{order.workflow.schedule.frequency}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-muted-foreground">Next Run:</span>
                        <span className="font-medium">{formatNextRun(order.workflow.nextRun)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-muted-foreground">Runs:</span>
                        <span className="font-medium">{order.workflow.runCount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="font-medium">{Math.round(order.workflow.successRate * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Switch
                      checked={order.isActive}
                      onCheckedChange={(checked) => 
                        toggleStandingOrderMutation.mutate({ 
                          orderId: order.id, 
                          isActive: checked 
                        })
                      }
                      disabled={toggleStandingOrderMutation.isPending}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkflow(selectedWorkflow === order.id ? null : order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Workflow Details */}
                {selectedWorkflow === order.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-3">Workflow Details</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Actions:</span>
                        <div className="mt-1 space-y-1">
                          {order.workflow.actions.map((action, index) => (
                            <div key={action.id} className="flex items-center space-x-2 text-sm">
                              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <span className="capitalize">{action.type.replace('_', ' ')}</span>
                              <Badge variant="outline" className="text-xs">
                                {action.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {order.workflow.lastRun && (
                        <div>
                          <span className="text-sm font-medium">Last Run:</span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            {order.workflow.lastRun.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Standing Order Form Component
interface StandingOrderFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    frequency: AutonomousWorkflow['schedule']['frequency'];
    time?: string;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const StandingOrderForm: React.FC<StandingOrderFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as AutonomousWorkflow['schedule']['frequency'],
    time: '09:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Daily Analytics Report"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this standing order does..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <select
            id="frequency"
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as AutonomousWorkflow['schedule']['frequency'] }))}
            className="w-full mt-1 px-3 py-2 border rounded-md"
            required
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            disabled={formData.frequency === 'hourly'}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Standing Order
        </Button>
      </div>
    </form>
  );
};
