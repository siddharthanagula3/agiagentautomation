import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIEmployee {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  status: 'idle' | 'working' | 'thinking';
}

interface EmployeeSelectorProps {
  employees: AIEmployee[];
  selectedEmployees: string[];
  onSelectEmployee: (employeeId: string) => void;
  onDeselectEmployee: (employeeId: string) => void;
  onAddEmployee: () => void;
  mode: 'single' | 'multi';
  onToggleMode: () => void;
}

export function EmployeeSelector({
  employees,
  selectedEmployees,
  onSelectEmployee,
  onDeselectEmployee,
  onAddEmployee,
  mode,
  onToggleMode
}: EmployeeSelectorProps) {
  const handleEmployeeClick = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      onDeselectEmployee(employeeId);
    } else {
      if (mode === 'single') {
        // In single mode, replace current selection
        selectedEmployees.forEach(id => onDeselectEmployee(id));
      }
      onSelectEmployee(employeeId);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Mode Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMode}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            mode === 'single'
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
          )}
        >
          {mode === 'single' ? '1:1' : 'Team'}
        </button>
      </div>

      {/* Employee Avatars */}
      <div className="flex items-center space-x-2">
        {employees.map((employee) => (
          <TooltipProvider key={employee.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleEmployeeClick(employee.id)}
                  className={cn(
                    "relative transition-all duration-200 hover:scale-110",
                    selectedEmployees.includes(employee.id) && "ring-2 ring-purple-500 ring-offset-2"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback 
                      className="text-white font-semibold"
                      style={{ backgroundColor: employee.color }}
                    >
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                    employee.status === 'working' && "bg-green-500",
                    employee.status === 'thinking' && "bg-yellow-500",
                    employee.status === 'idle' && "bg-gray-400"
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.description}</div>
                  <div className="text-xs capitalize">{employee.status}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Add Employee Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddEmployee}
                className="h-10 w-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div>Add AI Employee</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Selected Count */}
      {selectedEmployees.length > 0 && (
        <Badge variant="secondary" className="ml-2">
          {selectedEmployees.length} selected
        </Badge>
      )}

      {/* Team Mode Indicator */}
      {mode === 'multi' && selectedEmployees.length > 1 && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-1" />
          Team Mode
        </div>
      )}
    </div>
  );
}
