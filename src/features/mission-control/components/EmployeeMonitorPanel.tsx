/**
 * Workforce Status Panel
 * Displays active AI employees and their current status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { Bot, Loader2, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { useActiveEmployees } from '@shared/stores/mission-control-store';
import type { ActiveEmployee } from '@shared/stores/mission-control-store';

const getStatusColor = (status: ActiveEmployee['status']) => {
  switch (status) {
    case 'thinking':
      return 'bg-blue-500';
    case 'using_tool':
      return 'bg-purple-500';
    case 'idle':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: ActiveEmployee['status']) => {
  switch (status) {
    case 'thinking':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'using_tool':
      return <Wrench className="h-4 w-4" />;
    case 'idle':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Bot className="h-4 w-4" />;
  }
};

const getStatusLabel = (status: ActiveEmployee['status']) => {
  switch (status) {
    case 'thinking':
      return 'Thinking';
    case 'using_tool':
      return 'Using Tool';
    case 'idle':
      return 'Idle';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

export const WorkforceStatusPanel: React.FC = () => {
  const activeEmployeesRecord = useActiveEmployees();
  // activeEmployees is now a Record, not a Map
  const activeEmployees = Object.values(activeEmployeesRecord);

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Active Workforce
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {activeEmployees.length}{' '}
          {activeEmployees.length === 1 ? 'employee' : 'employees'} active
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot className="mb-3 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No employees active</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a mission to deploy your AI workforce
            </p>
          </div>
        ) : (
          activeEmployees.map((employee, index) => (
            <motion.div
              key={employee.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border bg-card/50 p-3 transition-all hover:bg-card"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${employee.name}`}
                    alt={employee.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Employee Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {employee.name}
                      </p>
                      {employee.currentTask && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {employee.currentTask}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getStatusColor(employee.status)} bg-opacity-10 text-xs`}
                    >
                      {getStatusIcon(employee.status)}
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  {employee.status !== 'idle' &&
                    employee.status !== 'error' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium text-foreground">
                            {employee.progress}%
                          </span>
                        </div>
                        <Progress value={employee.progress} className="h-1.5" />
                      </div>
                    )}

                  {/* Current Tool */}
                  {employee.currentTool && (
                    <div className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Using: {employee.currentTool}
                      </span>
                    </div>
                  )}

                  {/* Recent Log Entry */}
                  {employee.log.length > 0 && (
                    <div className="rounded bg-muted/30 px-2 py-1.5">
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {employee.log[employee.log.length - 1]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
