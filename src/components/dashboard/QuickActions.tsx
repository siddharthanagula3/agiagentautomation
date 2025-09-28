/**
 * Quick Actions Component
 * Provides quick access to common tasks and workflows
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Bot, 
  Users, 
  Workflow, 
  BarChart3, 
  Settings,
  Zap,
  FileText,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onAction?: (actionId: string) => void;
  className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'create-employee',
    title: 'Hire AI Employee',
    description: 'Add a new AI agent to your workforce',
    icon: Bot,
    action: () => {},
    variant: 'default',
  },
  {
    id: 'create-project',
    title: 'Start New Project',
    description: 'Submit a project to the AI Workforce',
    icon: Workflow,
    action: () => {},
    variant: 'default',
  },
  {
    id: 'view-marketplace',
    title: 'Browse Marketplace',
    description: 'Explore available AI employees',
    icon: Users,
    action: () => {},
    variant: 'outline',
  },
  {
    id: 'view-analytics',
    title: 'View Analytics',
    description: 'Check performance and usage metrics',
    icon: BarChart3,
    action: () => {},
    variant: 'outline',
  },
  {
    id: 'upload-files',
    title: 'Upload Files',
    description: 'Add documents for AI processing',
    icon: FileText,
    action: () => {},
    variant: 'secondary',
  },
  {
    id: 'connect-integration',
    title: 'Connect Integration',
    description: 'Link external services and APIs',
    icon: Database,
    action: () => {},
    variant: 'secondary',
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  onAction,
  className,
}) => {
  const handleAction = (action: QuickAction) => {
    action.action();
    onAction?.(action.id);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                className={cn(
                  'h-auto p-4 flex flex-col items-start space-y-2',
                  action.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !action.disabled && handleAction(action)}
                disabled={action.disabled}
              >
                <div className="flex items-center space-x-2 w-full">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{action.title}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {action.description}
                </p>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Need help getting started?</h4>
              <p className="text-xs text-muted-foreground">
                Check out our guides and tutorials
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Help
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
