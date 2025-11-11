import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Bot,
  FileText,
  Terminal,
  Code,
  Database,
  Globe,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkStreamItem {
  id: string;
  type:
    | 'file_write'
    | 'command_exec'
    | 'code_analysis'
    | 'web_search'
    | 'thinking';
  content: string;
  timestamp: Date;
  status: 'active' | 'completed' | 'error';
  details?: string;
  filePath?: string;
  command?: string;
  output?: string;
}

interface EmployeeWorkStreamProps {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeColor?: string;
  workItems: WorkStreamItem[];
  isActive: boolean;
}

export function EmployeeWorkStream({
  employeeId,
  employeeName,
  employeeAvatar,
  employeeColor,
  workItems,
  isActive,
}: EmployeeWorkStreamProps) {
  const getItemIcon = (type: WorkStreamItem['type']) => {
    switch (type) {
      case 'file_write':
        return <FileText className="h-4 w-4" />;
      case 'command_exec':
        return <Terminal className="h-4 w-4" />;
      case 'code_analysis':
        return <Code className="h-4 w-4" />;
      case 'web_search':
        return <Globe className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getItemColor = (type: WorkStreamItem['type']) => {
    switch (type) {
      case 'file_write':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'command_exec':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'code_analysis':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'web_search':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employeeAvatar} />
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: employeeColor || '#6366f1' }}
            >
              {employeeName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {employeeName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isActive ? 'Working...' : 'Idle'}
            </div>
          </div>
          {isActive && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Work Stream */}
      <ScrollArea className="max-h-64">
        <div className="space-y-3 p-4">
          {workItems.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <Bot className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No work activity yet</p>
            </div>
          ) : (
            workItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start space-x-3 rounded-lg p-3 transition-all duration-200',
                  getItemColor(item.type),
                  item.status === 'active' &&
                    'ring-2 ring-blue-500 ring-opacity-50'
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getItemIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    <span className="text-sm font-medium">{item.content}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        item.status === 'active' &&
                          'border-blue-500 text-blue-600',
                        item.status === 'completed' &&
                          'border-green-500 text-green-600',
                        item.status === 'error' && 'border-red-500 text-red-600'
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  {item.filePath && (
                    <div className="mb-1 flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <FileText className="mr-1 h-3 w-3" />
                      {item.filePath}
                    </div>
                  )}

                  {item.command && (
                    <div className="mb-1 flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Terminal className="mr-1 h-3 w-3" />
                      {item.command}
                    </div>
                  )}

                  {item.details && (
                    <div className="mt-2 rounded bg-gray-100 p-2 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {item.details}
                    </div>
                  )}

                  {item.output && (
                    <div className="mt-2 rounded bg-gray-900 p-2 font-mono text-xs text-gray-700 text-green-400 dark:bg-gray-900 dark:text-gray-300">
                      <Terminal className="mr-1 inline h-3 w-3" />
                      {item.output}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {isActive && (
        <div className="border-t border-gray-200 bg-blue-50 p-3 dark:border-gray-700 dark:bg-blue-900/20">
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{employeeName} is working...</span>
          </div>
        </div>
      )}
    </div>
  );
}
